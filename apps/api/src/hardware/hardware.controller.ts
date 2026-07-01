import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtUser } from '../auth/auth-user';
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

  @Get('categories')
  listCategories(@Req() req: { user: JwtUser }) {
    return this.hardwareService.listCategories(req.user.userId);
  }

  @Get()
  list(@Req() req: { user: JwtUser }) {
    return this.hardwareService.list(req.user.userId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DESIGNER)
  create(@Req() req: { user: JwtUser }, @Body() dto: CreateHardwareDto) {
    return this.hardwareService.create(req.user.userId, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DESIGNER)
  update(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpdateHardwareDto,
  ) {
    return this.hardwareService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.hardwareService.remove(req.user.userId, id);
  }
}
