import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsEnum(Role, { message: 'Role must be either ADMIN or AGENT' })
  role: Role = Role.AGENT;

  @IsString()
  @IsNotEmpty({ message: 'Department is required (e.g. Sales, SDR, IT, HR)' })
  department: string;
}
