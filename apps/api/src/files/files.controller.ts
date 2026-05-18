import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { SignedUploadParams } from './cloudinary.service';
import { SignUploadDto } from './dto/sign-upload.dto';
import { SignedUploadParamsDto } from './dto/sign-upload-response.dto';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue Cloudinary signed upload params (admin only)' })
  @ApiResponse({ status: 200, type: SignedUploadParamsDto })
  signUpload(@Body() dto: SignUploadDto): SignedUploadParams {
    return this.files.signUpload(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete file (admin only) — DB record + revoke Cloudinary asset' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    await this.files.remove(id);
  }
}
