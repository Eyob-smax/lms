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
      findUnique: jest.fn(),
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

  describe('getAttemptDetail()', () => {
    it('should return detailed drill-down breakdown and missed questions analysis', async () => {
      const mockAttempt = {
        id: 'att-1',
        enrollmentId: 'enr-1',
        quizId: 'quiz-1',
        scorePct: 50,
        isPassed: false,
        startedAt: new Date(Date.now() - 300000),
        completedAt: new Date(),
        quiz: {
          title: 'Compliance Exam',
          passingScorePct: 80,
          course: { id: 'c-1', title: 'Data Privacy', courseCode: 'CRS-2024-001' },
        },
        enrollment: {
          userId: 'u-1',
          user: { name: 'Jane Agent', email: 'jane@bpo.com', department: 'Sales' },
        },
        answers: [
          {
            questionId: 'q-1',
            isCorrect: true,
            selectedOptionId: 'opt-1',
            selectedOption: { optionText: 'Option 1' },
            question: {
              questionText: 'Question 1',
              questionType: QuestionType.MCQ,
              explanation: 'Ex 1',
              points: 1,
              options: [
                { id: 'opt-1', optionText: 'Option 1', isCorrect: true },
                { id: 'opt-2', optionText: 'Option 2', isCorrect: false },
              ],
            },
          },
          {
            questionId: 'q-2',
            isCorrect: false,
            selectedOptionId: 'opt-3',
            selectedOption: { optionText: 'Option 3' },
            question: {
              questionText: 'Question 2',
              questionType: QuestionType.MCQ,
              explanation: 'Ex 2',
              points: 1,
              options: [
                { id: 'opt-3', optionText: 'Option 3', isCorrect: false },
                { id: 'opt-4', optionText: 'Option 4', isCorrect: true },
              ],
            },
          },
        ],
      };

      mockPrismaService.quizAttempt.findUnique.mockResolvedValue(mockAttempt);

      const result = await service.getAttemptDetail('att-1');

      expect(result.attemptId).toBe('att-1');
      expect(result.scorePct).toBe(50);
      expect(result.isPassed).toBe(false);
      expect(result.totalQuestionsCount).toBe(2);
      expect(result.correctQuestionsCount).toBe(1);
      expect(result.missedQuestionsCount).toBe(1);
      expect(result.missedQuestions).toHaveLength(1);
      expect(result.missedQuestions[0].questionId).toBe('q-2');
    });

    it('should throw NotFoundException if attempt missing', async () => {
      mockPrismaService.quizAttempt.findUnique.mockResolvedValue(null);
      await expect(service.getAttemptDetail('att-missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEnrollmentAttempts()', () => {
    it('should return list of attempts for an enrollment', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enr-1',
        course: { title: 'Sales 101' },
        quizAttempts: [
          {
            id: 'att-1',
            scorePct: 90,
            isPassed: true,
            startedAt: new Date(),
            completedAt: new Date(),
            quiz: { title: 'Final Quiz', passingScorePct: 80, maxAttempts: 3 },
          },
        ],
      });

      const result = await service.getEnrollmentAttempts('enr-1');

      expect(result.totalAttemptsCount).toBe(1);
      expect(result.attempts[0].scorePct).toBe(90);
    });
  });
});
