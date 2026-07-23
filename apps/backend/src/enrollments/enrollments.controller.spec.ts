import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  let service: EnrollmentsService;

  const mockEnrollmentsService = {
    assignCourse: jest.fn(),
    assignCohort: jest.fn(),
    findUserEnrollments: jest.fn(),
    markLessonComplete: jest.fn(),
    getReports: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [{ provide: EnrollmentsService, useValue: mockEnrollmentsService }],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
    service = module.get<EnrollmentsService>(EnrollmentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('assignCourse', async () => {
    mockEnrollmentsService.assignCourse.mockResolvedValue({ assignedCount: 1 });
    const dto = { courseId: 'c1', userIds: ['u1'] };
    const res = await controller.assignCourse(dto, 'admin-1');
    expect(res).toEqual({ assignedCount: 1 });
    expect(mockEnrollmentsService.assignCourse).toHaveBeenCalledWith(dto, 'admin-1');
  });

  it('assignCohort', async () => {
    mockEnrollmentsService.assignCohort.mockResolvedValue({ assignedCount: 2, cohortSummary: { cohortName: 'SDR Batch 1' } });
    const dto = { courseId: 'c1', department: 'SDR', targetRole: Role.AGENT };
    const res = await controller.assignCohort(dto, 'admin-1');
    expect(res.assignedCount).toBe(2);
    expect(mockEnrollmentsService.assignCohort).toHaveBeenCalledWith(dto, 'admin-1');
  });

  it('findMyEnrollments', async () => {
    mockEnrollmentsService.findUserEnrollments.mockResolvedValue([]);
    const res = await controller.findMyEnrollments('u1');
    expect(res).toEqual([]);
    expect(mockEnrollmentsService.findUserEnrollments).toHaveBeenCalledWith('u1');
  });

  it('markLessonComplete', async () => {
    mockEnrollmentsService.markLessonComplete.mockResolvedValue({ overallProgressPct: 100 });
    const dto = { enrollmentId: 'e1', lessonId: 'l1' };
    const res = await controller.markLessonComplete(dto, 'u1');
    expect(res).toEqual({ overallProgressPct: 100 });
    expect(mockEnrollmentsService.markLessonComplete).toHaveBeenCalledWith(dto, 'u1');
  });

  it('getReports', async () => {
    mockEnrollmentsService.getReports.mockResolvedValue({ metrics: {} });
    const res = await controller.getReports();
    expect(res).toEqual({ metrics: {} });
    expect(mockEnrollmentsService.getReports).toHaveBeenCalled();
  });
});
