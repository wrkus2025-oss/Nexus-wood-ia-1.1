import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  manufacturer: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(1)
  thicknessMm: number;

  @IsString()
  color: string;

  @IsString()
  grainDirection: string;

  @IsOptional()
  @IsString()
  finish?: string;

  @IsOptional()
  @IsString()
  textureUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  sheetWidthMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  sheetHeightMm?: number;

  @IsNumber()
  @Min(0)
  weightKgM2: number;

  @IsNumber()
  @Min(0)
  pricePerSheet: number;
}
