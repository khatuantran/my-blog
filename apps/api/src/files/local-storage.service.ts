import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep, extname } from 'node:path';
import type { Env } from '../config/env.schema';
import type {
  SaveUploadInput,
  SignedUploadParams,
  StorageAsset,
  StorageDriver,
  StorageResourceType,
  UploadedAsset,
} from './storage.types';

// LocalStorageService (ADR-010) — driver lưu file vào volume local (dev), serve qua
// app.useStaticAssets('/uploads'). publicId = relative path (kèm extension) dưới STORAGE_LOCAL_PATH.
@Injectable()
export class LocalStorageService implements StorageDriver {
  readonly provider = 'local' as const;
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly basePath: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService<Env, true>) {
    this.basePath = resolve(config.get('STORAGE_LOCAL_PATH', { infer: true }));
    this.publicUrl = config.get('STORAGE_PUBLIC_URL', { infer: true }).replace(/\/$/, '');
  }

  // local: FE upload multipart lên BE (POST /files/upload) thay vì direct upload.
  signUpload(opts: {
    folder?: string;
    publicId?: string;
    resourceType: StorageResourceType;
  }): SignedUploadParams {
    return {
      provider: 'local',
      signature: '',
      timestamp: 0,
      apiKey: '',
      cloudName: '',
      folder: opts.folder ?? 'myblog',
      resourceType: opts.resourceType,
      publicId: opts.publicId ?? null,
      uploadUrl: '/files/upload',
    };
  }

  async saveUpload(input: SaveUploadInput): Promise<UploadedAsset> {
    const folder = this.sanitizeSegment(input.folder || 'myblog');
    let relative: string;
    if (input.publicId) {
      // publicId chỉ định (vd avatar `${userId}-ts`) — giữ nguyên + folder prefix + ext từ file.
      const ext = extname(input.originalName) || this.extFromMime(input.mimetype);
      relative = `${folder}/${this.sanitizeSegment(input.publicId)}${ext}`;
    } else {
      const ext = extname(input.originalName) || this.extFromMime(input.mimetype);
      const safe = this.sanitizeSegment(input.originalName.replace(ext, '')).slice(0, 40) || 'file';
      const rand = Math.random().toString(36).slice(2, 8);
      relative = `${folder}/${Date.now()}-${rand}-${safe}${ext}`;
    }

    const absPath = resolve(this.basePath, relative);
    // Chống path traversal: file phải nằm trong basePath.
    if (absPath !== this.basePath && !absPath.startsWith(this.basePath + sep)) {
      throw new BadRequestException({
        code: 'INVALID_PATH',
        message: 'Đường dẫn file không hợp lệ',
      });
    }

    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, input.buffer);

    return {
      url: `${this.publicUrl}/uploads/${relative}`,
      publicId: relative,
      size: input.size,
      name: input.originalName,
      type: input.mimetype,
    };
  }

  async destroyMany(assets: StorageAsset[]): Promise<void> {
    await Promise.all(
      assets.map(async (a) => {
        try {
          const absPath = resolve(this.basePath, a.publicId);
          if (absPath !== this.basePath && !absPath.startsWith(this.basePath + sep)) return;
          await unlink(absPath);
        } catch (err) {
          // Best-effort (file có thể đã xóa / không tồn tại).
          this.logger.warn(
            `Local destroy failed publicId=${a.publicId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }),
    );
  }

  // Loại '..' + ký tự nguy hiểm, giữ cấu trúc folder (cho phép '/').
  private sanitizeSegment(s: string): string {
    return s
      .replace(/\\/g, '/')
      .split('/')
      .filter((p) => p && p !== '.' && p !== '..')
      .map((p) => p.replace(/[^a-zA-Z0-9._-]/g, '_'))
      .join('/');
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    return map[mime] ?? '';
  }
}
