import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getAdminOverview: jest.fn(),
    getLearnerPerformance: jest.fn(),
    getLeaderboard: jest.fn(),
    exportReport: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAdminOverview', async () => {
    mockAnalyticsService.getAdminOverview.mockResolvedValue({ overview: {} });
    const res = await controller.getAdminOverview({});
    expect(res).toEqual({ overview: {} });
  });

  it('getLearnerPerformance', async () => {
    mockAnalyticsService.getLearnerPerformance.mockResolvedValue({ summary: {} });
    const res = await controller.getLearnerPerformance('u1');
    expect(res).toEqual({ summary: {} });
  });

  it('getLeaderboard', async () => {
    mockAnalyticsService.getLeaderboard.mockResolvedValue([]);
    const res = await controller.getLeaderboard(10);
    expect(res).toEqual([]);
  });

  it('exportReport', async () => {
    mockAnalyticsService.exportReport.mockResolvedValue({ totalRecords: 0 });
    const res = await controller.exportReport({});
    expect(res).toEqual({ totalRecords: 0 });
  });
});
