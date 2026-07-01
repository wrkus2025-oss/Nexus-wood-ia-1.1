/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { AiService } from './ai.service';

describe('AiService', () => {
  it('parses compact dimensions from prompt', () => {
    const service = new AiService({} as any, {} as any);
    const parsed = service['parsePrompt'](
      'Kitchen cabinet 2400x2200x600 with 4 doors and 3 drawers',
    );

    expect(parsed).toBeDefined();
    expect(parsed?.widthMm).toBe(2400);
    expect(parsed?.heightMm).toBe(2200);
    expect(parsed?.depthMm).toBe(600);
    expect(parsed?.doorCount).toBe(4);
    expect(parsed?.drawerCount).toBe(3);
  });

  it('returns complete professional project payload', async () => {
    const prisma = {
      aiHistory: { create: jest.fn().mockResolvedValue({ id: 'history-1' }) },
      customer: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'customer-1' }),
      },
      hardware: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'hw-hinge', name: 'Dobradiça', unitCost: 20 })
          .mockResolvedValueOnce({ id: 'hw-slide', name: 'Corrediça', unitCost: 50 })
          .mockResolvedValueOnce({ id: 'hw-handle', name: 'Puxador', unitCost: 10 }),
      },
      material: {
        findFirst: jest.fn().mockResolvedValue({ id: 'mat-1' }),
      },
      $transaction: jest.fn(),
    } as any;

    const transaction = {
      project: {
        create: jest.fn().mockResolvedValue({ id: 'project-1', name: 'Cozinha gerado por IA' }),
      },
      projectSpace: { create: jest.fn().mockResolvedValue({ id: 'space-1' }) },
      projectUnit: { create: jest.fn().mockResolvedValue({ id: 'unit-1' }) },
      unitModule: { create: jest.fn().mockResolvedValue({ id: 'module-1' }) },
      part: {
        create: jest.fn().mockImplementation(async ({ data }) => ({ id: `part-${data.code}` })),
      },
      partHardware: { create: jest.fn().mockResolvedValue({ id: 'ph-1' }) },
      projectNote: { create: jest.fn().mockResolvedValue({ id: 'note-1' }) },
      productionTask: { create: jest.fn().mockResolvedValue({ id: 'task-1' }) },
    } as any;

    prisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
      callback(transaction),
    );

    const workspacesService = {
      getActiveMembershipOrThrow: jest
        .fn()
        .mockResolvedValue({ workspace: { id: 'ws-1' } }),
    } as any;

    const service = new AiService(prisma, workspacesService);

    const response = await service.ask(
      'user-1',
      'Kitchen cabinet 2400x2200x600 with 4 doors and 3 drawers',
    );

    expect(response.kind).toBe('PROJECT');
    if (response.kind !== 'PROJECT') {
      return;
    }

    expect(response.cutList.length).toBeGreaterThan(0);
    expect(response.hardwareList.length).toBeGreaterThan(0);
    expect(response.engineeringReport.hingeQuantityPerDoor).toBeGreaterThan(1);
    expect(response.budget.edgeBandingCost).toBeGreaterThan(0);
    expect(response.recommendedMaterials.carcass).toContain('MDF');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.aiHistory.create).toHaveBeenCalled();
  });
});
