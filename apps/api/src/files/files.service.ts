import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { StorageService } from './storage.service';
import type { SignedUploadParams, StorageResourceType, UploadedAsset } from './storage.types';
import type { SignUploadDto } from './dto/sign-upload.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  signUpload(dto: SignUploadDto): SignedUploadParams {
    return this.storage.signUpload({
      folder: dto.folder,
      publicId: dto.publicId,
      resourceType: dto.resourceType,
    });
  }

  // POST /files/upload — chỉ STORAGE_DRIVER=local (ADR-010). Cloudinary driver sẽ throw.
  upload(
    file: Express.Multer.File,
    opts: { folder: string; resourceType: StorageResourceType; publicId?: string },
  ): Promise<UploadedAsset> {
    return this.storage.saveUpload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      folder: opts.folder,
      publicId: opts.publicId,
      resourceType: opts.resourceType,
    });
  }

  async remove(id: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: { id: true, publicId: true },
    });
    if (!file) {
      throw new NotFoundException({ code: 'FILE_NOT_FOUND', message: 'File không tồn tại' });
    }
    await this.prisma.file.delete({ where: { id } });
    // Best-effort cleanup after DB delete (driver-aware: Cloudinary destroy / local unlink).
    await this.storage.destroyMany([{ publicId: file.publicId, resourceType: 'raw' }]);
    this.logger.log(`File ${id} (publicId=${file.publicId}) deleted`);
  }
}
