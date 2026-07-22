import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset verification token' })
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'newSecurePass123!', description: 'New password (min 6 characters)' })
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}
