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
import { JwtUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { CreatePartDto } from './dto/create-part.dto';
import { CreateProductionTaskDto } from './dto/create-production-task.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectNoteDto } from './dto/create-project-note.dto';
import { CreateProjectSpaceDto } from './dto/create-project-space.dto';
import { CreateProjectUnitDto } from './dto/create-project-unit.dto';
import { CreateUnitModuleDto } from './dto/create-unit-module.dto';
import { UpdateProductionTaskDto } from './dto/update-production-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectSpaceDto } from './dto/update-project-space.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { UpdateProjectUnitDto } from './dto/update-project-unit.dto';
import { ProjectsService } from './projects.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('projects')
  list(@Req() req: { user: JwtUser }) {
    return this.projectsService.findAll(req.user.userId);
  }

  @Post('projects')
  create(@Req() req: { user: JwtUser }, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.userId, dto);
  }

  @Get('projects/:id')
  get(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.projectsService.findOne(req.user.userId, id);
  }

  @Patch('projects/:id')
  update(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.userId, id, dto);
  }

  @Patch('projects/:id/status')
  updateStatus(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpdateProjectStageDto,
  ) {
    return this.projectsService.updateStage(req.user.userId, id, dto);
  }

  @Patch('projects/:id/stage')
  updateStage(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpdateProjectStageDto,
  ) {
    return this.projectsService.updateStage(req.user.userId, id, dto);
  }

  @Delete('projects/:id')
  remove(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.projectsService.remove(req.user.userId, id);
  }

  @Post('projects/:id/spaces')
  createSpace(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: CreateProjectSpaceDto,
  ) {
    return this.projectsService.createSpace(req.user.userId, id, dto);
  }

  @Patch('projects/:id/spaces/:spaceId')
  updateSpace(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Param('spaceId') spaceId: string,
    @Body() dto: UpdateProjectSpaceDto,
  ) {
    return this.projectsService.updateSpace(req.user.userId, id, spaceId, dto);
  }

  @Delete('projects/:id/spaces/:spaceId')
  deleteSpace(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Param('spaceId') spaceId: string,
  ) {
    return this.projectsService.deleteSpace(req.user.userId, id, spaceId);
  }

  @Get('projects/:id/units')
  units(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.projectsService.listUnits(req.user.userId, id);
  }

  @Post('projects/:id/units')
  createUnit(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: CreateProjectUnitDto,
  ) {
    return this.projectsService.createUnit(req.user.userId, id, dto);
  }

  @Patch('projects/:id/units/:unitId')
  updateUnit(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Param('unitId') unitId: string,
    @Body() dto: UpdateProjectUnitDto,
  ) {
    return this.projectsService.updateUnit(req.user.userId, id, unitId, dto);
  }

  @Delete('projects/:id/units/:unitId')
  deleteUnit(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Param('unitId') unitId: string,
  ) {
    return this.projectsService.deleteUnit(req.user.userId, id, unitId);
  }

  @Post('units/:unitId/modules')
  createModule(
    @Req() req: { user: JwtUser },
    @Param('unitId') unitId: string,
    @Body() dto: CreateUnitModuleDto,
  ) {
    return this.projectsService.createModule(req.user.userId, unitId, dto);
  }

  @Post('modules/:moduleId/parts')
  createPart(
    @Req() req: { user: JwtUser },
    @Param('moduleId') moduleId: string,
    @Body() dto: CreatePartDto,
  ) {
    return this.projectsService.createPart(req.user.userId, moduleId, dto);
  }

  @Get('projects/:id/history')
  history(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.projectsService.listHistory(req.user.userId, id);
  }

  @Get('projects/:id/tasks')
  tasks(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.projectsService.listTasks(req.user.userId, id);
  }

  @Post('projects/:id/tasks')
  createTask(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: CreateProductionTaskDto,
  ) {
    return this.projectsService.createTask(req.user.userId, id, dto);
  }

  @Patch('projects/:id/tasks/:taskId')
  updateTask(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateProductionTaskDto,
  ) {
    return this.projectsService.updateTask(req.user.userId, id, taskId, dto);
  }

  @Get('projects/:id/attachments')
  attachments(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.projectsService.listAttachments(req.user.userId, id);
  }

  @Post('projects/:id/attachments')
  addAttachment(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.projectsService.addAttachment(req.user.userId, id, dto);
  }

  @Get('projects/:id/notes')
  notes(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.projectsService.listNotes(req.user.userId, id);
  }

  @Post('projects/:id/notes')
  addNote(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: CreateProjectNoteDto,
  ) {
    return this.projectsService.addNote(req.user.userId, id, dto);
  }

  @Get('projects/:id/activity')
  activity(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.projectsService.activity(req.user.userId, id);
  }
}
