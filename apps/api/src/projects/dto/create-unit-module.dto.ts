import { IsOptional, IsString } from 'class-validator';

export class CreateUnitModuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
