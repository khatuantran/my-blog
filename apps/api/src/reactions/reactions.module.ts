import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

@Module({
  imports: [ActivityModule],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
