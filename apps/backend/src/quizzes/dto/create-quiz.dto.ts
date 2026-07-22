import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty({ message: 'Course ID is required' })
  courseId: string;

  @IsString()
  @IsNotEmpty({ message: 'Quiz title is required' })
  title: string;

  @IsInt()
  @Min(1)
  @Max(100)
  passingScorePct: number = 80;

  @IsInt()
  @Min(1)
  maxAttempts: number = 3;

  @IsInt()
  @IsOptional()
  timeLimitMinutes?: number;

  @IsBoolean()
  @IsOptional()
  randomize?: boolean = true;
}
