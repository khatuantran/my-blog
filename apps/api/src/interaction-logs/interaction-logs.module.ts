import { Module } from '@nestjs/common';
import { InteractionLogService } from './interaction-logs.service';

// FR-18: trace log module. Controller (admin API) thêm ở T-464.
@Module({
  providers: [InteractionLogService],
  exports: [InteractionLogService],
})
export class InteractionLogsModule {}
