import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile if found', async () => {
      const mockUser = { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', role: Role.AGENT, department: 'Customer Support' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('u1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.user.update.mockResolvedValue({ id: 'u1', name: 'Jane Smith' });

      const result = await service.updateProfile('u1', { name: 'Jane Smith' });
      expect(result).toEqual({ id: 'u1', name: 'Jane Smith' });
    });
  });

  describe('changePassword', () => {
    it('should change password when current password matches', async () => {
      const hashed = await bcrypt.hash('oldPassword123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: hashed });
      mockPrismaService.user.update.mockResolvedValue({ id: 'u1' });

      const result = await service.changePassword('u1', { currentPassword: 'oldPassword123', newPassword: 'newPassword123' });
      expect(result).toEqual({ message: 'Password updated successfully' });
    });

    it('should throw BadRequestException if current password is wrong', async () => {
      const hashed = await bcrypt.hash('oldPassword123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: hashed });

      await expect(service.changePassword('u1', { currentPassword: 'wrongPassword', newPassword: 'newPassword123' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated user list', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([{ id: 'u1' }]);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });
      expect(result.data).toEqual([{ id: 'u1' }]);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.user.update.mockResolvedValue({ id: 'u1', role: Role.ADMIN });

      const result = await service.updateRole('u1', Role.ADMIN);
      expect(result.role).toBe(Role.ADMIN);
    });
  });
});
