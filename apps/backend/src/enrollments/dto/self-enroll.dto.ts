import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelfEnrollDto {
  @ApiProperty({ description: 'The ID of the course to self-enroll in', example: 'cm3x...' })
  @IsString()
  @IsNotEmpty({ message: 'Course ID is required' })
  courseId: string;
}
