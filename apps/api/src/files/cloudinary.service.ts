import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { Env } from '../config/env.schema';
import type {
  SignedUploadParams,
  StorageAsset,
  StorageDriver,
  StorageResourceType,
  UploadedAsset,
} from './storage.types';

// Back-compat re-exports (consumers cũ import từ đây).
export type { SignedUploadParams } from './storage.types';
export type { StorageAsset as CloudinaryAsset } from './storage.types';
export type { StorageResourceType as CloudinaryResourceType } from './storage.types';

@Injectable()
export class CloudinaryService implements StorageDriver {
  readonly provider = 'cloudinary' as const;
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService<Env, true>) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true }),
      api_key: this.config.get('CLOUDINARY_API_KEY', { infer: true }),
      api_secret: this.config.get('CLOUDINARY_API_SECRET', { infer: true }),
      secure: true,
    });
  }

  signUpload(opts: {
    folder?: string;
    publicId?: string;
    resourceType: StorageResourceType;
  }): SignedUploadParams {
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET', { infer: true });
    const apiKey = this.config.get('CLOUDINARY_API_KEY', { infer: true });
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    // Validate đủ 3 creds (tránh FE build URL cloudinary malformed khi thiếu key/cloudName).
    if (!apiSecret || !apiKey || !cloudName) {
      throw new Error(
        'Cloudinary chưa cấu hình đủ (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET) — set creds hoặc dùng STORAGE_DRIVER=local',
      );
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = opts.folder ?? 'myblog';
    const paramsToSign: Record<string, string | number> = { timestamp, folder };
    if (opts.publicId) paramsToSign.public_id = opts.publicId;

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      provider: 'cloudinary',
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      resourceType: opts.resourceType,
      publicId: opts.publicId ?? null,
    };
  }

  // Cloudinary dùng direct upload (FE → api.cloudinary.com) → không hỗ trợ upload qua BE.
  saveUpload(): Promise<UploadedAsset> {
    throw new BadRequestException({
      code: 'UPLOAD_NOT_SUPPORTED',
      message:
        'POST /files/upload chỉ dùng khi STORAGE_DRIVER=local; cloudinary dùng signed direct upload',
    });
  }

  async destroyMany(assets: StorageAsset[]): Promise<void> {
    if (assets.length === 0) return;
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET', { infer: true });
    if (!apiSecret) {
      this.logger.warn('CLOUDINARY_API_SECRET not set — skip destroyMany');
      return;
    }
    await Promise.all(
      assets.map(async (a) => {
        try {
          await cloudinary.uploader.destroy(a.publicId, { resource_type: a.resourceType });
        } catch (err) {
          this.logger.warn(
            `Cloudinary destroy failed publicId=${a.publicId} type=${a.resourceType}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }),
    );
  }
}
