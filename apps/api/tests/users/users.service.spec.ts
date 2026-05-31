import { Test } from '@nestjs/testing';
import { PrismaService } from 'nestjs-prisma';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { StorageService } from '@/files/storage.service';
import { UsersService } from '@/users/users.service';

type MockPrisma = {
  user: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
  refreshToken: { updateMany: jest.Mock };
};

type MockCloudinary = {
  signUpload: jest.Mock;
  destroyMany: jest.Mock;
};

const baseUser = {
  id: 'u1',
  username: 'kha',
  email: null as string | null,
  passwordHash: 'hash',
  role: Role.USER,
  avatarUrl: null,
  avatarPublicId: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrisma;
  let cloudinary: MockCloudinary;

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      refreshToken: { updateMany: jest.fn() },
    };
    cloudinary = {
      signUpload: jest.fn(),
      destroyMany: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: cloudinary },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('list', () => {
    it('returns items + total với pagination + role filter', async () => {
      prisma.user.findMany.mockResolvedValue([baseUser]);
      prisma.user.count.mockResolvedValue(42);

      const res = await service.list({ page: 2, limit: 10, role: Role.ADMIN });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: Role.ADMIN },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
      expect(res.total).toBe(42);
      expect(res.page).toBe(2);
    });

    it('không filter nếu không có role', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);
      await service.list({ page: 1, limit: 20 });
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  describe('findById', () => {
    it('returns user nếu found', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const res = await service.findById('u1');
      expect(res.id).toBe('u1');
    });

    it('throws USER_NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('admin updates any user', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({ ...baseUser, email: 'new@e.com' });
      const res = await service.update(
        'u1',
        { sub: 'admin-id', role: Role.ADMIN },
        { email: 'new@e.com' },
      );
      expect(res.email).toBe('new@e.com');
    });

    it('self updates self', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(baseUser);
      await service.update(
        'u1',
        { sub: 'u1', role: Role.USER },
        { avatarUrl: 'https://x.com/a.jpg' },
      );
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('throws FORBIDDEN nếu non-admin update other', async () => {
      await expect(
        service.update('u1', { sub: 'other', role: Role.USER }, { email: 'x@e.com' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws EMAIL_TAKEN nếu email collision', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, id: 'other', email: 'taken@e.com' });
      await expect(
        service.update('u1', { sub: 'u1', role: Role.USER }, { email: 'taken@e.com' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('ban', () => {
    it('throws BAN_SELF', async () => {
      await expect(service.ban('admin-id', 'admin-id')).rejects.toThrow(ForbiddenException);
    });

    it('throws BAN_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, role: Role.ADMIN });
      await expect(service.ban('u1', 'admin-id')).rejects.toThrow(ForbiddenException);
    });

    it('success: revoke refresh tokens + set BANNED', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      prisma.user.update.mockResolvedValue({ ...baseUser, role: Role.BANNED });

      const res = await service.ban('u1', 'admin-id');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(res.role).toBe(Role.BANNED);
    });
  });

  describe('avatar (FR-11.7)', () => {
    describe('getAvatarSignParams', () => {
      it('delegates CloudinaryService.signUpload với folder=avatars + publicId=<userId>-<ts>', () => {
        const signed = {
          signature: 'sig123',
          timestamp: 1234567890,
          apiKey: 'k',
          cloudName: 'c',
          folder: 'avatars',
          resourceType: 'image' as const,
          publicId: 'u1-1234567890',
        };
        cloudinary.signUpload.mockReturnValue(signed);
        const res = service.getAvatarSignParams('u1');
        expect(cloudinary.signUpload).toHaveBeenCalledWith({
          folder: 'avatars',
          publicId: expect.stringMatching(/^u1-\d+$/),
          resourceType: 'image',
        });
        expect(res).toBe(signed);
      });
    });

    describe('setAvatar', () => {
      it('throws INVALID_AVATAR_PUBLIC_ID nếu publicId không bắt đầu bằng avatars/<userId>-', async () => {
        await expect(
          service.setAvatar('u1', 'https://res.cloudinary.com/x.jpg', 'avatars/u2-123'),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.setAvatar('u1', 'https://res.cloudinary.com/x.jpg', 'posts/u1-123'),
        ).rejects.toThrow(BadRequestException);
      });

      it('cleanup avatarPublicId cũ via Cloudinary destroy trước khi update', async () => {
        prisma.user.findUnique.mockResolvedValue({ ...baseUser, avatarPublicId: 'avatars/u1-old' });
        prisma.user.update.mockResolvedValue({
          ...baseUser,
          avatarUrl: 'https://res.cloudinary.com/new.jpg',
          avatarPublicId: 'avatars/u1-new',
        });
        await service.setAvatar('u1', 'https://res.cloudinary.com/new.jpg', 'avatars/u1-new');
        expect(cloudinary.destroyMany).toHaveBeenCalledWith([
          { publicId: 'avatars/u1-old', resourceType: 'image' },
        ]);
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'u1' },
          data: {
            avatarUrl: 'https://res.cloudinary.com/new.jpg',
            avatarPublicId: 'avatars/u1-new',
          },
        });
      });

      it('skip Cloudinary destroy nếu user chưa có avatarPublicId (first upload)', async () => {
        prisma.user.findUnique.mockResolvedValue({ ...baseUser, avatarPublicId: null });
        prisma.user.update.mockResolvedValue(baseUser);
        await service.setAvatar('u1', 'https://res.cloudinary.com/new.jpg', 'avatars/u1-new');
        expect(cloudinary.destroyMany).not.toHaveBeenCalled();
      });
    });

    describe('removeAvatar', () => {
      it('cleanup Cloudinary publicId + set 2 field null', async () => {
        prisma.user.findUnique.mockResolvedValue({ ...baseUser, avatarPublicId: 'avatars/u1-x' });
        prisma.user.update.mockResolvedValue({
          ...baseUser,
          avatarUrl: null,
          avatarPublicId: null,
        });
        await service.removeAvatar('u1');
        expect(cloudinary.destroyMany).toHaveBeenCalledWith([
          { publicId: 'avatars/u1-x', resourceType: 'image' },
        ]);
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'u1' },
          data: { avatarUrl: null, avatarPublicId: null },
        });
      });

      it('idempotent — nếu user chưa có avatar, vẫn return user (no Cloudinary call)', async () => {
        prisma.user.findUnique.mockResolvedValue(baseUser);
        prisma.user.update.mockResolvedValue(baseUser);
        await service.removeAvatar('u1');
        expect(cloudinary.destroyMany).not.toHaveBeenCalled();
        expect(prisma.user.update).toHaveBeenCalled();
      });
    });
  });

  describe('unban', () => {
    it('throws NOT_BANNED nếu role không phải BANNED', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await expect(service.unban('u1', 'admin-id')).rejects.toThrow(ForbiddenException);
    });

    it('success: set role USER', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, role: Role.BANNED });
      prisma.user.update.mockResolvedValue({ ...baseUser, role: Role.USER });
      const res = await service.unban('u1', 'admin-id');
      expect(res.role).toBe(Role.USER);
    });
  });
});
