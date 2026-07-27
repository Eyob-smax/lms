import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

  @ApiOperation({ summary: 'Update a question (Admin only)' })
  @Roles(Role.ADMIN)
  @Patch('questions/:questionId')
  async updateQuestion(@Param('questionId') questionId: string, @Body() body: any) {
    return this.quizzesService.updateQuestion(questionId, body);
  }

  @ApiOperation({ summary: 'Delete a question (Admin only)' })
  @Roles(Role.ADMIN)
  @Delete('questions/:questionId')
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.quizzesService.deleteQuestion(questionId);
  }

  @ApiOperation({ summary: 'Get quiz attempt detailed drill-down and missed questions analysis' })
  @ApiResponse({ status: 200, description: 'Detailed attempt breakdown with question-by-question correctness, explanations, and missed questions' })
  @Get('attempts/:attemptId')
  async getAttemptDetail(@Param('attemptId') attemptId: string) {
    return this.quizzesService.getAttemptDetail(attemptId);
  }

  @ApiOperation({ summary: 'Get all attempt history for an enrollment' })
  @ApiResponse({ status: 200, description: 'List of past attempt scores, timestamps, and pass/fail statuses' })
  @Get('enrollments/:enrollmentId/attempts')
  async getEnrollmentAttempts(@Param('enrollmentId') enrollmentId: string) {
    return this.quizzesService.getEnrollmentAttempts(enrollmentId);
  }

  @ApiOperation({ summary: 'Submit quiz attempt without URL ID parameter' })
  @ApiResponse({ status: 200, description: 'Graded score %, pass/fail outcome, and explanations' })
  @Post('submit')
  async submitAttemptRoot(@Body() dto: SubmitQuizAttemptDto, @CurrentUser('id') userId: string) {
    return this.quizzesService.submitAttempt(dto.quizId || '', dto, userId);
  }

  @ApiOperation({ summary: 'Get quiz questions and configuration' })
  @ApiResponse({ status: 200, description: 'Quiz details and question list' })
  @Get(':id')
  async findQuiz(@Param('id') id: string) {
    return this.quizzesService.findQuiz(id);
  }

  @ApiOperation({ summary: 'Update quiz metadata (Admin only)' })
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateQuiz(@Param('id') id: string, @Body() body: any) {
    return this.quizzesService.updateQuiz(id, body);
  }

  @ApiOperation({ summary: 'Delete a quiz (Admin only)' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteQuiz(@Param('id') id: string) {
    return this.quizzesService.deleteQuiz(id);
  }

  @ApiOperation({ summary: 'Duplicate a quiz (Admin only)' })
  @Roles(Role.ADMIN)
  @Post(':id/duplicate')
  async duplicateQuiz(@Param('id') id: string) {
    return this.quizzesService.duplicateQuiz(id);
  }

  @ApiOperation({ summary: 'Reorder questions in a quiz (Admin only)' })
  @Roles(Role.ADMIN)
  @Patch(':id/reorder')
  async reorderQuestions(@Param('id') id: string, @Body() body: { questionIds: string[] }) {
    return this.quizzesService.reorderQuestions(id, body.questionIds);
  }

  @ApiOperation({ summary: 'Submit quiz attempt for auto-grading' })
  @ApiResponse({ status: 200, description: 'Graded score %, pass/fail outcome, and explanations' })
  @Post(':id/submit')
  async submitAttempt(@Param('id') id: string, @Body() dto: SubmitQuizAttemptDto, @CurrentUser('id') userId: string) {
    return this.quizzesService.submitAttempt(id, dto, userId);
  }
}
