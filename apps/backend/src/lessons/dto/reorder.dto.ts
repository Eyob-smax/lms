import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderDto {
  @ApiProperty({ description: 'Array of IDs in the new order', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  orderedIds: string[];
}
