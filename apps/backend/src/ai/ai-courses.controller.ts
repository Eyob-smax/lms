import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
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
    let formattedQuiz = null;
    if (courseObj?.quizzes && courseObj.quizzes.length > 0) {
      const rawQuiz = courseObj.quizzes[0];
      formattedQuiz = {
        ...rawQuiz,
        questions: (rawQuiz.questions || []).map((q: any) => {
          const rawOptions = q.options || [];
          const optionsStrings = rawOptions.map((o: any) => {
            if (typeof o === 'string') return o;
            if (typeof o === 'object' && o !== null) {
              return o.optionText || o.text || o.option || o.label || o.value || o.answer || 'Option';
            }
            return String(o || 'Option');
          });
          let correctOptionIndex = rawOptions.findIndex((o: any) => typeof o === 'object' && o !== null ? o.isCorrect : false);
          if (correctOptionIndex === -1) correctOptionIndex = 0;
          return {
            ...q,
            rawOptions,
            options: optionsStrings,
            correctOptionIndex,
            questionType: q.questionType || 'multiple_choice',
            explanation: q.explanation || 'Review course section notes for explanation.',
          };
        }),
      };
    }

    return {
      course: courseObj,
      quiz: formattedQuiz,
      schema: courseObj?.schema,
    };
  }

  @ApiOperation({ summary: 'Update draft course properties, modules, lessons, and quiz' })
  @ApiResponse({ status: 200, description: 'Draft updated successfully' })
  @Roles(Role.ADMIN)
  @Put('draft/:id')
  async updateDraft(@Param('id') id: string, @Body() body: any) {
    const { course, quiz } = body || {};
    const targetCourse = course || body;
    if (targetCourse) targetCourse.id = id;
    await this.saveCourseAndQuizEdits(targetCourse, quiz);
    return { success: true, message: 'Draft saved successfully!' };
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

    // 1. Persist any structural edits made in UI Studio before publishing
    await this.saveCourseAndQuizEdits(course, quiz);

    // 2. Update Course status to PUBLISHED
    await this.prisma.course.update({
      where: { id: course.id },
      data: {
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    }).catch((err) => {
      console.error('Failed updating course status during publish:', err);
    });

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

  private async saveCourseAndQuizEdits(course: any, quiz: any) {
    if (course && course.id) {
      const durationVal = typeof course.durationMinutes === 'number' ? course.durationMinutes : (parseInt(course.durationMinutes || course.estimatedDuration, 10) || undefined);
      await this.prisma.course.update({
        where: { id: course.id },
        data: {
          title: course.title || undefined,
          description: course.description || undefined,
          durationMinutes: durationVal,
          difficulty: course.difficulty || undefined,
          category: course.category || undefined,
          learningObjectives: Array.isArray(course.learningObjectives) ? course.learningObjectives : undefined,
          prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : undefined,
          summary: course.summary || undefined,
        },
      }).catch((err) => {
        console.error('Failed updating course properties during save:', err);
      });

      if (Array.isArray(course.modules)) {
        for (const mod of course.modules) {
          if (mod && mod.id) {
            await this.prisma.module.update({
              where: { id: mod.id },
              data: {
                title: mod.title || undefined,
                order: typeof mod.order === 'number' ? mod.order : undefined,
              },
            }).catch(() => {});

            if (Array.isArray(mod.lessons)) {
              for (const les of mod.lessons) {
                if (les && les.id) {
                  const lesDuration = typeof les.durationMinutes === 'number' ? les.durationMinutes : (parseInt(les.durationMinutes, 10) || undefined);
                  await this.prisma.lesson.update({
                    where: { id: les.id },
                    data: {
                      title: les.title || undefined,
                      description: les.description || undefined,
                      content: les.content || undefined,
                      durationMinutes: lesDuration,
                      order: typeof les.order === 'number' ? les.order : undefined,
                    },
                  }).catch(() => {});
                }
              }
            }
          }
        }
      }
    }

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
                explanation: q.explanation || undefined,
              },
            }).catch(() => {});

            if (Array.isArray(q.options) && q.options.length > 0) {
              await this.prisma.quizOption.deleteMany({ where: { questionId: q.id } }).catch(() => {});
              for (let idx = 0; idx < q.options.length; idx++) {
                const optObj = q.options[idx];
                const optText = typeof optObj === 'string' ? optObj : (optObj?.optionText || optObj?.text || optObj?.option || optObj?.label || optObj?.value || optObj?.answer || `Option ${idx + 1}`);
                const isCorrect = typeof q.correctOptionIndex === 'number' ? (idx === q.correctOptionIndex) : (optObj?.isCorrect || idx === 0);
                await this.prisma.quizOption.create({
                  data: {
                    questionId: q.id,
                    optionText: String(optText),
                    isCorrect: Boolean(isCorrect),
                  },
                }).catch(() => {});
              }
            }
          }
        }
      }
    }
  }
}

