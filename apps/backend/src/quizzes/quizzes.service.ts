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

  async submitAttempt(quizId: string, dto: SubmitQuizAttemptDto) {
    const quiz = await this.findQuiz(quizId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: { quizAttempts: true },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID "${dto.enrollmentId}" not found`);
    }

    const previousAttemptsCount = enrollment.quizAttempts.filter((a) => a.quizId === quizId).length;
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
      totalPossiblePoints += question.points;
      const submittedAnswer = dto.answers.find((a) => a.questionId === question.id);

      let isCorrect = false;

      if (submittedAnswer) {
        if (question.questionType === QuestionType.MCQ || question.questionType === QuestionType.TRUE_FALSE) {
          if (submittedAnswer.selectedOptionId) {
            const correctOption = question.options.find((opt) => opt.isCorrect);
            if (correctOption && correctOption.id === submittedAnswer.selectedOptionId) {
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

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        enrollmentId: dto.enrollmentId,
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
      await this.prisma.enrollment.update({
        where: { id: dto.enrollmentId },
        data: {
          overallProgressPct: 100,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    return {
      attemptId: attempt.id,
      scorePct,
      passingScorePct: quiz.passingScorePct,
      isPassed,
      attemptsRemaining: quiz.maxAttempts - (previousAttemptsCount + 1),
      attempt,
    };
  }
}
