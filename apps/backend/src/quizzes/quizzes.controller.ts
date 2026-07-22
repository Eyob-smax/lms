import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Assessments & Quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @ApiOperation({ summary: 'Create a new quiz per course (Admin only)' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @Roles(Role.ADMIN)
  @Post()
  async createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.quizzesService.createQuiz(createQuizDto);
  }

  @ApiOperation({ summary: 'Add question to question bank / quiz (Admin only)' })
  @ApiResponse({ status: 201, description: 'Question with options created' })
  @Roles(Role.ADMIN)
  @Post('questions')
  async addQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    return this.quizzesService.addQuestion(createQuestionDto);
  }

  @ApiOperation({ summary: 'Get quiz questions and configuration' })
  @ApiResponse({ status: 200, description: 'Quiz details and question list' })
  @Get(':id')
  async findQuiz(@Param('id') id: string) {
    return this.quizzesService.findQuiz(id);
  }

  @ApiOperation({ summary: 'Submit quiz attempt for auto-grading' })
  @ApiResponse({ status: 200, description: 'Graded score %, pass/fail outcome, and explanations' })
  @Post(':id/submit')
  async submitAttempt(@Param('id') id: string, @Body() dto: SubmitQuizAttemptDto) {
    return this.quizzesService.submitAttempt(id, dto);
  }
}
