import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { BulkOperationDto } from './dto/bulk-operation.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new course' })
  create(@Body() createCourseDto: CreateCourseDto, @CurrentUser('id') userId: string) {
    return this.coursesService.create(createCourseDto, userId);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all courses paginated and filtered' })
  findAll(@Query() queryCourseDto: QueryCourseDto) {
    return this.coursesService.findAll(queryCourseDto);
  }

  @Get('catalog')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30 * 1000) // 30s cache for catalog
  @ApiOperation({ summary: 'Get published courses catalog' })
  findCatalog(@Query() queryCourseDto: QueryCourseDto, @CurrentUser('id') userId: string) {
    return this.coursesService.findCatalog(queryCourseDto, userId);
  }

  @Get('categories')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60 * 1000) // 60s cache for categories
  @ApiOperation({ summary: 'Get distinct course categories with counts' })
  getCategories() {
    return this.coursesService.getCategories();
  }

  @Post('bulk/archive')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Archive multiple courses' })
  bulkArchive(@Body() bulkDto: BulkOperationDto) {
    return this.coursesService.bulkArchive(bulkDto.courseIds);
  }

  @Delete('bulk')
  @Roles('ADMIN')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete multiple courses' })
  bulkDelete(@Body() bulkDto: BulkOperationDto) {
    return this.coursesService.bulkDelete(bulkDto.courseIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a course' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Post(':id/publish')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Publish a course' })
  publish(@Param('id') id: string) {
    return this.coursesService.publish(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a course' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
