import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FilesController],
  providers: [CloudinaryService, FilesService],
  exports: [CloudinaryService],
})
export class FilesModule {}
