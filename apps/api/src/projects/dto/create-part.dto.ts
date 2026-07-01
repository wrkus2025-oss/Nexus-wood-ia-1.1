import { PartType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class PartHardwareInput {
  @IsString()
  hardwareId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePartDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @IsEnum(PartType)
  type?: PartType;

  @IsInt()
  @Min(1)
  widthMm: number;

  @IsInt()
  @Min(1)
  heightMm: number;

  @IsInt()
  @Min(1)
  thicknessMm: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  edgeBandTop?: string;

  @IsOptional()
  @IsString()
  edgeBandRight?: string;

  @IsOptional()
  @IsString()
  edgeBandBottom?: string;

  @IsOptional()
  @IsString()
  edgeBandLeft?: string;

  @IsOptional()
  @IsString()
  finish?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartHardwareInput)
  hardwareItems?: PartHardwareInput[];
}
