import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  customer: string;

  @IsInt()
  @Min(1)
  widthMm: number;

  @IsInt()
  @Min(1)
  heightMm: number;

  @IsInt()
  @Min(1)
  depthMm: number;
}
