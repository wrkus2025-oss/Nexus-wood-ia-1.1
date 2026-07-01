import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProjectStageDto {
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  stageId?: string;
}
