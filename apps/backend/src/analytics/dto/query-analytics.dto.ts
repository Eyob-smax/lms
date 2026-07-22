import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TimeRange {
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  ALL_TIME = 'ALL_TIME',
}

export class QueryAnalyticsDto {
  @ApiPropertyOptional({ enum: TimeRange, default: TimeRange.LAST_30_DAYS })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.LAST_30_DAYS;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;
}
