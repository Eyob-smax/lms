import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { BulkCreateLessonsDto } from './dto/bulk-create-lessons.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Module Operations ---
  async createModule(dto: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId }
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${dto.courseId} not found`);
    }

    return this.prisma.module.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description,
        order: dto.order,
      },
      include: {
        lessons: true,
      }
    });
  }

  async findModulesByCourse(courseId: string) {
    const modules = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { lessons: true }
        }
      }
    });
    return modules.map(m => ({
      ...m,
      lessonCount: m._count.lessons,
      _count: undefined,
    }));
  }

  async findModule(moduleId: string) {
    const moduleRecord = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        }
      }
    });
    if (!moduleRecord) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }
    return moduleRecord;
  }

  async updateModule(moduleId: string, dto: UpdateModuleDto) {
    const moduleRecord = await this.prisma.module.findUnique({ where: { id: moduleId }});
    if (!moduleRecord) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return this.prisma.module.update({
      where: { id: moduleId },
      data: dto,
      include: {
        lessons: true,
      }
    });
  }

  async reorderModules(courseId: string, orderedIds: string[]) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.module.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return this.findModulesByCourse(courseId);
  }

  async removeModule(moduleId: string) {
    const moduleRecord = await this.prisma.module.findUnique({ where: { id: moduleId }});
    if (!moduleRecord) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return this.prisma.module.delete({
      where: { id: moduleId },
    });
  }

  // --- Lesson Operations ---
  async createLesson(dto: CreateLessonDto) {
    const moduleRecord = await this.prisma.module.findUnique({ where: { id: dto.moduleId }});
    if (!moduleRecord) {
      throw new NotFoundException(`Module with ID ${dto.moduleId} not found`);
    }

    return this.prisma.lesson.create({
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        description: dto.description,
        lessonType: dto.lessonType as any,
        content: dto.content,
        videoUrl: dto.videoUrl,
        fileAttachmentUrl: dto.fileAttachmentUrl,
        slidesUrl: dto.slidesUrl,
        durationMinutes: dto.durationMinutes,
        order: dto.order,
      }
    });
  }

  async bulkCreateLessons(dto: BulkCreateLessonsDto) {
    const moduleIds = [...new Set(dto.lessons.map(l => l.moduleId))];
    const modules = await this.prisma.module.findMany({
      where: { id: { in: moduleIds } }
    });
    
    if (modules.length !== moduleIds.length) {
      throw new NotFoundException('One or more module IDs not found');
    }

    return this.prisma.$transaction(
      dto.lessons.map(lesson => 
        this.prisma.lesson.create({
          data: {
            moduleId: lesson.moduleId,
            title: lesson.title,
            description: lesson.description,
            lessonType: lesson.lessonType as any,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            fileAttachmentUrl: lesson.fileAttachmentUrl,
            slidesUrl: lesson.slidesUrl,
            durationMinutes: lesson.durationMinutes,
            order: lesson.order,
          }
        })
      )
    );
  }

  async findLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
          }
        }
      }
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }
    return lesson;
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }});
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        description: dto.description,
        lessonType: dto.lessonType as any,
        content: dto.content,
        videoUrl: dto.videoUrl,
        fileAttachmentUrl: dto.fileAttachmentUrl,
        slidesUrl: dto.slidesUrl,
        durationMinutes: dto.durationMinutes,
        order: dto.order,
      }
    });
  }

  async reorderLessons(moduleId: string, orderedIds: string[]) {
    const moduleRecord = await this.prisma.module.findUnique({ where: { id: moduleId }});
    if (!moduleRecord) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.lesson.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });
  }

  async removeLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }});
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return this.prisma.lesson.delete({
      where: { id: lessonId },
    });
  }

  // --- Navigation & Outline ---
  async getCourseOutline(courseId: string) {
    const course: any = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                lessonType: true,
                durationMinutes: true,
                order: true,
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    let totalLessons = 0;
    let totalDurationMinutes = 0;

    const modules = course.modules.map(mod => {
      const lessonCount = mod.lessons.length;
      totalLessons += lessonCount;
      totalDurationMinutes += mod.lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

      return {
        id: mod.id,
        title: mod.title,
        order: mod.order,
        lessonCount,
        lessons: mod.lessons,
      };
    });

    return {
      courseId: course.id,
      courseTitle: course.title || '',
      modules,
      totalLessons,
      totalDurationMinutes,
    };
  }

  async getLessonNavigation(lessonId: string) {
    const lesson: any = await this.findLesson(lessonId);
    const courseId = lesson.module.courseId;

    const courseOutline = await this.getCourseOutline(courseId);

    const allLessonsFlat = courseOutline.modules.flatMap(mod => 
      mod.lessons.map(l => ({
        id: l.id,
        title: l.title,
        moduleId: mod.id,
        moduleTitle: mod.title,
      }))
    );

    const currentIndex = allLessonsFlat.findIndex(l => l.id === lessonId);
    
    const previousLesson = currentIndex > 0 ? {
      id: allLessonsFlat[currentIndex - 1].id,
      title: allLessonsFlat[currentIndex - 1].title,
    } : null;

    const nextLesson = currentIndex < allLessonsFlat.length - 1 ? {
      id: allLessonsFlat[currentIndex + 1].id,
      title: allLessonsFlat[currentIndex + 1].title,
    } : null;

    const currentModuleLessons = allLessonsFlat.filter(l => l.moduleId === lesson.moduleId);
    const currentLessonIndexInModule = currentModuleLessons.findIndex(l => l.id === lessonId);

    return {
      current: lesson,
      previousLesson,
      nextLesson,
      currentModuleTitle: lesson.module.title,
      progress: {
        currentLessonIndex: currentLessonIndexInModule + 1,
        totalLessonsInModule: currentModuleLessons.length,
        totalLessonsInCourse: allLessonsFlat.length,
      }
    };
  }
}
