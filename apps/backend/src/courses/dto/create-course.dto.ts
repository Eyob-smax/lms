import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsInt } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ description: 'Title of the course' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description of the course' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Category of the course' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Department offering the course' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Difficulty level' })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsInt()
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Tags for the course', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether the course is mandatory', default: false })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}
