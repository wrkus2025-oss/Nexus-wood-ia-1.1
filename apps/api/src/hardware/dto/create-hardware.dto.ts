import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateHardwareDto {
  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  manufacturer: string;

  @IsString()
  code: string;

  @IsString()
  measures: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsString()
  finish?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  catalogUrl?: string;

  @IsOptional()
  @IsString()
  manualUrl?: string;

  @IsNumber()
  @Min(0)
  unitCost: number;
}
