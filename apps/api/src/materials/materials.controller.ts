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
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialsService } from './materials.service';

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get('categories')
  listCategories(@Req() req: { user: JwtUser }) {
    return this.materialsService.listCategories(req.user.userId);
  }

  @Get()
  list(@Req() req: { user: JwtUser }) {
    return this.materialsService.list(req.user.userId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DESIGNER)
  create(@Req() req: { user: JwtUser }, @Body() dto: CreateMaterialDto) {
    return this.materialsService.create(req.user.userId, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DESIGNER)
  update(@Req() req: { user: JwtUser }, @Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.materialsService.remove(req.user.userId, id);
  }
}
