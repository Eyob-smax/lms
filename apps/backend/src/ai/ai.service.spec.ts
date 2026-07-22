import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
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
});
