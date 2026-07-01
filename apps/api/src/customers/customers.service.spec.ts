/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { BadRequestException } from '@nestjs/common';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  it('blocks deleting customers with linked projects', async () => {
    const prisma = {
      customer: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'cust-1', _count: { projects: 1 } }),
      },
    } as any;
    const workspacesService = {
      getActiveMembershipOrThrow: jest
        .fn()
        .mockResolvedValue({ workspace: { id: 'ws-1' } }),
    } as any;
    const service = new CustomersService(prisma, workspacesService);

    await expect(service.remove('user-1', 'cust-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
