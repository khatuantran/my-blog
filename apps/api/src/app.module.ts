import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from 'nestjs-prisma';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivityModule } from './activity/activity.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReactionsModule } from './reactions/reactions.module';
import { PostsModule } from './posts/posts.module';
import { SavedModule } from './saved/saved.module';
import { SearchModule } from './search/search.module';
import { TagsModule } from './tags/tags.module';
import { UsersModule } from './users/users.module';
import { AnonymousIdMiddleware } from './common/middleware/anonymous-id.middleware';
import { validateEnv } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', limit: 100, ttl: 60_000 }],
      // Skip throttle khi `THROTTLE_DISABLED=1` (set trong .env.test). Cho phép throttle.e2e-spec
      // opt-in bằng cách xoá env var trước khi bootstrap app.
      skipIf: () => process.env.THROTTLE_DISABLED === '1',
    }),
    AuthModule,
    ActivityModule,
    NotificationsModule,
    UsersModule,
    FilesModule,
    TagsModule,
    PostsModule,
    ReactionsModule,
    CommentsModule,
    SavedModule,
    SearchModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AnonymousIdMiddleware).forRoutes('*');
  }
}
