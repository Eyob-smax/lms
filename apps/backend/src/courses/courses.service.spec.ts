import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: PrismaService,
          useValue: {
            course: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
              groupBy: jest.fn(),
            },
            module: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            lesson: {
              create: jest.fn(),
            },
            quiz: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            quizQuestion: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            quizOption: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            enrollment: {
              findMany: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should generate courseCode and create a course', async () => {
      const dto = { title: 'Test', description: 'Desc', category: 'Tech' };
      const userId = 'user-1';
      jest.spyOn(prisma.course, 'count').mockResolvedValue(5);
      jest.spyOn(prisma.course, 'create').mockResolvedValue({ id: 'c1', ...dto } as any);

      const result = await service.create(dto, userId);

      expect(prisma.course.count).toHaveBeenCalled();
      const year = new Date().getFullYear();
      expect(prisma.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test',
          description: 'Desc',
          category: 'Tech',
          courseCode: `CRS-${year}-006`,
          status: 'DRAFT',
          version: 1,
          tags: [],
          isMandatory: false,
          createdBy: { connect: { id: userId } },
        }),
      });
      expect(result).toEqual({ id: 'c1', ...dto });
    });
  });

  describe('findAll', () => {
    it('should return paginated courses with filters', async () => {
      const query = { page: 2, pageSize: 5, search: 'test', category: 'Tech' };
      jest.spyOn(prisma.course, 'findMany').mockResolvedValue([{ id: 'c1' }] as any);
      jest.spyOn(prisma.course, 'count').mockResolvedValue(12);

      const result = await service.findAll(query);

      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
          category: 'Tech'
        },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      expect(result.meta).toEqual({
        total: 12,
        page: 2,
        pageSize: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });
  });

  describe('findCatalog', () => {
    it('should only return published courses and enrollment status', async () => {
      jest.spyOn(prisma.course, 'findMany').mockResolvedValue([{ id: 'c1' }, { id: 'c2' }] as any);
      jest.spyOn(prisma.course, 'count').mockResolvedValue(2);
      jest.spyOn(prisma.enrollment, 'findMany').mockResolvedValue([
        { courseId: 'c1', status: 'IN_PROGRESS' }
      ] as any);

      const result = await service.findCatalog({}, 'user-1');

      expect(prisma.course.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: 'PUBLISHED' }
      }));
      expect((result.data[0] as any).enrollmentStatus).toBe('IN_PROGRESS');
      expect((result.data[1] as any).enrollmentStatus).toBe('NOT_ENROLLED');
    });
  });

  describe('findOne', () => {
    it('should return course if found', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue({ id: 'c1' } as any);
      const result = await service.findOne('c1');
      expect(result).toEqual({ id: 'c1' });
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue(null);
      await expect(service.findOne('c1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatistics', () => {
    it('should return aggregated stats', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue({
        id: 'c1',
        _count: { modules: 2 },
        modules: [{ _count: { lessons: 3 } }, { _count: { lessons: 2 } }]
      } as any);
      jest.spyOn(prisma.enrollment, 'aggregate').mockResolvedValue({
        _count: { id: 10 },
        _avg: { overallProgressPct: 50, finalScorePct: 80 }
      } as any);
      jest.spyOn(prisma.enrollment, 'count').mockResolvedValueOnce(4).mockResolvedValueOnce(6);

      const result = await service.getStatistics('c1');

      expect(result).toEqual({
        totalEnrolled: 10,
        activeEnrollments: 4,
        completedEnrollments: 6,
        averageCompletionPct: 50,
        averageQuizScore: 80,
        totalModules: 2,
        totalLessons: 5,
      });
    });
  });

  describe('getCategories', () => {
    it('should return distinct categories with counts', async () => {
      (prisma.course.groupBy as jest.Mock).mockResolvedValue([
        { category: 'Tech', _count: { id: 5 } }
      ]);
      const result = await service.getCategories();
      expect(result).toEqual([{ category: 'Tech', count: 5 }]);
    });
  });

  describe('update', () => {
    it('should update and return course', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue({ id: 'c1' } as any);
      jest.spyOn(prisma.course, 'update').mockResolvedValue({ id: 'c1', title: 'New' } as any);
      const result = await service.update('c1', { title: 'New' });
      expect(result).toEqual({ id: 'c1', title: 'New' });
    });

    it('should throw if not found', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue(null);
      await expect(service.update('c1', { title: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should update status to PUBLISHED', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue({ id: 'c1' } as any);
      jest.spyOn(prisma.course, 'update').mockResolvedValue({ id: 'c1' } as any);
      await service.publish('c1');
      expect(prisma.course.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'PUBLISHED' })
      }));
    });
  });

  describe('unpublish', () => {
    it('should update status to DRAFT', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue({ id: 'c1' } as any);
      jest.spyOn(prisma.course, 'update').mockResolvedValue({ id: 'c1' } as any);
      await service.unpublish('c1');
      expect(prisma.course.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: 'DRAFT' }
      }));
    });
  });

  describe('archive', () => {
    it('should update status to ARCHIVED', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue({ id: 'c1' } as any);
      jest.spyOn(prisma.course, 'update').mockResolvedValue({ id: 'c1' } as any);
      await service.archive('c1');
      expect(prisma.course.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: 'ARCHIVED' }
      }));
    });
  });

  describe('clone', () => {
    it('should deep clone a course', async () => {
      const mockCourse = {
        id: 'c1',
        title: 'Orig',
        modules: [{ id: 'm1', lessons: [{ id: 'l1' }] }],
        quizzes: [{ id: 'q1', questions: [{ id: 'qq1', options: [{ id: 'qo1' }] }] }]
      };
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue(mockCourse as any);
      jest.spyOn(prisma.course, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.course, 'create').mockResolvedValue({ id: 'c2' } as any);
      jest.spyOn(prisma.module, 'create').mockResolvedValue({ id: 'm2' } as any);
      jest.spyOn(prisma.lesson, 'create').mockResolvedValue({ id: 'l2' } as any);
      jest.spyOn(prisma.quiz, 'create').mockResolvedValue({ id: 'q2' } as any);
      jest.spyOn(prisma.quizQuestion, 'create').mockResolvedValue({ id: 'qq2' } as any);
      jest.spyOn(prisma.quizOption, 'create').mockResolvedValue({ id: 'qo2' } as any);

      await service.clone('c1', 'user-2');

      expect(prisma.course.create).toHaveBeenCalled();
      expect(prisma.module.create).toHaveBeenCalled();
      expect(prisma.lesson.create).toHaveBeenCalled();
      expect(prisma.quiz.create).toHaveBeenCalled();
      expect(prisma.quizQuestion.create).toHaveBeenCalled();
      expect(prisma.quizOption.create).toHaveBeenCalled();
    });
  });

  describe('bulkArchive', () => {
    it('should archive multiple courses', async () => {
      jest.spyOn(prisma.course, 'updateMany').mockResolvedValue({ count: 2 } as any);
      const result = await service.bulkArchive(['c1', 'c2']);
      expect(result).toEqual({ count: 2, archivedIds: ['c1', 'c2'] });
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple courses', async () => {
      jest.spyOn(prisma.course, 'deleteMany').mockResolvedValue({ count: 2 } as any);
      const result = await service.bulkDelete(['c1', 'c2']);
      expect(result).toEqual({ count: 2, deletedIds: ['c1', 'c2'] });
    });
  });

  describe('remove', () => {
    it('should delete and return course', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue({ id: 'c1' } as any);
      jest.spyOn(prisma.course, 'delete').mockResolvedValue({ id: 'c1' } as any);
      const result = await service.remove('c1');
      expect(result).toEqual({ id: 'c1' });
    });

    it('should throw if not found', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue(null);
      await expect(service.remove('c1')).rejects.toThrow(NotFoundException);
    });
  });
});
