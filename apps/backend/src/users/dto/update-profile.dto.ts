import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jane Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Customer Support', description: 'User department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'https://cdn.lms.com/avatars/jane.jpg', description: 'Avatar image URL' })
  @IsOptional()
  @IsString()
  image?: string;
}
