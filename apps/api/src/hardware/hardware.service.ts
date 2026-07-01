import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateHardwareDto } from './dto/create-hardware.dto';
import { UpdateHardwareDto } from './dto/update-hardware.dto';

@Injectable()
export class HardwareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async workspaceId(userId: string) {
    return (await this.workspacesService.getActiveMembershipOrThrow(userId)).workspace.id;
  }

  private async resolveCategory(userId: string, categoryName?: string) {
    const workspaceId = await this.workspaceId(userId);
    if (!categoryName) {
      return { workspaceId, categoryId: undefined as string | undefined };
    }
    const category = await this.prisma.hardwareCategory.upsert({
      where: { workspaceId_name: { workspaceId, name: categoryName } },
      update: {},
      create: { workspaceId, name: categoryName },
    });
    return { workspaceId, categoryId: category.id };
  }

  async list(userId: string) {
    const workspaceId = await this.workspaceId(userId);
    return this.prisma.hardware.findMany({
      where: { workspaceId },
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listCategories(userId: string) {
    const workspaceId = await this.workspaceId(userId);
    return this.prisma.hardwareCategory.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateHardwareDto) {
    const { workspaceId, categoryId } = await this.resolveCategory(userId, dto.categoryName);
    return this.prisma.hardware.create({
      data: {
        workspaceId,
        categoryId,
        type: dto.type,
        name: dto.name,
        manufacturer: dto.manufacturer,
        code: dto.code,
        measures: dto.measures,
        finish: dto.finish,
        description: dto.description,
        catalogUrl: dto.catalogUrl,
        manualUrl: dto.manualUrl,
        unitCost: dto.unitCost,
      },
      include: { category: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateHardwareDto) {
    const workspaceId = await this.workspaceId(userId);
    const hardware = await this.prisma.hardware.findFirst({ where: { id, workspaceId } });
    if (!hardware) {
      throw new NotFoundException('Hardware not found');
    }
    const { categoryId } = await this.resolveCategory(userId, dto.categoryName);
    return this.prisma.hardware.update({
      where: { id },
      data: {
        categoryId,
        type: dto.type,
        name: dto.name,
        manufacturer: dto.manufacturer,
        code: dto.code,
        measures: dto.measures,
        finish: dto.finish,
        description: dto.description,
        catalogUrl: dto.catalogUrl,
        manualUrl: dto.manualUrl,
        unitCost: dto.unitCost,
      },
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    const workspaceId = await this.workspaceId(userId);
    const hardware = await this.prisma.hardware.findFirst({ where: { id, workspaceId } });
    if (!hardware) {
      throw new NotFoundException('Hardware not found');
    }
    return this.prisma.hardware.delete({ where: { id } });
  }
}
