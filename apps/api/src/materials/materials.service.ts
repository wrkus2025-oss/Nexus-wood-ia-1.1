import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.material.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  create(dto: CreateMaterialDto) {
    return this.prisma.material.create({ data: dto });
  }

  update(id: string, dto: UpdateMaterialDto) {
    return this.prisma.material.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.material.delete({ where: { id } });
  }
}
