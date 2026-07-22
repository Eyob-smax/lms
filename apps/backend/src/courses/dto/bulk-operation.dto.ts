import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkOperationDto {
  @ApiProperty({ description: 'List of course IDs to operate on', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  courseIds: string[];
}
