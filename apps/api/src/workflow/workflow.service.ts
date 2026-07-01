import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async listStages(userId: string) {
    const { workspace } =
      await this.workspacesService.getActiveMembershipOrThrow(userId);
    return this.prisma.workflowStage.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { orderIndex: 'asc' },
    });
  }
}
