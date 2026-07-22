import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDepartmentDto {
  @ApiProperty({ description: 'New department / service line assignment', example: 'Customer Support' })
  @IsNotEmpty()
  @IsString()
  department: string;
}
