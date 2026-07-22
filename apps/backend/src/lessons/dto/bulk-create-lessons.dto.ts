import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLessonDto } from './create-lesson.dto';

export class BulkCreateLessonsDto {
  @ApiProperty({ description: 'Array of lessons to create', type: [CreateLessonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  @ArrayMinSize(1)
  lessons: CreateLessonDto[];
}
