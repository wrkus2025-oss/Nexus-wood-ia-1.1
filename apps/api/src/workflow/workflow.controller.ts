import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkflowService } from './workflow.service';

@Controller('workflow')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('stages')
  stages(@Req() req: { user: JwtUser }) {
    return this.workflowService.listStages(req.user.userId);
  }
}
