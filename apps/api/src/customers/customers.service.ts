import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async workspaceId(userId: string) {
    return (await this.workspacesService.getActiveMembershipOrThrow(userId))
      .workspace.id;
  }

  async findAll(userId: string) {
    const workspaceId = await this.workspaceId(userId);
    return this.prisma.customer.findMany({
      where: { workspaceId },
      include: {
        contacts: true,
        addresses: true,
        _count: { select: { projects: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateCustomerDto) {
    const workspaceId = await this.workspaceId(userId);
    return this.prisma.customer.create({
      data: {
        workspaceId,
        name: dto.name,
        companyName: dto.companyName,
        documentNumber: dto.documentNumber,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        contacts: dto.contacts?.length
          ? {
              create: dto.contacts.map((contact, index) => ({
                ...contact,
                isPrimary: index === 0,
              })),
            }
          : undefined,
        addresses: dto.addresses?.length
          ? {
              create: dto.addresses.map((address, index) => ({
                ...address,
                country: address.country ?? 'BR',
                isPrimary: index === 0,
              })),
            }
          : undefined,
      },
      include: {
        contacts: true,
        addresses: true,
        _count: { select: { projects: true } },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const workspaceId = await this.workspaceId(userId);
    const customer = await this.prisma.customer.findFirst({
      where: { id, workspaceId },
      include: {
        contacts: true,
        addresses: true,
        projects: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(userId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(userId, id);
    await this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name,
        companyName: dto.companyName,
        documentNumber: dto.documentNumber,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        contacts: dto.contacts
          ? {
              deleteMany: {},
              create: dto.contacts.map((contact, index) => ({
                ...contact,
                isPrimary: index === 0,
              })),
            }
          : undefined,
        addresses: dto.addresses
          ? {
              deleteMany: {},
              create: dto.addresses.map((address, index) => ({
                ...address,
                country: address.country ?? 'BR',
                isPrimary: index === 0,
              })),
            }
          : undefined,
      },
    });
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const workspaceId = await this.workspaceId(userId);
    const customer = await this.prisma.customer.findFirst({
      where: { id, workspaceId },
      include: { _count: { select: { projects: true } } },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    if (customer._count.projects > 0) {
      throw new BadRequestException('Customer has linked projects');
    }
    return this.prisma.customer.delete({ where: { id } });
  }

  async findByWorkspace(userId: string, id: string) {
    const workspaceId = await this.workspaceId(userId);
    const customer = await this.prisma.customer.findFirst({
      where: { id, workspaceId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }
}
