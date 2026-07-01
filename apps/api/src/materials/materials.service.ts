import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
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
    const category = await this.prisma.materialCategory.upsert({
      where: { workspaceId_name: { workspaceId, name: categoryName } },
      update: {},
      create: { workspaceId, name: categoryName },
    });
    return { workspaceId, categoryId: category.id };
  }

  async list(userId: string) {
    const workspaceId = await this.workspaceId(userId);
    return this.prisma.material.findMany({
      where: { workspaceId },
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listCategories(userId: string) {
    const workspaceId = await this.workspaceId(userId);
    return this.prisma.materialCategory.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateMaterialDto) {
    const { workspaceId, categoryId } = await this.resolveCategory(userId, dto.categoryName);
    return this.prisma.material.create({
      data: {
        workspaceId,
        categoryId,
        name: dto.name,
        manufacturer: dto.manufacturer,
        group: dto.group,
        sku: dto.sku,
        thicknessMm: dto.thicknessMm,
        color: dto.color,
        grainDirection: dto.grainDirection,
        finish: dto.finish,
        textureUrl: dto.textureUrl,
        sheetWidthMm: dto.sheetWidthMm,
        sheetHeightMm: dto.sheetHeightMm,
        weightKgM2: dto.weightKgM2,
        pricePerSheet: dto.pricePerSheet,
      },
      include: { category: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateMaterialDto) {
    const workspaceId = await this.workspaceId(userId);
    const material = await this.prisma.material.findFirst({ where: { id, workspaceId } });
    if (!material) {
      throw new NotFoundException('Material not found');
    }
    const { categoryId } = await this.resolveCategory(userId, dto.categoryName);
    return this.prisma.material.update({
      where: { id },
      data: {
        categoryId,
        name: dto.name,
        manufacturer: dto.manufacturer,
        group: dto.group,
        sku: dto.sku,
        thicknessMm: dto.thicknessMm,
        color: dto.color,
        grainDirection: dto.grainDirection,
        finish: dto.finish,
        textureUrl: dto.textureUrl,
        sheetWidthMm: dto.sheetWidthMm,
        sheetHeightMm: dto.sheetHeightMm,
        weightKgM2: dto.weightKgM2,
        pricePerSheet: dto.pricePerSheet,
      },
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    const workspaceId = await this.workspaceId(userId);
    const material = await this.prisma.material.findFirst({ where: { id, workspaceId } });
    if (!material) {
      throw new NotFoundException('Material not found');
    }
    return this.prisma.material.delete({ where: { id } });
  }
}
