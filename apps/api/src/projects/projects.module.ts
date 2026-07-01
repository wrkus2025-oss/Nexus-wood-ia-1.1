import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [WorkspacesModule, CustomersModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
