import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'Activation status of the user account', example: true })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
