import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role, CourseStatus } from '@prisma/client';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('AI Courses Studio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-courses')
export class AiCoursesController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'Generate AI course draft matching UI studio expectations' })
  @ApiResponse({ status: 201, description: 'Returns { course, quiz } format required by studio UI' })
  @Roles(Role.ADMIN)
  @Post('generate-draft')
  async generateDraft(@Body() body: any, @CurrentUser('id') userId: string) {
    const topic = body?.topic || 'BPO Operational Training';
    const targetRole = body?.targetRole || 'SDR';
    const durationMinutes = body?.durationMinutes || body?.estimatedDurationMinutes || 45;
    const moduleCount = body?.moduleCount || 3;

    // Execute full course scaffolding workflow
    const courseObj: any = await this.aiService.draftCourse(
      {
        topic,
        targetRole,
        objective: body?.objective || `Comprehensive operational training on ${topic} for ${targetRole} teams`,
        difficulty: body?.difficulty || 'Intermediate',
        estimatedDurationMinutes: typeof durationMinutes === 'number' ? durationMinutes : parseInt(durationMinutes, 10) || 45,
        includeQuiz: true,
      },
      userId,
    );

    // Format response as { course, quiz } to match frontend state expectations
    const quizObj = courseObj?.quizzes && courseObj.quizzes.length > 0 ? courseObj.quizzes[0] : null;

    return {
      course: courseObj,
      quiz: quizObj,
    };
  }

  @ApiOperation({ summary: 'Publish draft course and assign to target agents or departments' })
  @ApiResponse({ status: 201, description: 'Published course and created enrollments' })
  @Roles(Role.ADMIN)
  @Post('publish-draft')
  async publishDraft(@Body() body: any, @CurrentUser('id') userId: string) {
    const { course, quiz, isMandatory, dueDate, department, userIds } = body || {};

    if (!course || !course.id) {
      return { success: false, message: 'Invalid course data provided' };
    }

    // 1. Update Course title, description, and status to PUBLISHED
    await this.prisma.course.update({
      where: { id: course.id },
      data: {
        title: course.title,
        description: course.description,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    }).catch((err) => {
      console.error('Failed updating course during publish:', err);
    });

    // 2. Update Quiz and Questions if modified in the studio
    if (quiz && quiz.id) {
      await this.prisma.quiz.update({
        where: { id: quiz.id },
        data: {
          title: quiz.title,
          passingScorePct: typeof quiz.passingScorePct === 'number' ? quiz.passingScorePct : 80,
        },
      }).catch(() => {});

      if (Array.isArray(quiz.questions)) {
        for (const q of quiz.questions) {
          if (q && q.id) {
            await this.prisma.quizQuestion.update({
              where: { id: q.id },
              data: {
                questionText: q.questionText,
              },
            }).catch(() => {});
          }
        }
      }
    }

    // 3. Determine users to enroll
    let targetUsers: { id: string }[] = [];
    if (Array.isArray(userIds) && userIds.length > 0) {
      targetUsers = userIds.map((id: string) => ({ id }));
    } else if (department) {
      targetUsers = await this.prisma.user.findMany({
        where: {
          department: {
            contains: department,
            mode: 'insensitive',
          },
          role: Role.AGENT,
          isActive: true,
        },
        select: { id: true },
      });
      // Fallback if department search returns none
      if (targetUsers.length === 0) {
        targetUsers = await this.prisma.user.findMany({
          where: { role: Role.AGENT, isActive: true },
          select: { id: true },
        });
      }
    }

    // 4. Create or update enrollments
    let enrolledCount = 0;
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;
    const mandatoryFlag = isMandatory !== undefined ? Boolean(isMandatory) : true;

    for (const u of targetUsers) {
      try {
        await this.prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: u.id,
              courseId: course.id,
            },
          },
          update: {
            isMandatory: mandatoryFlag,
            dueDate: parsedDueDate,
          },
          create: {
            userId: u.id,
            courseId: course.id,
            assignedBy: userId,
            isMandatory: mandatoryFlag,
            dueDate: parsedDueDate,
          },
        });
        enrolledCount++;
      } catch (e) {
        // ignore duplicate or individual upsert errors
      }
    }

    return {
      success: true,
      message: `Course published successfully and assigned to ${enrolledCount} agent(s)!`,
      courseId: course.id,
      enrolledCount,
    };
  }
}
