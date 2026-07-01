import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateHardwareDto } from './dto/create-hardware.dto';
import { UpdateHardwareDto } from './dto/update-hardware.dto';
import { HardwareService } from './hardware.service';

@Controller('hardware')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HardwareController {
  constructor(private readonly hardwareService: HardwareService) {}

  @Get()
  list() {
    return this.hardwareService.list();
  }

  @Post()
  @Roles(Role.ADMIN, Role.DESIGNER)
  create(@Body() dto: CreateHardwareDto) {
    return this.hardwareService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DESIGNER)
  update(@Param('id') id: string, @Body() dto: UpdateHardwareDto) {
    return this.hardwareService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.hardwareService.remove(id);
  }
}
