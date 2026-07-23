import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findCatalog: jest.fn(),
            getCategories: jest.fn(),
            findOne: jest.fn(),
            getStatistics: jest.fn(),
            update: jest.fn(),
            publish: jest.fn(),
            unpublish: jest.fn(),
            archive: jest.fn(),
            clone: jest.fn(),
            bulkArchive: jest.fn(),
            bulkDelete: jest.fn(),
            remove: jest.fn(),
          },
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create', () => {
    const dto = { title: 'Test', description: 'Desc', category: 'Tech' };
    controller.create(dto, 'u1');
    expect(service.create).toHaveBeenCalledWith(dto, 'u1');
  });

  it('findAll', () => {
    const query = { page: 1, pageSize: 10 };
    controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('findCatalog', () => {
    const query = { page: 1 };
    controller.findCatalog(query, 'u1');
    expect(service.findCatalog).toHaveBeenCalledWith(query, 'u1');
  });

  it('getCategories', () => {
    controller.getCategories();
    expect(service.getCategories).toHaveBeenCalled();
  });

  it('bulkArchive', () => {
    const dto = { courseIds: ['c1'] };
    controller.bulkArchive(dto);
    expect(service.bulkArchive).toHaveBeenCalledWith(['c1']);
  });

  it('bulkDelete', () => {
    const dto = { courseIds: ['c1'] };
    controller.bulkDelete(dto);
    expect(service.bulkDelete).toHaveBeenCalledWith(['c1']);
  });

  it('findOne', () => {
    controller.findOne('c1');
    expect(service.findOne).toHaveBeenCalledWith('c1');
  });

  it('update', () => {
    const dto = { title: 'New' };
    controller.update('c1', dto);
    expect(service.update).toHaveBeenCalledWith('c1', dto);
  });

  it('publish', () => {
    controller.publish('c1');
    expect(service.publish).toHaveBeenCalledWith('c1');
  });

  it('remove', () => {
    controller.remove('c1');
    expect(service.remove).toHaveBeenCalledWith('c1');
  });
});
