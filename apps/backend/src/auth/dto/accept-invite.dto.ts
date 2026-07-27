import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @ApiProperty({ description: 'Invitation verification token' })
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'MyNewSecurePass123!', description: 'New password for the account (min 6 characters)' })
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({ description: 'Email address of the invited user' })
  @IsOptional()
  @IsString()
  email?: string;
}
