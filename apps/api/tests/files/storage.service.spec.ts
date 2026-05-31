import { ConfigService } from '@nestjs/config';
import { StorageService } from '@/files/storage.service';
import { CloudinaryService } from '@/files/cloudinary.service';
import { LocalStorageService } from '@/files/local-storage.service';
import type { Env } from '@/config/env.schema';

function makeStorage(driver: 'cloudinary' | 'local') {
  const config = { get: () => driver } as unknown as ConfigService<Env, true>;
  const cloudinary = {
    provider: 'cloudinary',
    signUpload: jest.fn().mockReturnValue({ provider: 'cloudinary' }),
    destroyMany: jest.fn().mockResolvedValue(undefined),
    saveUpload: jest.fn(),
  } as unknown as CloudinaryService;
  const local = {
    provider: 'local',
    signUpload: jest.fn().mockReturnValue({ provider: 'local' }),
    destroyMany: jest.fn().mockResolvedValue(undefined),
    saveUpload: jest.fn(),
  } as unknown as LocalStorageService;
  return { svc: new StorageService(config, cloudinary, local), cloudinary, local };
}

describe('StorageService (ADR-010 driver selection)', () => {
  it('STORAGE_DRIVER=cloudinary → delegate cloudinary driver', () => {
    const { svc, cloudinary, local } = makeStorage('cloudinary');
    expect(svc.provider).toBe('cloudinary');
    svc.signUpload({ resourceType: 'image' });
    expect(cloudinary.signUpload).toHaveBeenCalled();
    expect(local.signUpload).not.toHaveBeenCalled();
  });

  it('STORAGE_DRIVER=local → delegate local driver', () => {
    const { svc, cloudinary, local } = makeStorage('local');
    expect(svc.provider).toBe('local');
    svc.signUpload({ resourceType: 'image' });
    expect(local.signUpload).toHaveBeenCalled();
    expect(cloudinary.signUpload).not.toHaveBeenCalled();
  });
});
