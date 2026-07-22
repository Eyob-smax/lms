import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { QuestionType } from '@prisma/client';

export class QuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsString()
  @IsNotEmpty({ message: 'Question text is required' })
  questionText: string;

  @IsEnum(QuestionType, { message: 'Question type must be MCQ, TRUE_FALSE, or SHORT_ANSWER' })
  questionType: QuestionType = QuestionType.MCQ;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsInt()
  @Min(1)
  points: number = 1;

  @IsInt()
  @Min(0)
  order: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];
}
