import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { Env } from '../config/env.schema';

export type CloudinaryResourceType = 'image' | 'raw';

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: CloudinaryResourceType;
  publicId: string | null;
}

export interface CloudinaryAsset {
  publicId: string;
  resourceType: CloudinaryResourceType;
}

@Injectable()
export class CloudinaryService {
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
    resourceType: CloudinaryResourceType;
  }): SignedUploadParams {
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET', { infer: true });
    if (!apiSecret) {
      throw new Error('CLOUDINARY_API_SECRET not configured');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = opts.folder ?? 'myblog';
    const paramsToSign: Record<string, string | number> = { timestamp, folder };
    if (opts.publicId) paramsToSign.public_id = opts.publicId;

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      signature,
      timestamp,
      apiKey: this.config.get('CLOUDINARY_API_KEY', { infer: true }),
      cloudName: this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true }),
      folder,
      resourceType: opts.resourceType,
      publicId: opts.publicId ?? null,
    };
  }

  async destroyMany(assets: CloudinaryAsset[]): Promise<void> {
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
