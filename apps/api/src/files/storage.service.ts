import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { CloudinaryService } from './cloudinary.service';
import { LocalStorageService } from './local-storage.service';
import type {
  SaveUploadInput,
  SignedUploadParams,
  StorageAsset,
  StorageDriver,
  StorageResourceType,
  UploadedAsset,
} from './storage.types';

// StorageService (ADR-010) — facade chọn driver theo env STORAGE_DRIVER. Inject thay
// CloudinaryService ở files/posts/users để upload local hoạt động (avatar sign, cleanup...).
@Injectable()
export class StorageService implements StorageDriver {
  private readonly active: StorageDriver;

  constructor(
    config: ConfigService<Env, true>,
    cloudinary: CloudinaryService,
    local: LocalStorageService,
  ) {
    this.active = config.get('STORAGE_DRIVER', { infer: true }) === 'local' ? local : cloudinary;
  }

  get provider() {
    return this.active.provider;
  }

  signUpload(opts: {
    folder?: string;
    publicId?: string;
    resourceType: StorageResourceType;
  }): SignedUploadParams {
    return this.active.signUpload(opts);
  }

  destroyMany(assets: StorageAsset[]): Promise<void> {
    return this.active.destroyMany(assets);
  }

  saveUpload(input: SaveUploadInput): Promise<UploadedAsset> {
    return this.active.saveUpload(input);
  }
}
