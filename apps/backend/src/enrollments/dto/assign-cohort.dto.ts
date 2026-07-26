import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class AssignCohortDto {
  @ApiProperty({ description: 'The ID of the course to assign', example: 'course-uuid-123' })
  @IsString()
  @IsNotEmpty({ message: 'Course ID is required' })
  courseId: string;

  @ApiPropertyOptional({ description: 'Filter by user role (e.g. AGENT or ADMIN)', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  targetRole?: Role;

  @ApiPropertyOptional({ description: 'Alias for targetRole', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Target department / service line (e.g. Sales, SDR, BDR, Customer Support, IT, HR)', example: 'SDR' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Custom cohort / batch name for logging and tracking', example: 'Customer Support Batch 3' })
  @IsOptional()
  @IsString()
  cohortName?: string;

  @ApiPropertyOptional({ description: 'Optional list of specific user IDs to include in this cohort assignment', example: ['user-1', 'user-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiPropertyOptional({ description: 'Optional completion due date (ISO string)', example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Whether completing this course is mandatory for the cohort', default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean = true;
}
