import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    course: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    lessonProgress: {
      findMany: jest.fn(),
    },
    quizAttempt: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminOverview', () => {
    it('should return admin overview dashboard data', async () => {
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.course.count.mockResolvedValue(10);
      mockPrismaService.enrollment.count.mockResolvedValue(50);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.course.findMany.mockResolvedValue([]);
      mockPrismaService.enrollment.findMany.mockResolvedValue([]);

      const result = await service.getAdminOverview({});

      expect(result.overview.totalUsers).toBe(100);
      expect(result.overview.activeCourses).toBe(10);
      expect(result.departmentPerformance).toBeDefined();
      expect(result.learningProgressTimeline).toHaveLength(6);
    });
  });

  describe('getLearnerPerformance', () => {
    it('should return learner personal stats and trends', async () => {
      mockPrismaService.lessonProgress.findMany.mockResolvedValue([
        { lesson: { durationMinutes: 30 } },
      ]);
      mockPrismaService.quizAttempt.findMany.mockResolvedValue([
        { scorePct: 90 },
      ]);
      mockPrismaService.enrollment.findMany.mockResolvedValue([]);

      const result = await service.getLearnerPerformance('u1');

      expect(result.summary.weeklyLearningHours).toBe(0.5);
      expect(result.summary.avgQuizScore).toBe(90);
      expect(result.quizScoreTrends).toHaveLength(6);
    });
  });

  describe('getLeaderboard', () => {
    it('should return ranked agent leaderboard', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          name: 'Agent 1',
          email: 'agent1@lms.com',
          department: 'Sales',
          enrollments: [{ status: 'COMPLETED', finalScorePct: 95 }],
        },
      ]);

      const leaderboard = await service.getLeaderboard(5);

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].completedCoursesCount).toBe(1);
      expect(leaderboard[0].averageScorePct).toBe(95);
    });
  });

  describe('exportReport', () => {
    it('should return downloadable report data', async () => {
      mockPrismaService.enrollment.findMany.mockResolvedValue([
        {
          user: { name: 'Agent 1', email: 'agent1@lms.com', department: 'Sales' },
          course: { courseCode: 'CRS-2024-001', title: 'Sales 101', category: 'Sales' },
          status: 'COMPLETED',
          overallProgressPct: 100,
          finalScorePct: 95,
          createdAt: new Date(),
          completedAt: new Date(),
        },
      ]);

      const report = await service.exportReport({});

      expect(report.totalRecords).toBe(1);
      expect(report.data[0].courseCode).toBe('CRS-2024-001');
    });
  });
});
