import { IsNotEmpty, IsString } from 'class-validator';

export class MarkLessonCompleteDto {
  @IsString()
  @IsNotEmpty({ message: 'Enrollment ID is required' })
  enrollmentId: string;

  @IsString()
  @IsNotEmpty({ message: 'Lesson ID is required' })
  lessonId: string;
}
