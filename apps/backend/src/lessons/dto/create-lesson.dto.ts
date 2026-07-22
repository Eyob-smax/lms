import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsEnum } from 'class-validator';

export enum LessonType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  PDF_FILE = 'PDF_FILE',
  SLIDES = 'SLIDES',
}

export class CreateLessonDto {
  @ApiProperty({ description: 'The ID of the module this lesson belongs to' })
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({ description: 'The title of the lesson' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'The description of the lesson' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'The type of the lesson', enum: LessonType })
  @IsEnum(LessonType)
  lessonType: LessonType;

  @ApiProperty({ description: 'The content of the lesson (rich text markdown)' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'The URL of the video (if type is VIDEO)' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'The URL of the file attachment (if type is PDF_FILE)' })
  @IsOptional()
  @IsString()
  fileAttachmentUrl?: string;

  @ApiPropertyOptional({ description: 'The URL of the slides (if type is SLIDES)' })
  @IsOptional()
  @IsString()
  slidesUrl?: string;

  @ApiProperty({ description: 'The duration of the lesson in minutes', default: 10, minimum: 0 })
  @IsInt()
  @Min(0)
  durationMinutes: number;

  @ApiProperty({ description: 'The order of the lesson within the module', minimum: 0 })
  @IsInt()
  @Min(0)
  order: number;
}
