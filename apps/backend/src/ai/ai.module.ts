import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiCoursesController } from './ai-courses.controller';

@Module({
  controllers: [AiController, AiCoursesController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
