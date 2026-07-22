import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateLessonContentDto {
  @IsString()
  @IsNotEmpty({ message: 'Lesson title is required' })
  lessonTitle: string;

  @IsString()
  @IsNotEmpty({ message: 'Target role is required' })
  targetRole: string;

  @IsString()
  @IsOptional()
  summary?: string;
}
