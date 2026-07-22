import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;

  const mockAiService = {
    generateOutline: jest.fn(),
    generateLesson: jest.fn(),
    generateQuiz: jest.fn(),
    draftCourse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [{ provide: AiService, useValue: mockAiService }],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get<AiService>(AiService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('generateOutline', async () => {
    mockAiService.generateOutline.mockResolvedValue({ title: 'Outline' });
    const dto = { topic: 'Sales', targetRole: 'SDR' };
    const res = await controller.generateOutline(dto);
    expect(res).toEqual({ title: 'Outline' });
    expect(mockAiService.generateOutline).toHaveBeenCalledWith(dto);
  });

  it('generateLesson', async () => {
    mockAiService.generateLesson.mockResolvedValue({ title: 'Lesson' });
    const dto = { lessonTitle: 'L1', targetRole: 'SDR' };
    const res = await controller.generateLesson(dto);
    expect(res).toEqual({ title: 'Lesson' });
    expect(mockAiService.generateLesson).toHaveBeenCalledWith(dto);
  });

  it('generateQuiz', async () => {
    mockAiService.generateQuiz.mockResolvedValue({ title: 'Quiz' });
    const dto = { lessonTitle: 'L1', lessonContent: 'Content' };
    const res = await controller.generateQuiz(dto);
    expect(res).toEqual({ title: 'Quiz' });
    expect(mockAiService.generateQuiz).toHaveBeenCalledWith(dto);
  });

  it('draftCourse', async () => {
    mockAiService.draftCourse.mockResolvedValue({ id: 'c1', status: 'DRAFT' });
    const dto = { topic: 'Tech', targetRole: 'IT', objective: 'Train' };
    const res = await controller.draftCourse(dto, 'admin-1');
    expect(res).toEqual({ id: 'c1', status: 'DRAFT' });
    expect(mockAiService.draftCourse).toHaveBeenCalledWith(dto, 'admin-1');
  });
});
