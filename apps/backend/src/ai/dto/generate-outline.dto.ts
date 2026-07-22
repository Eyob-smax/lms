import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class GenerateOutlineDto {
  @IsString()
  @IsNotEmpty({ message: 'Training topic is required' })
  topic: string;

  @IsString()
  @IsNotEmpty({ message: 'Target role or department is required (e.g. SDR, Sales, Customer Support, IT, HR)' })
  targetRole: string;

  @IsString()
  @IsOptional()
  objective?: string;

  @IsInt()
  @Min(10)
  @IsOptional()
  estimatedDurationMinutes?: number = 60;
}
