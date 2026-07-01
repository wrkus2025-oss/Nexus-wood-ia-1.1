import { Role } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class AddWorkspaceMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;
}
