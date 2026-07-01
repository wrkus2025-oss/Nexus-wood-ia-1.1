import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  private slugify(value: string) {
    return (
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 48) || 'workspace'
    );
  }

  private async uniqueSlug(name: string) {
    const base = this.slugify(name);
    let slug = base;
    let suffix = 1;
    while (await this.prisma.workspace.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  async createInitialWorkspace(userId: string, role: Role, name: string) {
    const slug = await this.uniqueSlug(name);
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: { userId, role },
        },
        workflowStages: {
          create: [
            { key: 'DRAFT', label: 'Rascunho', orderIndex: 0, color: 'zinc' },
            { key: 'APPROVED', label: 'Aprovado', orderIndex: 1, color: 'sky' },
            { key: 'CUTTING', label: 'Corte', orderIndex: 2, color: 'amber' },
            {
              key: 'EDGE_BANDING',
              label: 'Fita de Borda',
              orderIndex: 3,
              color: 'fuchsia',
            },
            {
              key: 'ASSEMBLY',
              label: 'Montagem',
              orderIndex: 4,
              color: 'violet',
            },
            {
              key: 'DELIVERED',
              label: 'Entregue',
              orderIndex: 5,
              color: 'emerald',
            },
          ],
        },
      },
    });
    await this.usersService.setActiveWorkspace(userId, workspace.id);
    return workspace;
  }

  async getActiveMembershipOrThrow(userId: string) {
    const user = await this.usersService.findAuthUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const activeWorkspaceId =
      user.activeWorkspaceId ?? user.memberships[0]?.workspaceId;
    if (!activeWorkspaceId) {
      throw new BadRequestException('User has no workspace');
    }
    const membership = user.memberships.find(
      (item) => item.workspaceId === activeWorkspaceId,
    );
    if (!membership) {
      throw new ForbiddenException('Workspace membership not found');
    }
    if (user.activeWorkspaceId !== activeWorkspaceId) {
      await this.usersService.setActiveWorkspace(user.id, activeWorkspaceId);
    }
    return { user, membership, workspace: membership.workspace };
  }

  async ensureWorkspaceAccess(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: true },
    });
    if (!membership) {
      throw new ForbiddenException('Workspace access denied');
    }
    return membership;
  }

  async ensureWorkspaceAdmin(userId: string, workspaceId: string) {
    const membership = await this.ensureWorkspaceAccess(userId, workspaceId);
    if (membership.role !== Role.ADMIN) {
      throw new ForbiddenException('Workspace admin access required');
    }
    return membership;
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      description: membership.workspace.description,
      role: membership.role,
      createdAt: membership.workspace.createdAt,
      updatedAt: membership.workspace.updatedAt,
    }));
  }

  async getCurrent(userId: string) {
    const { membership, workspace } =
      await this.getActiveMembershipOrThrow(userId);
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      role: membership.role,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    const user = await this.usersService.findAuthUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const slug = await this.uniqueSlug(dto.name);
    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        description: dto.description,
        slug,
        members: {
          create: { userId, role: user.role },
        },
        workflowStages: {
          create: [
            { key: 'DRAFT', label: 'Rascunho', orderIndex: 0, color: 'zinc' },
            { key: 'APPROVED', label: 'Aprovado', orderIndex: 1, color: 'sky' },
            { key: 'CUTTING', label: 'Corte', orderIndex: 2, color: 'amber' },
            {
              key: 'EDGE_BANDING',
              label: 'Fita de Borda',
              orderIndex: 3,
              color: 'fuchsia',
            },
            {
              key: 'ASSEMBLY',
              label: 'Montagem',
              orderIndex: 4,
              color: 'violet',
            },
            {
              key: 'DELIVERED',
              label: 'Entregue',
              orderIndex: 5,
              color: 'emerald',
            },
          ],
        },
      },
    });
    await this.usersService.setActiveWorkspace(userId, workspace.id);
    return this.getCurrent(userId);
  }

  async update(userId: string, workspaceId: string, dto: UpdateWorkspaceDto) {
    await this.ensureWorkspaceAccess(userId, workspaceId);

    if (dto.setActive) {
      await this.usersService.setActiveWorkspace(userId, workspaceId);
      return this.getCurrent(userId);
    }

    await this.ensureWorkspaceAdmin(userId, workspaceId);
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
    return workspace;
  }

  async listMembers(userId: string, workspaceId: string) {
    await this.ensureWorkspaceAccess(userId, workspaceId);
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            activeWorkspaceId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(
    userId: string,
    workspaceId: string,
    dto: AddWorkspaceMemberDto,
  ) {
    await this.ensureWorkspaceAdmin(userId, workspaceId);
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const membership = await this.prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      update: { role: dto.role },
      create: { workspaceId, userId: user.id, role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            activeWorkspaceId: true,
          },
        },
      },
    });
    if (!user.activeWorkspaceId) {
      await this.usersService.setActiveWorkspace(user.id, workspaceId);
    }
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'workspaceMember',
        entityId: membership.id,
        eventType: 'MEMBER_ADDED',
        details: { email: dto.email, role: dto.role },
      },
    });
    return membership;
  }

  async updateMember(
    userId: string,
    workspaceId: string,
    memberId: string,
    dto: UpdateWorkspaceMemberDto,
  ) {
    await this.ensureWorkspaceAdmin(userId, workspaceId);
    const membership = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            activeWorkspaceId: true,
          },
        },
      },
    });
    if (membership.workspaceId !== workspaceId) {
      throw new ForbiddenException('Member does not belong to this workspace');
    }
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'workspaceMember',
        entityId: membership.id,
        eventType: 'MEMBER_UPDATED',
        details: { role: dto.role },
      },
    });
    return membership;
  }
}
