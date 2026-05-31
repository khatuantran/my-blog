import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { LocalStorageService } from './local-storage.service';
import { StorageService } from './storage.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FilesController],
  providers: [CloudinaryService, LocalStorageService, StorageService, FilesService],
  // Export StorageService (driver facade theo STORAGE_DRIVER) cho posts/users module (ADR-010).
  exports: [StorageService],
})
export class FilesModule {}
