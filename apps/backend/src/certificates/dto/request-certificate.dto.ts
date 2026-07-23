import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestCertificateDto {
  @ApiProperty({ description: 'The enrollment ID for the completed course', example: 'enrollment-uuid-123' })
  @IsNotEmpty({ message: 'Enrollment ID is required' })
  @IsString()
  enrollmentId: string;
}
