import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class DraftCourseDto {
  @ApiProperty({ description: 'Training topic', example: 'Enterprise Data Privacy & GDPR Rules' })
  @IsNotEmpty()
  @IsString()
  topic: string;

  @ApiProperty({ description: 'Target BPO role', example: 'Customer Support' })
  @IsNotEmpty()
  @IsString()
  targetRole: string;

  @ApiProperty({ description: 'Operational training objective', example: 'Ensure all agents adhere to strict PII protection protocols' })
  @IsNotEmpty()
  @IsString()
  objective: string;

  @ApiPropertyOptional({ description: 'Course difficulty level', example: 'Intermediate' })
  @IsOptional()
  @IsString()
  difficulty?: string = 'Intermediate';

  @ApiPropertyOptional({ description: 'Estimated duration in minutes', default: 60 })
  @IsOptional()
  @IsInt()
  @Min(15)
  estimatedDurationMinutes?: number = 60;

  @ApiPropertyOptional({ description: 'Whether to generate matching quiz assessment', default: true })
  @IsOptional()
  @IsBoolean()
  includeQuiz?: boolean = true;
}
