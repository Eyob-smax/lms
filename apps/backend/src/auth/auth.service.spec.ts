import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register()', () => {
    const registerDto = {
      email: 'sdr.agent@bpo.com',
      name: 'John SDR',
      password: 'password123',
      role: Role.AGENT,
      department: 'SDR',
    };

    it('should register a new user successfully and return access token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'sdr.agent@bpo.com',
        name: 'John SDR',
        role: Role.AGENT,
        department: 'SDR',
        createdAt: new Date(),
      });

      const result = await authService.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'sdr.agent@bpo.com' },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-123',
        email: 'sdr.agent@bpo.com',
        role: Role.AGENT,
      });
      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: expect.objectContaining({
          id: 'user-123',
          email: 'sdr.agent@bpo.com',
        }),
      });
    });

    it('should throw ConflictException if user with email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-existing' });

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login()', () => {
    const loginDto = {
      email: 'admin@bpo.com',
      password: 'adminpassword',
    };

    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      const dbUser = {
        id: 'admin-1',
        email: 'admin@bpo.com',
        name: 'Admin Lead',
        passwordHash: hashedPassword,
        role: Role.ADMIN,
        department: 'Management',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(dbUser);

      const result = await authService.login(loginDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toEqual({
        id: 'admin-1',
        email: 'admin@bpo.com',
        name: 'Admin Lead',
        role: Role.ADMIN,
        department: 'Management',
        createdAt: dbUser.createdAt,
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('differentpassword', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@bpo.com',
        passwordHash: hashedPassword,
      });

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
