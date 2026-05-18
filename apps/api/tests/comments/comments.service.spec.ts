import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommentStatus, Role } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { CommentsService } from '@/comments/comments.service';

type MockPrisma = {
  post: { findUnique: jest.Mock };
  comment: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const baseUser = { id: 'u1', username: 'kha', role: Role.USER, avatarUrl: null };
const baseComment = {
  id: 'c1',
  postId: 'p1',
  userId: 'u1',
  anonymousId: null,
  anonymousName: null,
  content: 'hi',
  status: CommentStatus.APPROVED,
  createdAt: new Date('2026-05-18T00:00:00Z'),
  user: baseUser,
  _count: { likes: 2 },
};

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn() },
      comment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [CommentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(CommentsService);
  });

  describe('list', () => {
    it('404 nếu post không tồn tại', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.list('nope', undefined)).rejects.toThrow(NotFoundException);
    });

    it('non-admin: where filter APPROVED + orderBy createdAt asc', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.comment.findMany.mockResolvedValue([baseComment]);
      const res = await service.list('p1', Role.USER);
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { postId: 'p1', status: CommentStatus.APPROVED },
          orderBy: { createdAt: 'asc' },
        }),
      );
      expect(res.items[0].author?.username).toBe('kha');
      expect(res.items[0].likesCount).toBe(2);
    });

    it('admin: where KHÔNG filter status', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.comment.findMany.mockResolvedValue([baseComment]);
      await service.list('p1', Role.ADMIN);
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: 'p1' } }),
      );
    });

    it('undefined viewerRole (anonymous) filter APPROVED', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.comment.findMany.mockResolvedValue([]);
      await service.list('p1', undefined);
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: 'p1', status: CommentStatus.APPROVED } }),
      );
    });

    it('anonymous comment trả author=null + anonymousName', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.comment.findMany.mockResolvedValue([
        {
          ...baseComment,
          userId: null,
          user: null,
          anonymousId: '0x1',
          anonymousName: 'Khách',
        },
      ]);
      const res = await service.list('p1', undefined);
      expect(res.items[0].author).toBeNull();
      expect(res.items[0].anonymousName).toBe('Khách');
    });
  });

  describe('create', () => {
    it('400 thiếu cả userId + anonymousId', async () => {
      await expect(service.create('p1', {}, { content: 'x' })).rejects.toThrow(BadRequestException);
    });

    it('404 post không tồn tại', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(
        service.create('nope', { anonymousId: '0x1' }, { content: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('auth user: userId set, anonymousName ignored', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.comment.create.mockResolvedValue(baseComment);
      await service.create(
        'p1',
        { userId: 'u1', anonymousId: '0x1' },
        { content: 'hi', anonymousName: 'IgnoreMe' },
      );
      const arg = prisma.comment.create.mock.calls[0][0];
      expect(arg.data.user).toEqual({ connect: { id: 'u1' } });
      expect(arg.data.anonymousName).toBeUndefined();
      expect(arg.data.anonymousId).toBeUndefined();
    });

    it('anon: anonymousId + anonymousName set', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.comment.create.mockResolvedValue({
        ...baseComment,
        userId: null,
        user: null,
        anonymousId: '0x1',
        anonymousName: 'Khách',
      });
      await service.create('p1', { anonymousId: '0x1' }, { content: 'hi', anonymousName: 'Khách' });
      const arg = prisma.comment.create.mock.calls[0][0];
      expect(arg.data.user).toBeUndefined();
      expect(arg.data.anonymousId).toBe('0x1');
      expect(arg.data.anonymousName).toBe('Khách');
    });

    it('anon không có anonymousName → null', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.comment.create.mockResolvedValue({
        ...baseComment,
        userId: null,
        user: null,
        anonymousId: '0x1',
      });
      await service.create('p1', { anonymousId: '0x1' }, { content: 'hi' });
      const arg = prisma.comment.create.mock.calls[0][0];
      expect(arg.data.anonymousName).toBeNull();
    });
  });

  describe('remove', () => {
    it('404 nếu comment không tồn tại', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });

    it('success: delete', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.comment.delete.mockResolvedValue(baseComment);
      await service.remove('c1');
      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });

  describe('updateStatus', () => {
    it('404 nếu comment không tồn tại', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('nope', CommentStatus.REJECTED)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('APPROVED → REJECTED', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.comment.update.mockResolvedValue({ ...baseComment, status: CommentStatus.REJECTED });
      const res = await service.updateStatus('c1', CommentStatus.REJECTED);
      expect(res.status).toBe(CommentStatus.REJECTED);
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: CommentStatus.REJECTED },
        include: expect.any(Object),
      });
    });

    it('REJECTED → APPROVED', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.comment.update.mockResolvedValue({ ...baseComment, status: CommentStatus.APPROVED });
      const res = await service.updateStatus('c1', CommentStatus.APPROVED);
      expect(res.status).toBe(CommentStatus.APPROVED);
    });
  });
});
