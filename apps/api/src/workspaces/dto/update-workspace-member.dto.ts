import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateWorkspaceMemberDto {
  @IsEnum(Role)
  role: Role;
}
