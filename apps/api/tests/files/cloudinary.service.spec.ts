import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from '@/files/cloudinary.service';

const mockApiSignRequest = jest.fn();
const mockDestroy = jest.fn();
const mockConfig = jest.fn();

jest.mock('cloudinary', () => ({
  v2: {
    config: (...args: unknown[]) => mockConfig(...args),
    utils: {
      api_sign_request: (...args: unknown[]) => mockApiSignRequest(...args),
    },
    uploader: {
      destroy: (...args: unknown[]) => mockDestroy(...args),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let envValues: Record<string, string>;
  let config: { get: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    envValues = {
      CLOUDINARY_CLOUD_NAME: 'demo',
      CLOUDINARY_API_KEY: 'key-123',
      CLOUDINARY_API_SECRET: 'secret-xyz',
    };
    config = {
      get: jest.fn((k: keyof typeof envValues) => envValues[k]),
    };
    mockApiSignRequest.mockReturnValue('sig-abc');

    const moduleRef = await Test.createTestingModule({
      providers: [CloudinaryService, { provide: ConfigService, useValue: config }],
    }).compile();
    service = moduleRef.get(CloudinaryService);
  });

  describe('constructor', () => {
    it('configures cloudinary SDK with credentials from env', () => {
      expect(mockConfig).toHaveBeenCalledWith({
        cloud_name: 'demo',
        api_key: 'key-123',
        api_secret: 'secret-xyz',
        secure: true,
      });
    });
  });

  describe('signUpload', () => {
    it('returns signed params with default folder=myblog', () => {
      const out = service.signUpload({ resourceType: 'image' });
      expect(out.signature).toBe('sig-abc');
      expect(out.folder).toBe('myblog');
      expect(out.resourceType).toBe('image');
      expect(out.apiKey).toBe('key-123');
      expect(out.cloudName).toBe('demo');
      expect(out.publicId).toBeNull();
      expect(typeof out.timestamp).toBe('number');
      expect(mockApiSignRequest).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'myblog', timestamp: out.timestamp }),
        'secret-xyz',
      );
    });

    it('respects custom folder + publicId', () => {
      const out = service.signUpload({
        resourceType: 'raw',
        folder: 'docs',
        publicId: 'manual-id',
      });
      expect(out.folder).toBe('docs');
      expect(out.publicId).toBe('manual-id');
      expect(mockApiSignRequest).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'docs', public_id: 'manual-id' }),
        'secret-xyz',
      );
    });

    it('throws when Cloudinary creds missing (validate đủ cloud_name/api_key/api_secret)', () => {
      // ADR-010: signUpload validate đủ 3 creds (tránh FE build URL malformed khi thiếu key/cloudName).
      envValues.CLOUDINARY_API_SECRET = '';
      expect(() => service.signUpload({ resourceType: 'image' })).toThrow(
        /Cloudinary chưa cấu hình đủ/,
      );
    });

    it('throws khi thiếu API_KEY / CLOUD_NAME dù có secret (ADR-010 strengthen)', () => {
      envValues.CLOUDINARY_API_KEY = '';
      expect(() => service.signUpload({ resourceType: 'image' })).toThrow(
        /Cloudinary chưa cấu hình đủ/,
      );
    });
  });

  describe('destroyMany', () => {
    it('no-op when asset list empty', async () => {
      await service.destroyMany([]);
      expect(mockDestroy).not.toHaveBeenCalled();
    });

    it('skip when api secret missing + log warning', async () => {
      envValues.CLOUDINARY_API_SECRET = '';
      await service.destroyMany([{ publicId: 'p1', resourceType: 'image' }]);
      expect(mockDestroy).not.toHaveBeenCalled();
    });

    it('calls cloudinary destroy for each asset with resource_type', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' });
      await service.destroyMany([
        { publicId: 'p1', resourceType: 'image' },
        { publicId: 'p2', resourceType: 'raw' },
      ]);
      expect(mockDestroy).toHaveBeenCalledTimes(2);
      expect(mockDestroy).toHaveBeenCalledWith('p1', { resource_type: 'image' });
      expect(mockDestroy).toHaveBeenCalledWith('p2', { resource_type: 'raw' });
    });

    it('does not throw when individual destroy fails (logs + continues)', async () => {
      mockDestroy
        .mockRejectedValueOnce(new Error('Cloudinary 500'))
        .mockResolvedValueOnce({ result: 'ok' });
      await expect(
        service.destroyMany([
          { publicId: 'bad', resourceType: 'image' },
          { publicId: 'good', resourceType: 'image' },
        ]),
      ).resolves.toBeUndefined();
      expect(mockDestroy).toHaveBeenCalledTimes(2);
    });
  });
});
