import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        name: registerDto.name,
        passwordHash,
        role: registerDto.role,
        department: registerDto.department,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken: token,
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      createdAt: user.createdAt,
    };

    return {
      accessToken: token,
      user: userProfile,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email.toLowerCase() },
    });

    if (!user) {
      // Don't leak user existence for security
      return { message: 'If an account exists with that email, a password reset link has been dispatched.' };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { sub: user.id, purpose: 'password_reset' },
      { expiresIn: '1h' },
    );

    // Save verification token in DB
    await this.prisma.verification.create({
      data: {
        identifier: user.email,
        value: resetToken,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    return {
      message: 'If an account exists with that email, a password reset link has been dispatched.',
      resetToken, // Returned for testing / development API response
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(resetPasswordDto.token);
      if (payload.purpose !== 'password_reset') {
        throw new UnauthorizedException('Invalid reset token purpose');
      }

      const verification = await this.prisma.verification.findFirst({
        where: { value: resetPasswordDto.token },
      });

      if (!verification || verification.expiresAt < new Date()) {
        throw new UnauthorizedException('Reset token expired or invalid');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, salt);

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash },
      });

      await this.prisma.verification.delete({
        where: { id: verification.id },
      });

      return { message: 'Password reset successful. You may now sign in with your new password.' };
    } catch {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }
}
