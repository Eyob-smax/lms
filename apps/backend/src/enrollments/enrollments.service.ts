import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignCourseDto } from './dto/assign-course.dto';
import { MarkLessonCompleteDto } from './dto/mark-lesson-complete.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async assignCourse(dto: AssignCourseDto, adminUserId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID "${dto.courseId}" not found`);
    }

    let targetUserIds: string[] = [];

    if (dto.userIds && dto.userIds.length > 0) {
      targetUserIds = dto.userIds;
    } else if (dto.department) {
      const usersInDept = await this.prisma.user.findMany({
        where: { department: { equals: dto.department, mode: 'insensitive' } },
        select: { id: true },
      });
      targetUserIds = usersInDept.map((u) => u.id);
    } else {
      throw new BadRequestException('Must specify either userIds array or target department');
    }

    const createdEnrollments = [];
    for (const userId of targetUserIds) {
      const existing = await this.prisma.enrollment.findFirst({
        where: { userId, courseId: dto.courseId },
      });

      if (!existing) {
        const enrollment = await this.prisma.enrollment.create({
          data: {
            userId,
            courseId: dto.courseId,
            assignedBy: adminUserId,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            isMandatory: dto.isMandatory !== undefined ? dto.isMandatory : true,
            status: EnrollmentStatus.NOT_STARTED,
            overallProgressPct: 0,
          },
          include: {
            user: { select: { id: true, name: true, email: true, department: true } },
            course: { select: { id: true, title: true, category: true } },
          },
        });
        createdEnrollments.push(enrollment);
      }
    }

    return {
      assignedCount: createdEnrollments.length,
      enrollments: createdEnrollments,
    };
  }

  async findUserEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: {
            _count: { select: { modules: true, quizzes: true } },
          },
        },
        lessonProgress: true,
        quizAttempts: {
          orderBy: { startedAt: 'desc' },
        },
      },
    });
  }

  async markLessonComplete(dto: MarkLessonCompleteDto, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: true },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID "${dto.enrollmentId}" not found`);
    }

    if (enrollment.userId !== userId) {
      throw new BadRequestException('Cannot modify enrollment belonging to another user');
    }

    const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
    const targetLesson = allLessons.find((l) => l.id === dto.lessonId);
    if (!targetLesson) {
      throw new NotFoundException(`Lesson with ID "${dto.lessonId}" does not belong to this course`);
    }

    const existingProgress = await this.prisma.lessonProgress.findFirst({
      where: { enrollmentId: dto.enrollmentId, lessonId: dto.lessonId },
    });

    if (!existingProgress) {
      await this.prisma.lessonProgress.create({
        data: {
          enrollmentId: dto.enrollmentId,
          lessonId: dto.lessonId,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    const completedProgressCount = await this.prisma.lessonProgress.count({
      where: { enrollmentId: dto.enrollmentId, isCompleted: true },
    });

    const totalLessons = allLessons.length;
    const overallProgressPct = totalLessons > 0 ? Math.round((completedProgressCount / totalLessons) * 100) : 100;
    const status = overallProgressPct === 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.IN_PROGRESS;

    return this.prisma.enrollment.update({
      where: { id: dto.enrollmentId },
      data: {
        overallProgressPct,
        status,
        completedAt: status === EnrollmentStatus.COMPLETED ? new Date() : null,
      },
      include: {
        lessonProgress: true,
      },
    });
  }

  async getReports() {
    const totalUsers = await this.prisma.user.count({ where: { role: 'AGENT' } });
    const totalEnrollments = await this.prisma.enrollment.count();
    const completedEnrollments = await this.prisma.enrollment.count({ where: { status: EnrollmentStatus.COMPLETED } });
    const totalAttempts = await this.prisma.quizAttempt.count();
    const passedAttempts = await this.prisma.quizAttempt.count({ where: { isPassed: true } });

    const completionRatePct = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
    const passRatePct = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

    return {
      metrics: {
        totalAgents: totalUsers,
        totalEnrollments,
        completedEnrollments,
        completionRatePct,
        totalQuizAttempts: totalAttempts,
        passRatePct,
      },
    };
  }
}
