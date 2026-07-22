import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    course: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    lessonProgress: {
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    quizAttempt: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = moduleFixture.get<EnrollmentsService>(EnrollmentsService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assignCourse()', () => {
    it('should assign course to user IDs list', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      mockPrismaService.enrollment.create.mockResolvedValue({ id: 'enr-1', userId: 'u-1', courseId: 'c-1' });

      const dto = { courseId: 'c-1', userIds: ['u-1'] };
      const res = await service.assignCourse(dto, 'admin-1');

      expect(res.assignedCount).toBe(1);
      expect(mockPrismaService.enrollment.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if neither userIds nor department specified', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({ id: 'c-1' });

      await expect(service.assignCourse({ courseId: 'c-1' }, 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('markLessonComplete()', () => {
    it('should mark lesson complete and update overall progress %', async () => {
      const mockEnrollment = {
        id: 'enr-1',
        userId: 'u-1',
        course: {
          modules: [
            {
              lessons: [{ id: 'les-1' }, { id: 'les-2' }],
            },
          ],
        },
      };

      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrismaService.lessonProgress.findFirst.mockResolvedValue(null);
      mockPrismaService.lessonProgress.create.mockResolvedValue({ id: 'lp-1' });
      mockPrismaService.lessonProgress.count.mockResolvedValue(1); // 1 out of 2 = 50%
      mockPrismaService.enrollment.update.mockResolvedValue({
        id: 'enr-1',
        overallProgressPct: 50,
        status: EnrollmentStatus.IN_PROGRESS,
      });

      const res = await service.markLessonComplete({ enrollmentId: 'enr-1', lessonId: 'les-1' }, 'u-1');

      expect(mockPrismaService.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enr-1' },
        data: expect.objectContaining({ overallProgressPct: 50, status: EnrollmentStatus.IN_PROGRESS }),
        include: { lessonProgress: true },
      });
      expect(res.overallProgressPct).toBe(50);
    });
  });
});
