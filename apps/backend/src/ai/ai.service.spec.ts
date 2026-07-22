import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiService', () => {
  let service: AiService;
  let prisma: PrismaService;

  const mockPrismaService = {
    course: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    module: {
      create: jest.fn(),
    },
    lesson: {
      create: jest.fn(),
    },
    quiz: {
      create: jest.fn(),
    },
    quizQuestion: {
      create: jest.fn(),
    },
    quizOption: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOutline()', () => {
    it('should generate a structured course outline with modules and lessons', async () => {
      const dto = {
        topic: 'Cold Call Script & Objection Handling',
        targetRole: 'SDR',
        estimatedDurationMinutes: 45,
      };

      const outline = await service.generateOutline(dto);

      expect(outline).toHaveProperty('title');
      expect(outline).toHaveProperty('description');
      expect(outline).toHaveProperty('modules');
      expect(Array.isArray(outline.modules)).toBe(true);
      expect(outline.modules.length).toBeGreaterThan(0);
      expect(outline.modules[0]).toHaveProperty('lessons');
    });
  });

  describe('generateLesson()', () => {
    it('should generate rich text content, scripts, and takeaways for a lesson', async () => {
      const dto = {
        lessonTitle: 'Handling "I don\'t have time" Objection',
        targetRole: 'SDR',
        summary: 'Framework for overcoming immediate time brush-offs.',
      };

      const lessonData = await service.generateLesson(dto);

      expect(lessonData.title).toBe(dto.lessonTitle);
      expect(lessonData).toHaveProperty('content');
      expect(lessonData).toHaveProperty('keyTakeaways');
      expect(Array.isArray(lessonData.keyTakeaways)).toBe(true);
    });
  });

  describe('generateQuiz()', () => {
    it('should generate AI question bank with options and explanations', async () => {
      const dto = {
        lessonTitle: 'Data Privacy Compliance',
        lessonContent: 'Agents must encrypt PII and never share passwords.',
        targetRole: 'Customer Support',
        questionCount: 3,
      };

      const quizData = await service.generateQuiz(dto);

      expect(quizData).toHaveProperty('title');
      expect(quizData).toHaveProperty('questions');
      expect(Array.isArray(quizData.questions)).toBe(true);
      expect(quizData.questions.length).toBeGreaterThan(0);
      expect(quizData.questions[0]).toHaveProperty('explanation');
      expect(quizData.questions[0]).toHaveProperty('options');
    });
  });

  describe('draftCourse()', () => {
    it('should generate and persist full course package in reviewable DRAFT state', async () => {
      const dto = {
        topic: 'Enterprise Security Training',
        targetRole: 'IT',
        objective: 'Train IT staff on security protocols',
        difficulty: 'Intermediate',
        includeQuiz: true,
      };

      mockPrismaService.course.count.mockResolvedValue(2);
      mockPrismaService.course.create.mockResolvedValue({ id: 'c-draft-1' });
      mockPrismaService.module.create.mockResolvedValue({ id: 'm-draft-1' });
      mockPrismaService.lesson.create.mockResolvedValue({ id: 'l-draft-1' });
      mockPrismaService.quiz.create.mockResolvedValue({ id: 'q-draft-1' });
      mockPrismaService.quizQuestion.create.mockResolvedValue({ id: 'qq-draft-1' });
      mockPrismaService.quizOption.create.mockResolvedValue({ id: 'qo-draft-1' });
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'c-draft-1',
        title: 'Enterprise Security Training',
        status: 'DRAFT',
        modules: [{ id: 'm-draft-1', lessons: [{ id: 'l-draft-1' }] }],
        quizzes: [{ id: 'q-draft-1' }],
      });

      const result = await service.draftCourse(dto, 'admin-1');

      expect(mockPrismaService.course.create).toHaveBeenCalled();
      expect(mockPrismaService.module.create).toHaveBeenCalled();
      expect(mockPrismaService.lesson.create).toHaveBeenCalled();
      expect(mockPrismaService.quiz.create).toHaveBeenCalled();
      expect(result.status).toBe('DRAFT');
    });
  });
});
