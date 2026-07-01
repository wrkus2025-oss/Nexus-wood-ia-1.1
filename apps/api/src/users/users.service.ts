import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: Role;
  }) {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { memberships: true, activeWorkspace: true },
    });
  }

  findAuthUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { workspace: true },
          orderBy: { createdAt: 'asc' },
        },
        activeWorkspace: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activeWorkspaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findByResetToken(token: string) {
    return this.prisma.user.findFirst({ where: { resetToken: token } });
  }

  setResetToken(id: string, token: string, expiresAt: Date) {
    return this.prisma.user.update({
      where: { id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });
  }

  setActiveWorkspace(id: string, workspaceId: string) {
    return this.prisma.user.update({
      where: { id },
      data: { activeWorkspaceId: workspaceId },
    });
  }

  listAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activeWorkspaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
