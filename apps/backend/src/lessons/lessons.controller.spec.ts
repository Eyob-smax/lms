import { Test, TestingModule } from '@nestjs/testing';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonType } from './dto/create-lesson.dto';

describe('LessonsController', () => {
  let controller: LessonsController;
  let service: LessonsService;

  const mockService = {
    createModule: jest.fn(),
    findModulesByCourse: jest.fn(),
    findModule: jest.fn(),
    updateModule: jest.fn(),
    reorderModules: jest.fn(),
    removeModule: jest.fn(),
    createLesson: jest.fn(),
    bulkCreateLessons: jest.fn(),
    findLesson: jest.fn(),
    updateLesson: jest.fn(),
    reorderLessons: jest.fn(),
    removeLesson: jest.fn(),
    getCourseOutline: jest.fn(),
    getLessonNavigation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [
        {
          provide: LessonsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
    service = module.get<LessonsService>(LessonsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createModule', () => {
    const dto = { courseId: 'c1', title: 'T', order: 1 };
    controller.createModule(dto);
    expect(service.createModule).toHaveBeenCalledWith(dto);
  });

  it('findModulesByCourse', () => {
    controller.findModulesByCourse('c1');
    expect(service.findModulesByCourse).toHaveBeenCalledWith('c1');
  });

  it('getCourseOutline', () => {
    controller.getCourseOutline('c1');
    expect(service.getCourseOutline).toHaveBeenCalledWith('c1');
  });

  it('findModule', () => {
    controller.findModule('m1');
    expect(service.findModule).toHaveBeenCalledWith('m1');
  });

  it('updateModule', () => {
    const dto = { title: 'T' };
    controller.updateModule('m1', dto);
    expect(service.updateModule).toHaveBeenCalledWith('m1', dto);
  });

  it('reorderModules', () => {
    controller.reorderModules('c1', { orderedIds: ['m1'] });
    expect(service.reorderModules).toHaveBeenCalledWith('c1', ['m1']);
  });

  it('removeModule', () => {
    controller.removeModule('m1');
    expect(service.removeModule).toHaveBeenCalledWith('m1');
  });

  it('createLesson', () => {
    const dto = { moduleId: 'm1', title: 'L1', content: 'C', lessonType: LessonType.TEXT, durationMinutes: 10, order: 1 };
    controller.createLesson(dto);
    expect(service.createLesson).toHaveBeenCalledWith(dto);
  });

  it('bulkCreateLessons', () => {
    const dto = { lessons: [] };
    controller.bulkCreateLessons(dto);
    expect(service.bulkCreateLessons).toHaveBeenCalledWith(dto);
  });

  it('findLesson', () => {
    controller.findLesson('l1');
    expect(service.findLesson).toHaveBeenCalledWith('l1');
  });

  it('getLessonNavigation', () => {
    controller.getLessonNavigation('l1');
    expect(service.getLessonNavigation).toHaveBeenCalledWith('l1');
  });

  it('updateLesson', () => {
    const dto = { title: 'U' };
    controller.updateLesson('l1', dto);
    expect(service.updateLesson).toHaveBeenCalledWith('l1', dto);
  });

  it('reorderLessons', () => {
    controller.reorderLessons('m1', { orderedIds: ['l1'] });
    expect(service.reorderLessons).toHaveBeenCalledWith('m1', ['l1']);
  });

  it('removeLesson', () => {
    controller.removeLesson('l1');
    expect(service.removeLesson).toHaveBeenCalledWith('l1');
  });
});
