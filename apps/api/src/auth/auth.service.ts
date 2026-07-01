/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role ?? Role.DESIGNER,
    });

    const workspace = await this.workspacesService.createInitialWorkspace(
      user.id,
      user.role,
      dto.workspaceName ?? `${dto.name.split(' ')[0]}'s Workspace`,
    );

    return this.signToken(user.id, user.email, user.role, workspace.id);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const currentWorkspaceId = user.activeWorkspaceId ?? user.memberships[0]?.workspaceId ?? null;
    if (currentWorkspaceId && user.activeWorkspaceId !== currentWorkspaceId) {
      await this.usersService.setActiveWorkspace(user.id, currentWorkspaceId);
    }

    return this.signToken(user.id, user.email, user.role, currentWorkspaceId);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { success: true };
    }

    const token = crypto.randomBytes(24).toString('hex');
    await this.usersService.setResetToken(
      user.id,
      token,
      new Date(Date.now() + 1000 * 60 * 30),
    );

    return { success: true, resetToken: token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);
    if (
      !user ||
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);

    return { success: true };
  }

  async me(userId: string) {
    const user = await this.usersService.findAuthUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const memberships = user.memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      workspaceId: membership.workspaceId,
      workspace: membership.workspace,
    }));

    const activeWorkspace = user.activeWorkspace ?? memberships[0]?.workspace ?? null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      activeWorkspaceId: activeWorkspace?.id ?? user.activeWorkspaceId ?? null,
      activeWorkspace,
      memberships,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private signToken(userId: string, email: string, role: Role, workspaceId?: string | null) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role, workspaceId });
    return { accessToken };
  }
}
