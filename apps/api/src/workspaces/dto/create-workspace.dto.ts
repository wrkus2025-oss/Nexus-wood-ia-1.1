import { IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
