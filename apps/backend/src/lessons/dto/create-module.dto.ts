import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ description: 'The ID of the course this module belongs to' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'The title of the module' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'The description of the module' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'The order of the module within the course', minimum: 0 })
  @IsInt()
  @Min(0)
  order: number;
}
