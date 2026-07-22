import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AiService } from './ai.service';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GenerateLessonContentDto } from './dto/generate-lesson-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
}
