import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ReorderDto } from './dto/reorder.dto';
import { BulkCreateLessonsDto } from './dto/bulk-create-lessons.dto';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // Module endpoints
  @Post('modules')
  @ApiOperation({ summary: 'Create a new module' })
  createModule(@Body() createModuleDto: CreateModuleDto) {
    return this.lessonsService.createModule(createModuleDto);
  }

  @Get('course/:courseId/modules')
  @ApiOperation({ summary: 'Get all modules for a course' })
  findModulesByCourse(@Param('courseId') courseId: string) {
    return this.lessonsService.findModulesByCourse(courseId);
  }

  @Get('course/:courseId/outline')
  @ApiOperation({ summary: 'Get course outline' })
  getCourseOutline(@Param('courseId') courseId: string) {
    return this.lessonsService.getCourseOutline(courseId);
  }

  @Get('modules/:id')
  @ApiOperation({ summary: 'Get a module by id' })
  findModule(@Param('id') id: string) {
    return this.lessonsService.findModule(id);
  }

  @Patch('modules/:id')
  @ApiOperation({ summary: 'Update a module' })
  updateModule(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.lessonsService.updateModule(id, updateModuleDto);
  }

  @Post('course/:courseId/reorder-modules')
  @ApiOperation({ summary: 'Reorder modules in a course' })
  reorderModules(@Param('courseId') courseId: string, @Body() reorderDto: ReorderDto) {
    return this.lessonsService.reorderModules(courseId, reorderDto.orderedIds);
  }

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Delete a module' })
  removeModule(@Param('id') id: string) {
    return this.lessonsService.removeModule(id);
  }

  // Lesson endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new lesson' })
  createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.createLesson(createLessonDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create lessons' })
  bulkCreateLessons(@Body() bulkCreateLessonsDto: BulkCreateLessonsDto) {
    return this.lessonsService.bulkCreateLessons(bulkCreateLessonsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lesson by id' })
  findLesson(@Param('id') id: string) {
    return this.lessonsService.findLesson(id);
  }

  @Get(':id/navigation')
  @ApiOperation({ summary: 'Get lesson navigation' })
  getLessonNavigation(@Param('id') id: string) {
    return this.lessonsService.getLessonNavigation(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lesson' })
  updateLesson(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.lessonsService.updateLesson(id, updateLessonDto);
  }

  @Post('modules/:moduleId/reorder-lessons')
  @ApiOperation({ summary: 'Reorder lessons in a module' })
  reorderLessons(@Param('moduleId') moduleId: string, @Body() reorderDto: ReorderDto) {
    return this.lessonsService.reorderLessons(moduleId, reorderDto.orderedIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lesson' })
  removeLesson(@Param('id') id: string) {
    return this.lessonsService.removeLesson(id);
  }
}
