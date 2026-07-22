import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AiService } from './ai.service';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GenerateLessonContentDto } from './dto/generate-lesson-content.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { DraftCourseDto } from './dto/draft-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI Course Generator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({ summary: 'Stage 1: Generate AI Course Outline (Admin only)' })
  @ApiResponse({ status: 200, description: 'Structured JSON course title, modules, and lesson titles' })
  @Roles(Role.ADMIN)
  @Post('generate-outline')
  async generateOutline(@Body() dto: GenerateOutlineDto) {
    return this.aiService.generateOutline(dto);
  }

  @ApiOperation({ summary: 'Stage 2: Generate AI Lesson Content & Scripts (Admin only)' })
  @ApiResponse({ status: 200, description: 'Rich text content blocks, call scripts, and takeaways' })
  @Roles(Role.ADMIN)
  @Post('generate-lesson')
  async generateLesson(@Body() dto: GenerateLessonContentDto) {
    return this.aiService.generateLesson(dto);
  }

  @ApiOperation({ summary: 'Stage 3: Generate AI Question Bank & Assessment Quiz (Admin only)' })
  @ApiResponse({ status: 200, description: 'Question bank tied to lesson content with options and explanations' })
  @Roles(Role.ADMIN)
  @Post('generate-quiz')
  async generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.aiService.generateQuiz(dto);
  }

  @ApiOperation({ summary: 'Full Workflow: Generate Complete AI Course Package in Reviewable DRAFT State (Admin only)' })
  @ApiResponse({ status: 201, description: 'Created DRAFT course with modules, lessons, and quizzes ready for author review' })
  @Roles(Role.ADMIN)
  @Post('draft-course')
  async draftCourse(@Body() dto: DraftCourseDto, @CurrentUser('id') userId: string) {
    return this.aiService.draftCourse(dto, userId);
  }
}
