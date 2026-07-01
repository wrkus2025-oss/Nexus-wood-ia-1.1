import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@Req() req: { user: { userId: string } }) {
    return this.projectsService.findMine(req.user.userId);
  }

  @Post()
  create(@Req() req: { user: { userId: string } }, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.userId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @Body('status') status: ProjectStatus,
  ) {
    return this.projectsService.updateStatus(id, req.user.userId, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { userId: string } }) {
    return this.projectsService.remove(id, req.user.userId);
  }
}
