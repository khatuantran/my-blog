import { Module } from '@nestjs/common';
import { CommentsModule } from '../comments/comments.module';
import { PostsModule } from '../posts/posts.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [CommentsModule, PostsModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
