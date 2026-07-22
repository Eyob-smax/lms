import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateQuizDto {
  @ApiProperty({ description: 'Lesson title to base questions on', example: 'Objection Handling Strategies' })
  @IsNotEmpty()
  @IsString()
  lessonTitle: string;

  @ApiProperty({ description: 'Lesson rich text / markdown content', example: 'When customer states price is too high, use the Feel-Felt-Found framework...' })
  @IsNotEmpty()
  @IsString()
  lessonContent: string;

  @ApiPropertyOptional({ description: 'Target role', example: 'Sales' })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({ description: 'Number of questions to generate', default: 5, minimum: 1, maximum: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  questionCount?: number = 5;

  @ApiPropertyOptional({ description: 'Target difficulty tag', example: 'Intermediate' })
  @IsOptional()
  @IsString()
  difficulty?: string = 'Intermediate';
}
