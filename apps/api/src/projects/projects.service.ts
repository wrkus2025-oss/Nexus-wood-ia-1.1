import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AuditEventType,
  PartType,
  Prisma,
  ProjectStatus,
} from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { CreatePartDto } from './dto/create-part.dto';
import { CreateProductionTaskDto } from './dto/create-production-task.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectNoteDto } from './dto/create-project-note.dto';
import { CreateProjectSpaceDto } from './dto/create-project-space.dto';
import { CreateProjectUnitDto } from './dto/create-project-unit.dto';
import { CreateUnitModuleDto } from './dto/create-unit-module.dto';
import { UpdateProductionTaskDto } from './dto/update-production-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectSpaceDto } from './dto/update-project-space.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { UpdateProjectUnitDto } from './dto/update-project-unit.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly customersService: CustomersService,
  ) {}

  private async workspace(userId: string) {
    return (await this.workspacesService.getActiveMembershipOrThrow(userId))
      .workspace;
  }

  private slug(value: string) {
    return (
      value
        .toUpperCase()
        .normalize('NFD')
        .replace(/[^A-Z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 24) || 'ITEM'
    );
  }

  private async audit(
    workspaceId: string,
    actorId: string,
    eventType: AuditEventType,
    entityType: string,
    entityId: string,
    projectId?: string,
    details?: Record<string, unknown>,
  ) {
    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId,
        eventType,
        entityType,
        entityId,
        projectId,
        details: details as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private async projectOrThrow(userId: string, id: string) {
    const workspace = await this.workspace(userId);
    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return { workspace, project };
  }

  private async stageForStatus(
    workspaceId: string,
    status: ProjectStatus,
    explicitStageId?: string,
  ) {
    if (explicitStageId) {
      return this.prisma.workflowStage.findFirst({
        where: { id: explicitStageId, workspaceId },
      });
    }
    return this.prisma.workflowStage.findFirst({
      where: { workspaceId, key: status },
    });
  }

  async findAll(userId: string) {
    const workspace = await this.workspace(userId);
    return this.prisma.project.findMany({
      where: { workspaceId: workspace.id },
      include: {
        customer: true,
        _count: { select: { spaces: true, tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    await this.projectOrThrow(userId, id);
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        customer: { include: { contacts: true, addresses: true } },
        spaces: {
          include: {
            units: {
              include: {
                modules: {
                  include: {
                    parts: {
                      include: {
                        material: { include: { category: true } },
                        hardwareItems: {
                          include: {
                            hardware: { include: { category: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        history: {
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
            stage: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        projectNotes: {
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        auditEvents: {
          include: { actor: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(userId: string, dto: CreateProjectDto) {
    const workspace = await this.workspace(userId);
    await this.customersService.findByWorkspace(userId, dto.customerId);
    const code =
      dto.code ?? `${this.slug(dto.name)}-${Date.now().toString().slice(-4)}`;
    const project = await this.prisma.project.create({
      data: {
        workspaceId: workspace.id,
        customerId: dto.customerId,
        ownerId: userId,
        name: dto.name,
        code,
        description: dto.description,
        status: dto.status ?? 'DRAFT',
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        depthMm: dto.depthMm,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        quotedValue: dto.quotedValue,
      },
    });
    const stage = await this.stageForStatus(workspace.id, project.status);
    await this.prisma.projectStageHistory.create({
      data: {
        projectId: project.id,
        workspaceId: workspace.id,
        changedById: userId,
        status: project.status,
        stageId: stage?.id,
        note: 'Projeto criado',
      },
    });
    await this.audit(
      workspace.id,
      userId,
      'PROJECT_CREATED',
      'project',
      project.id,
      project.id,
      { code: project.code },
    );
    return this.findOne(userId, project.id);
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    const { workspace, project } = await this.projectOrThrow(userId, id);
    if (dto.customerId) {
      await this.customersService.findByWorkspace(userId, dto.customerId);
    }
    await this.prisma.project.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        status: dto.status,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        depthMm: dto.depthMm,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        quotedValue: dto.quotedValue,
      },
    });
    await this.audit(
      workspace.id,
      userId,
      'PROJECT_UPDATED',
      'project',
      project.id,
      project.id,
    );
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.projectOrThrow(userId, id);
    return this.prisma.project.delete({ where: { id } });
  }

  async updateStage(userId: string, id: string, dto: UpdateProjectStageDto) {
    const { workspace, project } = await this.projectOrThrow(userId, id);
    const stage = await this.stageForStatus(
      workspace.id,
      dto.status,
      dto.stageId,
    );
    const updated = await this.prisma.project.update({
      where: { id },
      data: { status: dto.status },
    });
    await this.prisma.projectStageHistory.create({
      data: {
        projectId: project.id,
        workspaceId: workspace.id,
        changedById: userId,
        stageId: stage?.id,
        status: dto.status,
        note: dto.note,
      },
    });
    await this.audit(
      workspace.id,
      userId,
      'STATUS_CHANGED',
      'project',
      project.id,
      project.id,
      {
        from: project.status,
        to: dto.status,
      },
    );
    return updated;
  }

  async createSpace(
    userId: string,
    projectId: string,
    dto: CreateProjectSpaceDto,
  ) {
    const { workspace, project } = await this.projectOrThrow(userId, projectId);
    const existingCount = await this.prisma.projectSpace.count({
      where: { projectId },
    });
    const space = await this.prisma.projectSpace.create({
      data: {
        projectId,
        name: dto.name,
        code: dto.code ?? `SPACE-${existingCount + 1}`,
        notes: dto.notes,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        depthMm: dto.depthMm,
      },
    });
    await this.audit(
      workspace.id,
      userId,
      'SPACE_CREATED',
      'projectSpace',
      space.id,
      project.id,
    );
    return space;
  }

  async updateSpace(
    userId: string,
    projectId: string,
    spaceId: string,
    dto: UpdateProjectSpaceDto,
  ) {
    await this.projectOrThrow(userId, projectId);
    const space = await this.prisma.projectSpace.findFirst({
      where: { id: spaceId, projectId },
    });
    if (!space) {
      throw new NotFoundException('Project space not found');
    }
    return this.prisma.projectSpace.update({
      where: { id: spaceId },
      data: {
        name: dto.name,
        code: dto.code,
        notes: dto.notes,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        depthMm: dto.depthMm,
      },
    });
  }

  async deleteSpace(userId: string, projectId: string, spaceId: string) {
    await this.projectOrThrow(userId, projectId);
    const space = await this.prisma.projectSpace.findFirst({
      where: { id: spaceId, projectId },
    });
    if (!space) {
      throw new NotFoundException('Project space not found');
    }
    return this.prisma.projectSpace.delete({ where: { id: spaceId } });
  }

  async listUnits(userId: string, projectId: string) {
    await this.projectOrThrow(userId, projectId);
    return this.prisma.projectUnit.findMany({
      where: { space: { projectId } },
      include: {
        space: true,
        modules: {
          include: {
            parts: {
              include: {
                material: true,
                hardwareItems: { include: { hardware: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createUnit(
    userId: string,
    projectId: string,
    dto: CreateProjectUnitDto,
  ) {
    const { workspace, project } = await this.projectOrThrow(userId, projectId);
    const space = await this.prisma.projectSpace.findFirst({
      where: { id: dto.spaceId, projectId },
    });
    if (!space) {
      throw new NotFoundException('Project space not found');
    }
    const count = await this.prisma.projectUnit.count({
      where: { spaceId: dto.spaceId },
    });
    const unit = await this.prisma.projectUnit.create({
      data: {
        spaceId: dto.spaceId,
        name: dto.name,
        code: dto.code ?? `UNIT-${count + 1}`,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        depthMm: dto.depthMm,
        notes: dto.notes,
      },
    });
    await this.audit(
      workspace.id,
      userId,
      'UNIT_CREATED',
      'projectUnit',
      unit.id,
      project.id,
    );
    return unit;
  }

  async updateUnit(
    userId: string,
    projectId: string,
    unitId: string,
    dto: UpdateProjectUnitDto,
  ) {
    await this.projectOrThrow(userId, projectId);
    const unit = await this.prisma.projectUnit.findFirst({
      where: { id: unitId, space: { projectId } },
    });
    if (!unit) {
      throw new NotFoundException('Project unit not found');
    }
    return this.prisma.projectUnit.update({
      where: { id: unitId },
      data: {
        spaceId: dto.spaceId,
        name: dto.name,
        code: dto.code,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        depthMm: dto.depthMm,
        notes: dto.notes,
      },
    });
  }

  async deleteUnit(userId: string, projectId: string, unitId: string) {
    await this.projectOrThrow(userId, projectId);
    const unit = await this.prisma.projectUnit.findFirst({
      where: { id: unitId, space: { projectId } },
    });
    if (!unit) {
      throw new NotFoundException('Project unit not found');
    }
    return this.prisma.projectUnit.delete({ where: { id: unitId } });
  }

  async createModule(userId: string, unitId: string, dto: CreateUnitModuleDto) {
    const workspace = await this.workspace(userId);
    const unit = await this.prisma.projectUnit.findFirst({
      where: { id: unitId, space: { project: { workspaceId: workspace.id } } },
      include: { space: { include: { project: true } } },
    });
    if (!unit) {
      throw new NotFoundException('Project unit not found');
    }
    const count = await this.prisma.unitModule.count({ where: { unitId } });
    const module = await this.prisma.unitModule.create({
      data: {
        unitId,
        name: dto.name,
        code: dto.code ?? `MODULE-${count + 1}`,
        notes: dto.notes,
      },
    });
    await this.audit(
      workspace.id,
      userId,
      'MODULE_CREATED',
      'unitModule',
      module.id,
      unit.space.project.id,
    );
    return module;
  }

  async createPart(userId: string, moduleId: string, dto: CreatePartDto) {
    const workspace = await this.workspace(userId);
    const module = await this.prisma.unitModule.findFirst({
      where: {
        id: moduleId,
        unit: { space: { project: { workspaceId: workspace.id } } },
      },
      include: { unit: { include: { space: { include: { project: true } } } } },
    });
    if (!module) {
      throw new NotFoundException('Project module not found');
    }
    if (dto.materialId) {
      const material = await this.prisma.material.findFirst({
        where: { id: dto.materialId, workspaceId: workspace.id },
      });
      if (!material) {
        throw new NotFoundException('Material not found');
      }
    }
    const hardwareIds = dto.hardwareItems?.map((item) => item.hardwareId) ?? [];
    if (hardwareIds.length) {
      const count = await this.prisma.hardware.count({
        where: { id: { in: hardwareIds }, workspaceId: workspace.id },
      });
      if (count !== hardwareIds.length) {
        throw new NotFoundException('Hardware item not found');
      }
    }
    const existingCount = await this.prisma.part.count({ where: { moduleId } });
    const part = await this.prisma.part.create({
      data: {
        moduleId,
        materialId: dto.materialId,
        name: dto.name,
        code: dto.code ?? `PART-${existingCount + 1}`,
        type: dto.type ?? PartType.PANEL,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        thicknessMm: dto.thicknessMm,
        quantity: dto.quantity ?? 1,
        edgeBandTop: dto.edgeBandTop,
        edgeBandRight: dto.edgeBandRight,
        edgeBandBottom: dto.edgeBandBottom,
        edgeBandLeft: dto.edgeBandLeft,
        finish: dto.finish,
        notes: dto.notes,
        hardwareItems: dto.hardwareItems?.length
          ? {
              create: dto.hardwareItems.map((item) => ({
                hardwareId: item.hardwareId,
                quantity: item.quantity,
                notes: item.notes,
              })),
            }
          : undefined,
      },
      include: {
        material: true,
        hardwareItems: { include: { hardware: true } },
      },
    });
    await this.audit(
      workspace.id,
      userId,
      'PART_CREATED',
      'part',
      part.id,
      module.unit.space.project.id,
    );
    return part;
  }

  async listHistory(userId: string, projectId: string) {
    await this.projectOrThrow(userId, projectId);
    return this.prisma.projectStageHistory.findMany({
      where: { projectId },
      include: {
        stage: true,
        changedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listTasks(userId: string, projectId: string) {
    await this.projectOrThrow(userId, projectId);
    return this.prisma.productionTask.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(
    userId: string,
    projectId: string,
    dto: CreateProductionTaskDto,
  ) {
    const { workspace, project } = await this.projectOrThrow(userId, projectId);
    const task = await this.prisma.productionTask.create({
      data: {
        projectId,
        workspaceId: workspace.id,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assignedToId: dto.assignedToId,
        createdById: userId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    await this.audit(
      workspace.id,
      userId,
      'TASK_CREATED',
      'productionTask',
      task.id,
      project.id,
    );
    return task;
  }

  async updateTask(
    userId: string,
    projectId: string,
    taskId: string,
    dto: UpdateProductionTaskDto,
  ) {
    const { workspace, project } = await this.projectOrThrow(userId, projectId);
    const task = await this.prisma.productionTask.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const updated = await this.prisma.productionTask.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assignedToId: dto.assignedToId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    await this.audit(
      workspace.id,
      userId,
      'TASK_UPDATED',
      'productionTask',
      task.id,
      project.id,
      { status: dto.status },
    );
    return updated;
  }

  async listAttachments(userId: string, projectId: string) {
    await this.projectOrThrow(userId, projectId);
    return this.prisma.attachment.findMany({
      where: { projectId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addAttachment(
    userId: string,
    projectId: string,
    dto: CreateAttachmentDto,
  ) {
    const { workspace, project } = await this.projectOrThrow(userId, projectId);
    const attachment = await this.prisma.attachment.create({
      data: {
        projectId,
        workspaceId: workspace.id,
        name: dto.name,
        kind: dto.kind ?? 'DOCUMENT',
        url: dto.url,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    await this.audit(
      workspace.id,
      userId,
      'ATTACHMENT_CREATED',
      'attachment',
      attachment.id,
      project.id,
    );
    return attachment;
  }

  async listNotes(userId: string, projectId: string) {
    await this.projectOrThrow(userId, projectId);
    return this.prisma.projectNote.findMany({
      where: { projectId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addNote(userId: string, projectId: string, dto: CreateProjectNoteDto) {
    const { workspace, project } = await this.projectOrThrow(userId, projectId);
    const note = await this.prisma.projectNote.create({
      data: {
        projectId,
        workspaceId: workspace.id,
        body: dto.body,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    await this.audit(
      workspace.id,
      userId,
      'NOTE_CREATED',
      'projectNote',
      note.id,
      project.id,
    );
    return note;
  }

  async activity(userId: string, projectId: string) {
    await this.projectOrThrow(userId, projectId);
    return this.prisma.auditEvent.findMany({
      where: { projectId },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
