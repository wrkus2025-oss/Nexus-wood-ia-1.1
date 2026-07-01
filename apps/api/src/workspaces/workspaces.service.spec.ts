/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Role } from '@prisma/client';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  it('creates an initial workspace and sets it active for the user', async () => {
    const prisma = {
      workspace: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockResolvedValue({ id: 'ws-1', name: 'Demo', slug: 'demo' }),
      },
    } as any;
    const usersService = {
      setActiveWorkspace: jest.fn().mockResolvedValue(undefined),
    } as any;
    const service = new WorkspacesService(prisma, usersService);

    const workspace = await service.createInitialWorkspace(
      'user-1',
      Role.ADMIN,
      'Demo',
    );

    expect(prisma.workspace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Demo',
          members: { create: { userId: 'user-1', role: Role.ADMIN } },
        }),
      }),
    );
    expect(usersService.setActiveWorkspace).toHaveBeenCalledWith(
      'user-1',
      'ws-1',
    );
    expect(workspace.id).toBe('ws-1');
  });
});
