import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { QuizzesService } from './quizzes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuizzesService', () => {
  let service: QuizzesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    course: {
      findUnique: jest.fn(),
    },
    quiz: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    quizQuestion: {
      create: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    quizAttempt: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = moduleFixture.get<QuizzesService>(QuizzesService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuiz()', () => {
    it('should create quiz when course exists', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({ id: 'course-1' });
      const createdQuiz = { id: 'quiz-1', courseId: 'course-1', title: 'SDR Final Exam', passingScorePct: 80, maxAttempts: 3 };
      mockPrismaService.quiz.create.mockResolvedValue(createdQuiz);

      const result = await service.createQuiz({
        courseId: 'course-1',
        title: 'SDR Final Exam',
        passingScorePct: 80,
        maxAttempts: 3,
      });

      expect(result).toEqual(createdQuiz);
    });
  });

  describe('submitAttempt()', () => {
    const quizMock = {
      id: 'quiz-1',
      passingScorePct: 80,
      maxAttempts: 3,
      questions: [
        {
          id: 'q-1',
          questionType: QuestionType.MCQ,
          points: 1,
          options: [
            { id: 'opt-correct', isCorrect: true },
            { id: 'opt-wrong', isCorrect: false },
          ],
        },
      ],
    };

    it('should auto-grade 100% score for correct MCQ answer', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue(quizMock);
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enr-1',
        quizAttempts: [],
      });
      mockPrismaService.quizAttempt.create.mockResolvedValue({ id: 'att-1', scorePct: 100, isPassed: true });

      const dto = {
        enrollmentId: 'enr-1',
        answers: [{ questionId: 'q-1', selectedOptionId: 'opt-correct' }],
      };

      const result = await service.submitAttempt('quiz-1', dto);

      expect(result.scorePct).toBe(100);
      expect(result.isPassed).toBe(true);
      expect(mockPrismaService.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enr-1' },
        data: expect.objectContaining({ overallProgressPct: 100, status: 'COMPLETED' }),
      });
    });

    it('should fail with BadRequestException if attempt limit is exceeded', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue(quizMock);
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enr-1',
        quizAttempts: [{ quizId: 'quiz-1' }, { quizId: 'quiz-1' }, { quizId: 'quiz-1' }],
      });

      const dto = {
        enrollmentId: 'enr-1',
        answers: [{ questionId: 'q-1', selectedOptionId: 'opt-correct' }],
      };

      await expect(service.submitAttempt('quiz-1', dto)).rejects.toThrow(BadRequestException);
    });
  });
});
