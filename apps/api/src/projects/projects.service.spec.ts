/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { PartType } from '@prisma/client';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  it('records history and audit when updating project stage', async () => {
    const prisma = {
      project: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'proj-1',
          workspaceId: 'ws-1',
          status: 'DRAFT',
        }),
        update: jest
          .fn()
          .mockResolvedValue({ id: 'proj-1', status: 'APPROVED' }),
      },
      workflowStage: {
        findFirst: jest.fn().mockResolvedValue({ id: 'stage-approved' }),
      },
      projectStageHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
      },
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    } as any;
    const workspacesService = {
      getActiveMembershipOrThrow: jest
        .fn()
        .mockResolvedValue({ workspace: { id: 'ws-1' } }),
    } as any;
    const customersService = {} as any;
    const service = new ProjectsService(
      prisma,
      workspacesService,
      customersService,
    );

    await service.updateStage('user-1', 'proj-1', {
      status: 'APPROVED',
      note: 'Aprovado',
    });

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: { status: 'APPROVED' },
    });
    expect(prisma.projectStageHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APPROVED',
          stageId: 'stage-approved',
          note: 'Aprovado',
        }),
      }),
    );
    expect(prisma.auditEvent.create).toHaveBeenCalled();
  });

  it('creates part hardware items inside the active workspace', async () => {
    const prisma = {
      unitModule: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'module-1',
          unit: { space: { project: { id: 'proj-1' } } },
        }),
      },
      material: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'mat-1', workspaceId: 'ws-1' }),
      },
      hardware: {
        count: jest.fn().mockResolvedValue(1),
      },
      part: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({
          id: 'part-1',
          material: null,
          hardwareItems: [],
        }),
      },
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: 'audit-2' }),
      },
    } as any;
    const workspacesService = {
      getActiveMembershipOrThrow: jest
        .fn()
        .mockResolvedValue({ workspace: { id: 'ws-1' } }),
    } as any;
    const customersService = {} as any;
    const service = new ProjectsService(
      prisma,
      workspacesService,
      customersService,
    );

    await service.createPart('user-1', 'module-1', {
      name: 'Lateral',
      type: PartType.PANEL,
      materialId: 'mat-1',
      widthMm: 600,
      heightMm: 720,
      thicknessMm: 18,
      hardwareItems: [{ hardwareId: 'hw-1', quantity: 2 }],
    });

    expect(prisma.part.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          materialId: 'mat-1',
          hardwareItems: {
            create: [{ hardwareId: 'hw-1', quantity: 2, notes: undefined }],
          },
        }),
      }),
    );
  });
});
