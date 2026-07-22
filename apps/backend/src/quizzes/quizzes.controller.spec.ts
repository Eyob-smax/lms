import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

describe('QuizzesController', () => {
  let controller: QuizzesController;
  let service: QuizzesService;

  const mockQuizzesService = {
    createQuiz: jest.fn(),
    addQuestion: jest.fn(),
    findQuiz: jest.fn(),
    submitAttempt: jest.fn(),
    getAttemptDetail: jest.fn(),
    getEnrollmentAttempts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [{ provide: QuizzesService, useValue: mockQuizzesService }],
    }).compile();

    controller = module.get<QuizzesController>(QuizzesController);
    service = module.get<QuizzesService>(QuizzesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createQuiz', async () => {
    mockQuizzesService.createQuiz.mockResolvedValue({ id: 'q1' });
    const dto = { courseId: 'c1', title: 'Quiz 1', passingScorePct: 80, maxAttempts: 3 };
    const res = await controller.createQuiz(dto);
    expect(res).toEqual({ id: 'q1' });
  });

  it('addQuestion', async () => {
    mockQuizzesService.addQuestion.mockResolvedValue({ id: 'question-1' });
    const dto = { quizId: 'q1', questionText: 'Q1', questionType: 'MCQ' as any, points: 1, order: 1 };
    const res = await controller.addQuestion(dto);
    expect(res).toEqual({ id: 'question-1' });
  });

  it('findQuiz', async () => {
    mockQuizzesService.findQuiz.mockResolvedValue({ id: 'q1' });
    const res = await controller.findQuiz('q1');
    expect(res).toEqual({ id: 'q1' });
  });

  it('submitAttempt', async () => {
    mockQuizzesService.submitAttempt.mockResolvedValue({ scorePct: 100 });
    const dto = { enrollmentId: 'e1', answers: [] };
    const res = await controller.submitAttempt('q1', dto);
    expect(res).toEqual({ scorePct: 100 });
  });

  it('getAttemptDetail', async () => {
    mockQuizzesService.getAttemptDetail.mockResolvedValue({ attemptId: 'att-1', missedQuestionsCount: 1 });
    const res = await controller.getAttemptDetail('att-1');
    expect(res).toEqual({ attemptId: 'att-1', missedQuestionsCount: 1 });
    expect(mockQuizzesService.getAttemptDetail).toHaveBeenCalledWith('att-1');
  });

  it('getEnrollmentAttempts', async () => {
    mockQuizzesService.getEnrollmentAttempts.mockResolvedValue({ totalAttemptsCount: 1 });
    const res = await controller.getEnrollmentAttempts('e1');
    expect(res).toEqual({ totalAttemptsCount: 1 });
    expect(mockQuizzesService.getEnrollmentAttempts).toHaveBeenCalledWith('e1');
  });
});
