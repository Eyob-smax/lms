import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: 'Full name of the user', example: 'Sarah Connor' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ description: 'Email address (must be unique)', example: 'sarah.connor@example.com' })
  @IsEmail({}, { message: 'Must provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiPropertyOptional({ description: 'User role in the LMS platform', enum: Role, default: Role.AGENT })
  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.AGENT;

  @ApiPropertyOptional({ description: 'Department or Team name', example: 'Outbound Sales' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Optional initial password. If omitted, a temporary secure password will be auto-generated.', example: 'TempPass123!' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;
}
