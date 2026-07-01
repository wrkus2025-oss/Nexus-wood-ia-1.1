import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({ data: { ...dto, ownerId } });
  }

  findMine(ownerId: string) {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(id: string, ownerId: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: { id, ownerId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: string, ownerId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, ownerId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.prisma.project.delete({ where: { id } });
  }

  async updateStatus(id: string, ownerId: string, status: ProjectStatus) {
    const project = await this.prisma.project.findFirst({
      where: { id, ownerId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.prisma.project.update({ where: { id }, data: { status } });
  }
}
