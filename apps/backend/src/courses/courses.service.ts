import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto, userId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.course.count();
    const courseCode = `CRS-${year}-${String(count + 1).padStart(3, '0')}`;

    return this.prisma.course.create({
      data: {
        title: createCourseDto.title,
        description: createCourseDto.description,
        category: createCourseDto.category,
        department: createCourseDto.department,
        difficulty: createCourseDto.difficulty || 'Beginner',
        durationMinutes: createCourseDto.durationMinutes || 0,
        thumbnailUrl: createCourseDto.thumbnailUrl,
        courseCode,
        status: 'DRAFT',
        version: 1,
        tags: createCourseDto.tags || [],
        isMandatory: createCourseDto.isMandatory || false,
        createdBy: { connect: { id: userId } },
      },
    });
  }

  async findAll(query: QueryCourseDto) {
    const { page = 1, pageSize = 10, search, category, department, status, difficulty, minDuration, maxDuration, sortBy, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (department) where.department = department;
    if (status) where.status = status;
    if (difficulty) where.difficulty = difficulty;
    if (minDuration !== undefined || maxDuration !== undefined) {
      where.durationMinutes = {};
      if (minDuration !== undefined) where.durationMinutes.gte = minDuration;
      if (maxDuration !== undefined) where.durationMinutes.lte = maxDuration;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy && sortOrder) {
      if (sortBy === 'title' || sortBy === 'createdAt') {
        orderBy = { [sortBy]: sortOrder };
      } else {
        // Handle custom sort by relations if needed. For now, fallback to default.
        // enrolledCount and completionRate might need raw queries or complex aggregations.
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: {
            select: { modules: true, quizzes: true, enrollments: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findCatalog(query: QueryCourseDto, userId?: string) {
    // Only published courses
    const catalogQuery = { ...query, status: 'PUBLISHED' };
    const result = await this.findAll(catalogQuery);

    if (userId) {
      const courseIds = result.data.map(c => c.id);
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          userId,
          courseId: { in: courseIds }
        }
      });
      
      const enrollmentMap = enrollments.reduce((acc, curr) => {
        acc[curr.courseId] = curr;
        return acc;
      }, {} as Record<string, any>);

      result.data = result.data.map(c => ({
        ...c,
        enrollmentStatus: enrollmentMap[c.id] ? enrollmentMap[c.id].status : 'NOT_ENROLLED'
      })) as any;
    } else {
      result.data = result.data.map(c => ({
        ...c,
        enrollmentStatus: 'NOT_ENROLLED'
      })) as any;
    }

    return result;
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } }
          }
        },
        quizzes: {
          include: {
            questions: {
              include: {
                options: true
              }
            }
          }
        },
        _count: {
          select: { enrollments: true }
        }
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async getStatistics(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { modules: true }
        },
        modules: {
          include: {
            _count: { select: { lessons: true } }
          }
        }
      }
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    const aggregations = await this.prisma.enrollment.aggregate({
      where: { courseId: id },
      _count: { id: true },
      _avg: { overallProgressPct: true, finalScorePct: true }
    });

    const activeEnrollments = await this.prisma.enrollment.count({
      where: { courseId: id, status: 'IN_PROGRESS' }
    });
    
    const completedEnrollments = await this.prisma.enrollment.count({
      where: { courseId: id, status: 'COMPLETED' }
    });

    const totalLessons = course.modules.reduce((sum, mod) => sum + mod._count.lessons, 0);

    return {
      totalEnrolled: aggregations._count.id,
      activeEnrollments,
      completedEnrollments,
      averageCompletionPct: aggregations._avg.overallProgressPct || 0,
      averageQuizScore: aggregations._avg.finalScorePct || 0,
      totalModules: course._count.modules,
      totalLessons,
    };
  }

  async getCategories() {
    const categories = await this.prisma.course.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    return categories.map(c => ({
      category: c.category,
      count: c._count.id
    })).filter(c => c.category);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);

    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });
  }

  async publish(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);

    return this.prisma.course.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        version: { increment: 1 },
        publishedAt: new Date(),
      },
    });
  }

  async unpublish(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);

    return this.prisma.course.update({
      where: { id },
      data: {
        status: 'DRAFT',
      },
    });
  }

  async archive(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);

    return this.prisma.course.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });
  }

  async clone(id: string, userId: string) {
    const course = await this.findOne(id);

    const year = new Date().getFullYear();
    const count = await this.prisma.course.count();
    const courseCode = `CRS-${year}-${String(count + 1).padStart(3, '0')}`;

    // Create the new course
    const newCourse = await this.prisma.course.create({
      data: {
        title: `${course.title} (Copy)`,
        description: course.description,
        category: course.category,
        department: course.department,
        difficulty: course.difficulty,
        durationMinutes: course.durationMinutes,
        thumbnailUrl: course.thumbnailUrl,
        tags: course.tags,
        isMandatory: course.isMandatory,
        courseCode,
        status: 'DRAFT',
        version: 1,
        createdBy: { connect: { id: userId } },
      },
    });

    // We do sequential creation for relations to maintain order/IDs easily
    for (const mod of course.modules) {
      const newModule = await this.prisma.module.create({
        data: {
          title: mod.title,
          description: mod.description,
          order: mod.order,
          courseId: newCourse.id,
        }
      });

      for (const lesson of mod.lessons) {
        await this.prisma.lesson.create({
          data: {
            title: lesson.title,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            order: lesson.order,
            durationMinutes: lesson.durationMinutes,
            moduleId: newModule.id,
          }
        });
      }
    }

    for (const quiz of course.quizzes) {
      const newQuiz = await this.prisma.quiz.create({
        data: {
          title: quiz.title,
          passingScorePct: quiz.passingScorePct,
          maxAttempts: quiz.maxAttempts,
          timeLimitMinutes: quiz.timeLimitMinutes,
          randomize: quiz.randomize,
          courseId: newCourse.id,
        }
      });

      for (const question of quiz.questions) {
        const newQuestion = await this.prisma.quizQuestion.create({
          data: {
            questionText: question.questionText,
            questionType: question.questionType,
            explanation: question.explanation,
            points: question.points,
            order: question.order,
            quizId: newQuiz.id,
          }
        });

        for (const option of question.options) {
          await this.prisma.quizOption.create({
            data: {
              optionText: option.optionText,
              isCorrect: option.isCorrect,
              questionId: newQuestion.id,
            }
          });
        }
      }
    }

    return newCourse;
  }

  async bulkArchive(courseIds: string[]) {
    const result = await this.prisma.course.updateMany({
      where: { id: { in: courseIds } },
      data: { status: 'ARCHIVED' }
    });
    return { count: result.count, archivedIds: courseIds };
  }

  async bulkDelete(courseIds: string[]) {
    const result = await this.prisma.course.deleteMany({
      where: { id: { in: courseIds } }
    });
    return { count: result.count, deletedIds: courseIds };
  }

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);

    return this.prisma.course.delete({
      where: { id }
    });
  }
}
