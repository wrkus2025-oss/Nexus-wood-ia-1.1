import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProjectSpaceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  widthMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  heightMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  depthMm?: number;
}
