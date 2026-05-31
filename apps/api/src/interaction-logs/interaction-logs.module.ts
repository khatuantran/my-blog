import { Module } from '@nestjs/common';
import { InteractionLogsController } from './interaction-logs.controller';
import { InteractionLogService } from './interaction-logs.service';

// FR-18: trace log module — capture service (export) + admin list endpoint.
@Module({
  controllers: [InteractionLogsController],
  providers: [InteractionLogService],
  exports: [InteractionLogService],
})
export class InteractionLogsModule {}
