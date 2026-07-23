import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectCertificateDto {
  @ApiPropertyOptional({ description: 'Optional reason for rejecting certificate request', example: 'Must re-take assessment quiz to achieve minimum score' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
