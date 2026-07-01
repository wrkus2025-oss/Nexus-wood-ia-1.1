import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { HardwareController } from './hardware.controller';
import { HardwareService } from './hardware.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [HardwareController],
  providers: [HardwareService],
})
export class HardwareModule {}
