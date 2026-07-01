import { AttachmentKind } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(AttachmentKind)
  kind?: AttachmentKind;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;
}
