import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AnswerInputDto {
  @IsString()
  questionId: string;

  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @IsNumber()
  @IsOptional()
  selectedOptionIndex?: number;

  @IsString()
  @IsOptional()
  shortAnswerText?: string;
}

export class SubmitQuizAttemptDto {
  @IsString()
  @IsOptional()
  enrollmentId?: string;

  @IsString()
  @IsOptional()
  quizId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerInputDto)
  answers: AnswerInputDto[];
}
