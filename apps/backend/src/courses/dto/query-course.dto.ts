import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum CourseSortBy {
  CREATED_AT = 'createdAt',
  TITLE = 'title',
  ENROLLED_COUNT = 'enrolledCount',
  COMPLETION_RATE = 'completionRate',
}

export class QueryCourseDto {
  @ApiPropertyOptional({ description: 'Search term for title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: 'Category filter' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Department filter' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Status filter' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Difficulty filter' })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Field to sort by', enum: CourseSortBy })
  @IsEnum(CourseSortBy)
  @IsOptional()
  sortBy?: CourseSortBy;

  @ApiPropertyOptional({ description: 'Sort order', enum: SortOrder })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;

  @ApiPropertyOptional({ description: 'Minimum duration in minutes' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minDuration?: number;

  @ApiPropertyOptional({ description: 'Maximum duration in minutes' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxDuration?: number;
}
