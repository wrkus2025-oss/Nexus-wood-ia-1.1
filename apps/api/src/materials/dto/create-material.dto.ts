import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  manufacturer: string;

  @IsString()
  category: string;

  @IsNumber()
  @Min(1)
  thicknessMm: number;

  @IsString()
  color: string;

  @IsString()
  grainDirection: string;

  @IsOptional()
  @IsString()
  textureUrl?: string;

  @IsNumber()
  @Min(0)
  weightKgM2: number;

  @IsNumber()
  @Min(0)
  pricePerSheet: number;
}
