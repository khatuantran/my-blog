import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CloudinaryService, SignedUploadParams } from './cloudinary.service';
import type { SignUploadDto } from './dto/sign-upload.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  signUpload(dto: SignUploadDto): SignedUploadParams {
    return this.cloudinary.signUpload({
      folder: dto.folder,
      publicId: dto.publicId,
      resourceType: dto.resourceType,
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
    // Best-effort cloudinary cleanup after DB delete
    await this.cloudinary.destroyMany([{ publicId: file.publicId, resourceType: 'raw' }]);
    this.logger.log(`File ${id} (publicId=${file.publicId}) deleted`);
  }
}
