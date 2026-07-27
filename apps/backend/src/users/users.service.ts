import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const emailLower = dto.email.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (user) {
      if (user.isActive && user.passwordHash) {
        throw new BadRequestException('A user account with this email address already exists and is active.');
      }
      // Re-invite pending/unactivated user by updating their role/department/name if modified
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: dto.name || user.name,
          role: dto.role || user.role,
          department: dto.department || user.department,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          passwordHash: true,
          createdAt: true,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: emailLower,
          name: dto.name,
          role: dto.role || Role.AGENT,
          department: dto.department || 'General Operations',
          passwordHash: null,
          isActive: false,
          emailVerified: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          passwordHash: true,
          createdAt: true,
        },
      });
    }

    // Generate secure 32-byte hex invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Remove old verification tokens for this email
    await this.prisma.verification.deleteMany({
      where: { identifier: emailLower },
    });

    await this.prisma.verification.create({
      data: {
        identifier: emailLower,
        value: inviteToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days expiry
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/accept-invite?token=${inviteToken}&email=${encodeURIComponent(user.email)}`;

    // Dispatch invitation email
    try {
      await this.emailService.sendInvitationEmail(user.email, user.name, user.role, user.department, undefined, inviteLink);
    } catch (err) {
      console.error('Failed to dispatch invitation email:', err);
    }

    return {
      ...user,
      invited: true,
      inviteLink,
      inviteToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        image: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.passwordHash) {
      throw new BadRequestException('User account was created using OAuth. Password cannot be updated.');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password updated successfully' };
  }

  async findAll(query: QueryUsersDto) {
    const { page = 1, pageSize = 10, search, department, role, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          image: true,
          createdAt: true,
          _count: {
            select: { enrollments: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: users,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async checkUserExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const [enrollments, quizAttempts, certificates] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              courseCode: true,
              category: true,
              difficulty: true,
              durationMinutes: true,
            },
          },
        },
      }),
      this.prisma.quizAttempt.findMany({
        where: { enrollment: { userId: id } },
        orderBy: { startedAt: 'desc' },
        include: {
          quiz: {
            select: { id: true, title: true, passingScorePct: true, courseId: true },
          },
          enrollment: {
            select: {
              course: { select: { id: true, title: true, courseCode: true } },
            },
          },
        },
      }),
      this.prisma.certificate.findMany({
        where: { userId: id },
        orderBy: { requestedAt: 'desc' },
        include: {
          enrollment: {
            select: {
              course: { select: { id: true, title: true, courseCode: true } },
            },
          },
        },
      }),
    ]);

    const totalEnrolled = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const inProgressCourses = enrollments.filter((e) => e.status === 'IN_PROGRESS').length;
    const notStartedCourses = enrollments.filter((e) => e.status === 'NOT_STARTED').length;

    const totalProgress = enrollments.reduce((sum, e) => sum + (e.overallProgressPct || 0), 0);
    const averageProgressPct = totalEnrolled > 0 ? Math.round(totalProgress / totalEnrolled) : 0;

    const totalQuizAttempts = quizAttempts.length;
    const passedQuizzes = quizAttempts.filter((q) => q.isPassed).length;
    const totalQuizScore = quizAttempts.reduce((sum, q) => sum + (q.scorePct || 0), 0);
    const averageQuizScore = totalQuizAttempts > 0 ? Math.round(totalQuizScore / totalQuizAttempts) : 0;

    const totalLearningMinutes = enrollments
      .filter((e) => e.status === 'COMPLETED')
      .reduce((sum, e: any) => sum + (e.course?.durationMinutes || 0), 0);
    const totalLearningHours = +(totalLearningMinutes / 60).toFixed(1);

    const completionRate = totalEnrolled > 0 ? Math.round((completedCourses / totalEnrolled) * 100) : 0;

    return {
      ...user,
      stats: {
        totalEnrolled,
        completedCourses,
        inProgressCourses,
        notStartedCourses,
        averageProgressPct,
        totalCertificates: certificates.filter((c) => c.status === 'APPROVED').length,
        totalQuizAttempts,
        passedQuizzes,
        averageQuizScore,
        totalLearningHours,
        completionRate,
      },
      enrollments,
      quizAttempts,
      certificates,
    };
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.checkUserExists(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
      },
    });
  }

  async updateDepartment(id: string, department: string) {
    await this.checkUserExists(id);

    return this.prisma.user.update({
      where: { id },
      data: { department },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
      },
    });
  }

  async updateRole(id: string, role: Role) {
    await this.checkUserExists(id);

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
      },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.checkUserExists(id);

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        image: true,
        updatedAt: true,
      },
    });
  }
}
