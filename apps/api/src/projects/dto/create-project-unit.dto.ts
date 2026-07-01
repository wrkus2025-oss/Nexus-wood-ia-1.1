import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProjectUnitDto {
  @IsString()
  spaceId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNumber()
  @Min(1)
  widthMm: number;

  @IsNumber()
  @Min(1)
  heightMm: number;

  @IsNumber()
  @Min(1)
  depthMm: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
