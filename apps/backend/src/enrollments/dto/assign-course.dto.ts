import { IsArray, IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignCourseDto {
  @IsString()
  @IsNotEmpty({ message: 'Course ID is required' })
  courseId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];

  @IsString()
  @IsOptional()
  department?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean = true;
}
