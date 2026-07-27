import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async createQuiz(dto: CreateQuizDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID "${dto.courseId}" not found`);
    }

    return this.prisma.quiz.create({
      data: dto,
      include: { questions: { include: { options: true } } },
    });
  }

  async addQuestion(dto: CreateQuestionDto) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: dto.quizId } });
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID "${dto.quizId}" not found`);
    }

    const { options, ...questionData } = dto;

    return this.prisma.quizQuestion.create({
      data: {
        ...questionData,
        options: options
          ? {
              create: options.map((opt) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });
  }

  async findQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: true },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID "${id}" not found`);
    }

    return quiz;
  }

  async submitAttempt(quizIdParam: string, dto: SubmitQuizAttemptDto, userId?: string) {
    const quizId = quizIdParam || dto.quizId;
    if (!quizId) {
      throw new BadRequestException('Quiz ID is required');
    }
    const quiz = await this.findQuiz(quizId);

    let enrollment: any = null;
    if (dto.enrollmentId) {
      enrollment = await this.prisma.enrollment.findUnique({
        where: { id: dto.enrollmentId },
        include: { quizAttempts: true },
      });
    }

    if (!enrollment && userId && quiz.courseId) {
      enrollment = await this.prisma.enrollment.findFirst({
        where: { userId, courseId: quiz.courseId },
        include: { quizAttempts: true },
      });

      if (!enrollment) {
        enrollment = await this.prisma.enrollment.create({
          data: {
            userId,
            courseId: quiz.courseId,
            status: 'IN_PROGRESS',
            overallProgressPct: 50,
          },
          include: { quizAttempts: true },
        });
      }
    }

    if (!enrollment) {
      throw new NotFoundException(`Enrollment could not be resolved. Please provide enrollmentId.`);
    }

    const previousAttemptsCount = (enrollment.quizAttempts || []).filter((a: any) => a.quizId === quizId).length;
    if (previousAttemptsCount >= quiz.maxAttempts) {
      throw new BadRequestException(`Maximum attempt limit (${quiz.maxAttempts}) reached for this quiz`);
    }

    let totalPointsEarned = 0;
    let totalPossiblePoints = 0;
    const gradedAnswers: Array<{
      questionId: string;
      selectedOptionId?: string;
      shortAnswerText?: string;
      isCorrect: boolean;
    }> = [];

    for (const question of quiz.questions) {
      totalPointsEarned += 0;
      totalPossiblePoints += question.points;
      const submittedAnswer = dto.answers.find((a) => a.questionId === question.id);

      let isCorrect = false;

      if (submittedAnswer) {
        if (question.questionType === QuestionType.MCQ || question.questionType === QuestionType.TRUE_FALSE) {
          let selectedOptObj = undefined;
          if (submittedAnswer.selectedOptionId) {
            selectedOptObj = question.options.find((opt) => opt.id === submittedAnswer.selectedOptionId);
          }
          if (!selectedOptObj && typeof submittedAnswer.selectedOptionIndex === 'number') {
            selectedOptObj = question.options[submittedAnswer.selectedOptionIndex];
          }
          if (selectedOptObj) {
            submittedAnswer.selectedOptionId = selectedOptObj.id;
            if (selectedOptObj.isCorrect) {
              isCorrect = true;
            }
          }
        } else if (question.questionType === QuestionType.SHORT_ANSWER) {
          const correctOption = question.options.find((opt) => opt.isCorrect);
          if (
            correctOption &&
            submittedAnswer.shortAnswerText &&
            submittedAnswer.shortAnswerText.trim().toLowerCase() === correctOption.optionText.trim().toLowerCase()
          ) {
            isCorrect = true;
          }
        }
      }

      if (isCorrect) {
        totalPointsEarned += question.points;
      }

      gradedAnswers.push({
        questionId: question.id,
        selectedOptionId: submittedAnswer?.selectedOptionId,
        shortAnswerText: submittedAnswer?.shortAnswerText,
        isCorrect,
      });
    }

    const scorePct = totalPossiblePoints > 0 ? Math.round((totalPointsEarned / totalPossiblePoints) * 100) : 0;
    const isPassed = scorePct >= quiz.passingScorePct;

    const attempt = await this.prisma.$transaction(async (tx) => {
      const createdAttempt = await tx.quizAttempt.create({
        data: {
          enrollmentId: enrollment.id,
          quizId,
          scorePct,
          isPassed,
          completedAt: new Date(),
          answers: {
            create: gradedAnswers.map((ans) => ({
              questionId: ans.questionId,
              selectedOptionId: ans.selectedOptionId,
              shortAnswerText: ans.shortAnswerText,
              isCorrect: ans.isCorrect,
            })),
          },
        },
        include: {
          answers: {
            include: { question: true, selectedOption: true },
          },
        },
      });

      if (isPassed) {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            overallProgressPct: 100,
            status: 'COMPLETED',
            finalScorePct: scorePct,
            completedAt: new Date(),
          },
        });
      }

      return createdAttempt;
    });

    return {
      attemptId: attempt.id,
      scorePct,
      passingScorePct: quiz.passingScorePct,
      isPassed,
      passed: isPassed,
      attemptsRemaining: Math.max(0, quiz.maxAttempts - (previousAttemptsCount + 1)),
      attempt,
    };
  }

  async getAttemptDetail(attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            course: { select: { id: true, title: true, courseCode: true } },
          },
        },
        enrollment: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true } },
          },
        },
        answers: {
          include: {
            question: {
              include: { options: true },
            },
            selectedOption: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Quiz attempt with ID "${attemptId}" not found`);
    }

    const timeSpentSeconds = attempt.completedAt && attempt.startedAt
      ? Math.round((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : 0;

    const questionsBreakdown = attempt.answers.map((answer) => {
      const correctOption = answer.question.options.find((opt) => opt.isCorrect);

      const allOptions = answer.question.options.map((opt) => ({
        id: opt.id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        isSelectedByUser: opt.id === answer.selectedOptionId,
      }));

      return {
        questionId: answer.questionId,
        questionText: answer.question.questionText,
        questionType: answer.question.questionType,
        explanation: answer.question.explanation || 'No explanation provided for this question.',
        points: answer.question.points,
        isCorrect: answer.isCorrect,
        isMissed: !answer.isCorrect,
        userAnswer: {
          selectedOptionId: answer.selectedOptionId,
          selectedOptionText: answer.selectedOption?.optionText || null,
          shortAnswerText: answer.shortAnswerText || null,
        },
        correctAnswer: {
          correctOptionId: correctOption?.id || null,
          correctOptionText: correctOption?.optionText || null,
        },
        allOptions,
      };
    });

    const missedQuestions = questionsBreakdown.filter((q) => q.isMissed);

    return {
      attemptId: attempt.id,
      enrollmentId: attempt.enrollmentId,
      userId: attempt.enrollment.userId,
      userName: attempt.enrollment.user.name,
      userEmail: attempt.enrollment.user.email,
      department: attempt.enrollment.user.department,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title,
      courseId: attempt.quiz.course.id,
      courseTitle: attempt.quiz.course.title,
      courseCode: attempt.quiz.course.courseCode,
      scorePct: attempt.scorePct,
      passingScorePct: attempt.quiz.passingScorePct,
      isPassed: attempt.isPassed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeSpentSeconds,
      totalQuestionsCount: questionsBreakdown.length,
      correctQuestionsCount: questionsBreakdown.length - missedQuestions.length,
      missedQuestionsCount: missedQuestions.length,
      questionsBreakdown,
      missedQuestions,
    };
  }

  async getEnrollmentAttempts(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { select: { title: true } },
        quizAttempts: {
          orderBy: { startedAt: 'desc' },
          include: {
            quiz: { select: { title: true, passingScorePct: true, maxAttempts: true } },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID "${enrollmentId}" not found`);
    }

    return {
      enrollmentId,
      courseTitle: enrollment.course.title,
      totalAttemptsCount: enrollment.quizAttempts.length,
      attempts: enrollment.quizAttempts.map((attempt, index) => ({
        attemptId: attempt.id,
        attemptNumber: enrollment.quizAttempts.length - index,
        quizTitle: attempt.quiz.title,
        scorePct: attempt.scorePct,
        passingScorePct: attempt.quiz.passingScorePct,
        isPassed: attempt.isPassed,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      })),
    };
  }

  async updateQuiz(id: string, data: { title?: string; passingScorePct?: number; maxAttempts?: number; timeLimitMinutes?: number; randomize?: boolean }) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException(`Quiz with ID "${id}" not found`);

    return this.prisma.quiz.update({
      where: { id },
      data,
      include: { questions: { orderBy: { order: 'asc' }, include: { options: true } } },
    });
  }

  async deleteQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException(`Quiz with ID "${id}" not found`);

    return this.prisma.quiz.delete({ where: { id } });
  }

  async duplicateQuiz(id: string) {
    const quiz = await this.findQuiz(id);
    if (!quiz) throw new NotFoundException(`Quiz with ID "${id}" not found`);

    const newQuiz = await this.prisma.quiz.create({
      data: {
        title: `${quiz.title} (Copy)`,
        courseId: quiz.courseId,
        passingScorePct: quiz.passingScorePct,
        maxAttempts: quiz.maxAttempts,
        timeLimitMinutes: quiz.timeLimitMinutes,
        randomize: quiz.randomize,
      },
    });

    for (const q of quiz.questions) {
      const newQuestion = await this.prisma.quizQuestion.create({
        data: {
          quizId: newQuiz.id,
          questionText: q.questionText,
          questionType: q.questionType,
          explanation: q.explanation,
          points: q.points,
          order: q.order,
        },
      });

      for (const opt of q.options) {
        await this.prisma.quizOption.create({
          data: {
            questionId: newQuestion.id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          },
        });
      }
    }

    return this.findQuiz(newQuiz.id);
  }

  async updateQuestion(questionId: string, data: { questionText?: string; questionType?: QuestionType; explanation?: string; points?: number; order?: number; options?: { optionText: string; isCorrect: boolean }[] }) {
    const question = await this.prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question with ID "${questionId}" not found`);

    const { options, ...fields } = data;

    if (options) {
      await this.prisma.quizOption.deleteMany({ where: { questionId } });
      for (const opt of options) {
        await this.prisma.quizOption.create({
          data: {
            questionId,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          },
        });
      }
    }

    return this.prisma.quizQuestion.update({
      where: { id: questionId },
      data: fields,
      include: { options: true },
    });
  }

  async deleteQuestion(questionId: string) {
    const question = await this.prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question with ID "${questionId}" not found`);

    return this.prisma.quizQuestion.delete({ where: { id: questionId } });
  }

  async reorderQuestions(quizId: string, questionIds: string[]) {
    for (let i = 0; i < questionIds.length; i++) {
      await this.prisma.quizQuestion.update({
        where: { id: questionIds[i] },
        data: { order: i + 1 },
      }).catch(() => {});
    }
    return this.findQuiz(quizId);
  }
}
