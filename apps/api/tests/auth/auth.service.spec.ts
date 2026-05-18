import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'nestjs-prisma';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from '@/auth/auth.service';

type MockPrisma = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  refreshToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

const baseUser = {
  id: 'u1',
  username: 'kha',
  email: null as string | null,
  passwordHash: '$2b$04$abcdefghijklmnopqrstuv', // pre-hashed sentinel
  role: Role.USER,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

    const config = {
      get: jest.fn((key: string, dflt?: string) => {
        if (key === 'JWT_ACCESS_TTL') return '15m';
        if (key === 'JWT_REFRESH_TTL') return '30d';
        return dflt;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        throw new Error('unknown ' + key);
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('success creates user + issues tokens', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // username free
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.create.mockResolvedValue({});

      const res = await service.register({ username: 'kha', password: 'password123' });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(res.user.id).toBe('u1');
      expect(res.tokens.accessToken).toBe('signed.jwt.token');
      expect(res.tokens.refreshToken).toBe('signed.jwt.token');
    });

    it('throws USERNAME_TAKEN nếu username đã tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(baseUser);
      await expect(service.register({ username: 'kha', password: 'password123' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws EMAIL_TAKEN nếu email đã tồn tại', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // username free
        .mockResolvedValueOnce({ ...baseUser, email: 'k@e.com' }); // email taken

      await expect(
        service.register({ username: 'kha', password: 'password123', email: 'k@e.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('throws INVALID_CREDENTIALS nếu user không tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ username: 'nope', password: 'x' }, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws USER_BANNED nếu role BANNED', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, role: Role.BANNED });
      await expect(service.login({ username: 'kha', password: 'x' }, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws INVALID_CREDENTIALS nếu password sai', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('correct', 4);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash });
      await expect(service.login({ username: 'kha', password: 'wrong' }, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('success returns user + tokens', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('correct', 4);
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash });
      prisma.refreshToken.create.mockResolvedValue({});

      const res = await service.login({ username: 'kha', password: 'correct' }, {});
      expect(res.user.id).toBe('u1');
      expect(res.tokens.accessToken).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('throws INVALID_REFRESH nếu record không có', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('u1', 'tid', 'raw', {})).rejects.toThrow(UnauthorizedException);
    });

    it('throws REFRESH_REVOKED nếu revokedAt set', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'tid',
        userId: 'u1',
        tokenHash: 'irrelevant',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
      });
      await expect(service.refresh('u1', 'tid', 'raw', {})).rejects.toThrow(UnauthorizedException);
    });

    it('throws REFRESH_EXPIRED nếu expiresAt past', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'tid',
        userId: 'u1',
        tokenHash: 'irrelevant',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.refresh('u1', 'tid', 'raw', {})).rejects.toThrow(UnauthorizedException);
    });

    it('throws REFRESH_REUSE on hash mismatch + revoke family', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'tid',
        userId: 'u1',
        tokenHash: 'differenthash',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 10000),
      });
      await expect(service.refresh('u1', 'tid', 'raw-token-mismatch', {})).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('logout', () => {
    it('revokes refresh token row', async () => {
      prisma.refreshToken.update.mockResolvedValue({});
      await service.logout('tid');
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'tid' },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('me', () => {
    it('throws UnauthorizedException nếu user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.me('u1')).rejects.toThrow(UnauthorizedException);
    });

    it('returns user nếu found', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const res = await service.me('u1');
      expect(res.id).toBe('u1');
    });
  });
});
