import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  list(@Req() req: { user: JwtUser }) {
    return this.workspacesService.listForUser(req.user.userId);
  }

  @Get('current')
  current(@Req() req: { user: JwtUser }) {
    return this.workspacesService.getCurrent(req.user.userId);
  }

  @Post()
  create(@Req() req: { user: JwtUser }, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(req.user.userId, id, dto);
  }

  @Get(':id/members')
  members(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.workspacesService.listMembers(req.user.userId, id);
  }

  @Post(':id/members')
  addMember(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    return this.workspacesService.addMember(req.user.userId, id, dto);
  }

  @Patch(':id/members/:memberId')
  updateMember(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspacesService.updateMember(
      req.user.userId,
      id,
      memberId,
      dto,
    );
  }
}
