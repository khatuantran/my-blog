import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { FilesModule } from '../files/files.module';
import { TagsModule } from '../tags/tags.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [FilesModule, TagsModule, ActivityModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
