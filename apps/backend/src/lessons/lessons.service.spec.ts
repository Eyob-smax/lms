import { Test, TestingModule } from '@nestjs/testing';
import { LessonsService } from './lessons.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { LessonType } from './dto/create-lesson.dto';

const mockPrismaService = {
  course: {
    findUnique: jest.fn(),
  },
  module: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  lesson: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn((callbacks) => Promise.resolve(callbacks.map ? callbacks.map(cb => cb) : callbacks)),
};

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createModule', () => {
    it('should create a module when course exists', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({ id: 'course-1' });
      mockPrismaService.module.create.mockResolvedValue({ id: 'mod-1', title: 'Test' });

      const result = await service.createModule({ courseId: 'course-1', title: 'Test', order: 1 });
      expect(result).toEqual({ id: 'mod-1', title: 'Test' });
      expect(mockPrismaService.module.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when course is missing', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);
      await expect(service.createModule({ courseId: 'course-1', title: 'Test', order: 1 }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findModulesByCourse', () => {
    it('should return ordered modules with lessons', async () => {
      mockPrismaService.module.findMany.mockResolvedValue([
        { id: 'mod-1', _count: { lessons: 2 } }
      ]);
      const result = await service.findModulesByCourse('course-1');
      expect(result).toEqual([{ id: 'mod-1', lessonCount: 2, _count: undefined }]);
    });
  });

  describe('findModule', () => {
    it('should return module if found', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue({ id: 'mod-1' });
      const result = await service.findModule('mod-1');
      expect(result).toEqual({ id: 'mod-1' });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue(null);
      await expect(service.findModule('mod-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateModule', () => {
    it('should update module if found', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue({ id: 'mod-1' });
      mockPrismaService.module.update.mockResolvedValue({ id: 'mod-1', title: 'Updated' });
      const result = await service.updateModule('mod-1', { title: 'Updated' });
      expect(result).toEqual({ id: 'mod-1', title: 'Updated' });
    });

    it('should throw NotFoundException if missing', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue(null);
      await expect(service.updateModule('mod-1', { title: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderModules', () => {
    it('should reorder all modules in transaction', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({ id: 'course-1' });
      mockPrismaService.module.findMany.mockResolvedValue([]);
      await service.reorderModules('course-1', ['mod-1', 'mod-2']);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if course missing', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);
      await expect(service.reorderModules('course-1', ['mod-1'])).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeModule', () => {
    it('should delete module if found', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue({ id: 'mod-1' });
      mockPrismaService.module.delete.mockResolvedValue({ id: 'mod-1' });
      const result = await service.removeModule('mod-1');
      expect(result).toEqual({ id: 'mod-1' });
    });

    it('should throw NotFoundException if missing', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue(null);
      await expect(service.removeModule('mod-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLesson', () => {
    it('should create lesson when module exists', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue({ id: 'mod-1' });
      mockPrismaService.lesson.create.mockResolvedValue({ id: 'lesson-1' });
      const dto = { moduleId: 'mod-1', title: 'L1', content: 'content', lessonType: LessonType.TEXT, durationMinutes: 10, order: 1 };
      const result = await service.createLesson(dto);
      expect(result).toEqual({ id: 'lesson-1' });
    });

    it('should throw NotFoundException when module missing', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue(null);
      const dto = { moduleId: 'mod-1', title: 'L1', content: 'content', lessonType: LessonType.TEXT, durationMinutes: 10, order: 1 };
      await expect(service.createLesson(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkCreateLessons', () => {
    it('should create multiple lessons in transaction', async () => {
      mockPrismaService.module.findMany.mockResolvedValue([{ id: 'mod-1' }]);
      const dto = { lessons: [{ moduleId: 'mod-1', title: 'L1', content: 'C', lessonType: LessonType.TEXT, durationMinutes: 10, order: 1 }] };
      await service.bulkCreateLessons(dto);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if any module missing', async () => {
      mockPrismaService.module.findMany.mockResolvedValue([]);
      const dto = { lessons: [{ moduleId: 'mod-1', title: 'L1', content: 'C', lessonType: LessonType.TEXT, durationMinutes: 10, order: 1 }] };
      await expect(service.bulkCreateLessons(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLesson', () => {
    it('should return lesson if found', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({ id: 'les-1', module: { courseId: 'c1' } });
      const result = await service.findLesson('les-1');
      expect(result).toEqual({ id: 'les-1', module: { courseId: 'c1' } });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);
      await expect(service.findLesson('les-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLesson', () => {
    it('should update lesson if found', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({ id: 'les-1' });
      mockPrismaService.lesson.update.mockResolvedValue({ id: 'les-1', title: 'U' });
      const result = await service.updateLesson('les-1', { title: 'U' });
      expect(result).toEqual({ id: 'les-1', title: 'U' });
    });

    it('should throw NotFoundException if missing', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);
      await expect(service.updateLesson('les-1', { title: 'U' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderLessons', () => {
    it('should reorder lessons in transaction', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue({ id: 'mod-1' });
      mockPrismaService.lesson.findMany.mockResolvedValue([]);
      await service.reorderLessons('mod-1', ['les-1', 'les-2']);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if module missing', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue(null);
      await expect(service.reorderLessons('mod-1', ['les-1'])).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeLesson', () => {
    it('should delete lesson if found', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({ id: 'les-1' });
      mockPrismaService.lesson.delete.mockResolvedValue({ id: 'les-1' });
      const result = await service.removeLesson('les-1');
      expect(result).toEqual({ id: 'les-1' });
    });

    it('should throw NotFoundException if missing', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);
      await expect(service.removeLesson('les-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCourseOutline', () => {
    it('should return tree structure with counts', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'c1',
        title: 'C1',
        modules: [
          { id: 'm1', title: 'M1', order: 1, lessons: [{ id: 'l1', durationMinutes: 10 }] }
        ]
      });
      const result = await service.getCourseOutline('c1');
      expect(result.totalLessons).toBe(1);
      expect(result.totalDurationMinutes).toBe(10);
      expect(result.modules[0].lessonCount).toBe(1);
    });

    it('should throw NotFoundException if course missing', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);
      await expect(service.getCourseOutline('c1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLessonNavigation', () => {
    it('should return prev/next and handle edge cases', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({
        id: 'l2',
        moduleId: 'm1',
        module: { courseId: 'c1', title: 'M1' }
      });
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'c1',
        title: 'C1',
        modules: [
          { id: 'm1', title: 'M1', order: 1, lessons: [
            { id: 'l1', title: 'L1' },
            { id: 'l2', title: 'L2' },
            { id: 'l3', title: 'L3' }
          ]}
        ]
      });
      
      const result = await service.getLessonNavigation('l2');
      expect(result.previousLesson.id).toBe('l1');
      expect(result.nextLesson.id).toBe('l3');
      expect(result.progress.currentLessonIndex).toBe(2);
      expect(result.progress.totalLessonsInModule).toBe(3);
      expect(result.progress.totalLessonsInCourse).toBe(3);
    });
  });
});
