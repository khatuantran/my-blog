import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { StorageService } from '@/files/storage.service';
import { FilesService } from '@/files/files.service';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: {
    file: { findUnique: jest.Mock; delete: jest.Mock };
  };
  let cloudinary: { signUpload: jest.Mock; destroyMany: jest.Mock };

  beforeEach(async () => {
    prisma = {
      file: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    cloudinary = {
      signUpload: jest.fn(),
      destroyMany: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: cloudinary },
      ],
    }).compile();
    service = moduleRef.get(FilesService);
  });

  describe('signUpload', () => {
    it('delegate to CloudinaryService với đầy đủ tham số', () => {
      cloudinary.signUpload.mockReturnValue({
        signature: 'sig',
        timestamp: 1715952000,
        apiKey: 'k',
        cloudName: 'c',
        folder: 'myblog/posts',
        resourceType: 'image',
        publicId: null,
      });
      const res = service.signUpload({
        resourceType: 'image',
        folder: 'myblog/posts',
      });
      expect(cloudinary.signUpload).toHaveBeenCalledWith({
        folder: 'myblog/posts',
        publicId: undefined,
        resourceType: 'image',
      });
      expect(res.signature).toBe('sig');
    });
  });

  describe('remove', () => {
    it('throws NotFoundException nếu file không tồn tại', async () => {
      prisma.file.findUnique.mockResolvedValue(null);
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
      expect(cloudinary.destroyMany).not.toHaveBeenCalled();
    });

    it('happy: delete DB record + destroy Cloudinary raw asset', async () => {
      prisma.file.findUnique.mockResolvedValue({ id: 'f1', publicId: 'doc-xyz' });
      prisma.file.delete.mockResolvedValue({ id: 'f1' });
      await service.remove('f1');
      expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: 'f1' } });
      expect(cloudinary.destroyMany).toHaveBeenCalledWith([
        { publicId: 'doc-xyz', resourceType: 'raw' },
      ]);
    });
  });
});
