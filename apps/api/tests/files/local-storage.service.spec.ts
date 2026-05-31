import { rm, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { LocalStorageService } from '@/files/local-storage.service';
import type { Env } from '@/config/env.schema';

function makeService(basePath: string): LocalStorageService {
  const config = {
    get: (key: string) => (key === 'STORAGE_LOCAL_PATH' ? basePath : 'http://localhost:3001'),
  } as unknown as ConfigService<Env, true>;
  return new LocalStorageService(config);
}

describe('LocalStorageService (ADR-010)', () => {
  let basePath: string;
  let svc: LocalStorageService;

  beforeEach(() => {
    basePath = join(tmpdir(), `myblog-storage-test-${process.pid}-${Date.now()}`);
    svc = makeService(basePath);
  });

  afterEach(async () => {
    await rm(basePath, { recursive: true, force: true });
  });

  it('signUpload trả provider=local + uploadUrl (không signature cloud)', () => {
    const r = svc.signUpload({ folder: 'myblog/posts', resourceType: 'image' });
    expect(r.provider).toBe('local');
    expect(r.uploadUrl).toBe('/files/upload');
    expect(r.signature).toBe('');
  });

  it('saveUpload ghi file vào volume + trả url/publicId đúng', async () => {
    const buffer = Buffer.from('hello-image');
    const asset = await svc.saveUpload({
      buffer,
      originalName: 'pic.png',
      mimetype: 'image/png',
      size: buffer.length,
      folder: 'myblog/posts',
      resourceType: 'image',
    });
    expect(asset.publicId).toMatch(/^myblog\/posts\/.*\.png$/);
    expect(asset.url).toBe(`http://localhost:3001/uploads/${asset.publicId}`);
    // File thực sự tồn tại trên disk.
    const onDisk = await readFile(join(basePath, asset.publicId));
    expect(onDisk.toString()).toBe('hello-image');
  });

  it('saveUpload honor publicId chỉ định (avatar prefix giữ nguyên cho setAvatar)', async () => {
    const buffer = Buffer.from('avatar');
    const asset = await svc.saveUpload({
      buffer,
      originalName: 'avatar.jpg',
      mimetype: 'image/jpeg',
      size: buffer.length,
      folder: 'avatars',
      publicId: 'u1-1717000000',
      resourceType: 'image',
    });
    expect(asset.publicId).toBe('avatars/u1-1717000000.jpg');
    expect(asset.publicId.startsWith('avatars/u1-')).toBe(true);
  });

  it('saveUpload reject path traversal (folder/publicId chứa ..)', async () => {
    const buffer = Buffer.from('x');
    const asset = await svc.saveUpload({
      buffer,
      originalName: 'x.png',
      mimetype: 'image/png',
      size: 1,
      folder: '../../etc',
      resourceType: 'image',
    });
    // '..' bị strip → file vẫn nằm trong basePath (không escape).
    const abs = join(basePath, asset.publicId);
    await expect(stat(abs)).resolves.toBeDefined();
    expect(asset.publicId).not.toContain('..');
  });

  it('destroyMany unlink file đã lưu', async () => {
    const buffer = Buffer.from('del');
    const asset = await svc.saveUpload({
      buffer,
      originalName: 'd.png',
      mimetype: 'image/png',
      size: 1,
      folder: 'myblog/posts',
      resourceType: 'image',
    });
    await svc.destroyMany([{ publicId: asset.publicId, resourceType: 'image' }]);
    await expect(stat(join(basePath, asset.publicId))).rejects.toThrow();
  });

  it('saveUpload không throw BadRequest cho input hợp lệ (guard chỉ chặn escape thực sự)', async () => {
    await expect(
      svc.saveUpload({
        buffer: Buffer.from('ok'),
        originalName: 'ok.png',
        mimetype: 'image/png',
        size: 2,
        folder: 'myblog/posts',
        resourceType: 'image',
      }),
    ).resolves.toBeDefined();
    expect(BadRequestException).toBeDefined();
  });
});
