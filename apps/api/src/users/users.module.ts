import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [FilesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
