import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHardwareDto } from './dto/create-hardware.dto';
import { UpdateHardwareDto } from './dto/update-hardware.dto';

@Injectable()
export class HardwareService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.hardware.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  create(dto: CreateHardwareDto) {
    return this.prisma.hardware.create({ data: dto });
  }

  update(id: string, dto: UpdateHardwareDto) {
    return this.prisma.hardware.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.hardware.delete({ where: { id } });
  }
}
