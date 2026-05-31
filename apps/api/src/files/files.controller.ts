import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SignUploadDto } from './dto/sign-upload.dto';
import { SignedUploadParamsDto } from './dto/sign-upload-response.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { FilesService } from './files.service';
import type { SignedUploadParams, UploadedAsset } from './storage.types';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue signed upload params (admin only) — cloudinary | local' })
  @ApiResponse({ status: 200, type: SignedUploadParamsDto })
  signUpload(@Body() dto: SignUploadDto): SignedUploadParams {
    return this.files.signUpload(dto);
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file vào local volume (admin only, STORAGE_DRIVER=local)' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadFileDto,
  ): Promise<UploadedAsset> {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'Thiếu file upload' });
    }
    // Defense-in-depth: resourceType=image phải là MIME ảnh (chống upload payload tùy ý
    // dù static serve không execute). raw cho phép các loại doc.
    if (dto.resourceType === 'image' && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException({
        code: 'INVALID_MIME',
        message: 'resourceType=image yêu cầu file ảnh (image/*)',
      });
    }
    return this.files.upload(file, {
      folder: dto.folder,
      resourceType: dto.resourceType,
      publicId: dto.publicId,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete file (admin only) — DB record + revoke storage asset' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    await this.files.remove(id);
  }
}
