import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { AssignCourseDto } from './dto/assign-course.dto';
import { AssignCohortDto } from './dto/assign-cohort.dto';
import { MarkLessonCompleteDto } from './dto/mark-lesson-complete.dto';
import { SelfEnrollDto } from './dto/self-enroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Enrollments & Learner Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ summary: 'Agent self-enrollment into a published course (Agent only)' })
  @ApiResponse({ status: 201, description: 'Successfully self-enrolled in course' })
  @Roles(Role.AGENT)
  @Post('self-enroll')
  async selfEnroll(@Body() dto: SelfEnrollDto, @CurrentUser('id') userId: string) {
    return this.enrollmentsService.selfEnroll(dto, userId);
  }

  @ApiOperation({ summary: 'Assign course to users or target department (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course assigned to agents' })
  @Roles(Role.ADMIN)
  @Post('assign')
  async assignCourse(@Body() dto: AssignCourseDto, @CurrentUser('id') adminUserId: string) {
    return this.enrollmentsService.assignCourse(dto, adminUserId);
  }

  @ApiOperation({ summary: 'Batch assign courses to entire cohorts, roles, or teams (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course batch assigned to target cohort / group of agents' })
  @Roles(Role.ADMIN)
  @Post('assign-cohort')
  async assignCohort(@Body() dto: AssignCohortDto, @CurrentUser('id') adminUserId: string) {
    return this.enrollmentsService.assignCohort(dto, adminUserId);
  }

  @ApiOperation({ summary: 'Get current agent assigned courses and completion status' })
  @ApiResponse({ status: 200, description: 'List of assigned courses with progress %' })
  @Get('my-courses')
  async findMyEnrollments(@CurrentUser('id') userId: string) {
    return this.enrollmentsService.findUserEnrollments(userId);
  }

  @ApiOperation({ summary: 'Mark lesson as complete and update course progress %' })
  @ApiResponse({ status: 200, description: 'Updated lesson progress and overall progress %' })
  @Post('mark-lesson')
  async markLessonComplete(@Body() dto: MarkLessonCompleteDto, @CurrentUser('id') userId: string) {
    return this.enrollmentsService.markLessonComplete(dto, userId);
  }

  @ApiOperation({ summary: 'Get executive dashboard reports and metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics for completion rates, pass rates, and enrollments' })
  @Roles(Role.ADMIN)
  @Get('reports')
  async getReports() {
    return this.enrollmentsService.getReports();
  }
}
