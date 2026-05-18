import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { LikesService } from '@/likes/likes.service';

type MockPrisma = {
  post: { findUnique: jest.Mock };
  comment: { findUnique: jest.Mock };
  like: {
    findFirst: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  commentLike: {
    findFirst: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
};

describe('LikesService', () => {
  let service: LikesService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn() },
      comment: { findUnique: jest.fn() },
      like: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      commentLike: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [LikesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(LikesService);
  });

  describe('togglePostLike', () => {
    it('throws BadRequestException khi thiếu cả userId + anonymousId', async () => {
      await expect(service.togglePostLike('p1', {})).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException nếu post không tồn tại', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.togglePostLike('nope', { anonymousId: '0x1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('liked=true khi chưa có like (anonymous, count=1)', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.like.findFirst.mockResolvedValue(null);
      prisma.like.count.mockResolvedValue(1);
      const res = await service.togglePostLike('p1', { anonymousId: '0x1' });
      expect(res).toEqual({ liked: true, count: 1 });
      expect(prisma.like.create).toHaveBeenCalledWith({
        data: { postId: 'p1', userId: null, anonymousId: '0x1' },
      });
      expect(prisma.like.delete).not.toHaveBeenCalled();
    });

    it('liked=false khi đã có like (anonymous, count giảm)', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.like.findFirst.mockResolvedValue({ id: 'lk1' });
      prisma.like.count.mockResolvedValue(0);
      const res = await service.togglePostLike('p1', { anonymousId: '0x1' });
      expect(res).toEqual({ liked: false, count: 0 });
      expect(prisma.like.delete).toHaveBeenCalledWith({ where: { id: 'lk1' } });
      expect(prisma.like.create).not.toHaveBeenCalled();
    });

    it('auth user: prefer userId, anonymousId KHÔNG lưu', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.like.findFirst.mockResolvedValue(null);
      prisma.like.count.mockResolvedValue(1);
      await service.togglePostLike('p1', { userId: 'u1', anonymousId: '0x1' });
      expect(prisma.like.findFirst).toHaveBeenCalledWith({
        where: { postId: 'p1', userId: 'u1', anonymousId: null },
        select: { id: true },
      });
      expect(prisma.like.create).toHaveBeenCalledWith({
        data: { postId: 'p1', userId: 'u1', anonymousId: null },
      });
    });
  });

  describe('toggleCommentLike', () => {
    it('throws BadRequestException thiếu identity', async () => {
      await expect(service.toggleCommentLike('c1', {})).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException khi comment không tồn tại', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.toggleCommentLike('nope', { anonymousId: '0x1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException khi comment PENDING (ẩn)', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1', status: CommentStatus.PENDING });
      await expect(service.toggleCommentLike('c1', { anonymousId: '0x1' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.commentLike.findFirst).not.toHaveBeenCalled();
    });

    it('throws NotFoundException khi comment REJECTED (ẩn)', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1', status: CommentStatus.REJECTED });
      await expect(service.toggleCommentLike('c1', { anonymousId: '0x1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('liked=true khi APPROVED comment chưa có like', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1', status: CommentStatus.APPROVED });
      prisma.commentLike.findFirst.mockResolvedValue(null);
      prisma.commentLike.count.mockResolvedValue(1);
      const res = await service.toggleCommentLike('c1', { anonymousId: '0x1' });
      expect(res).toEqual({ liked: true, count: 1 });
      expect(prisma.commentLike.create).toHaveBeenCalledWith({
        data: { commentId: 'c1', userId: null, anonymousId: '0x1' },
      });
    });

    it('liked=false khi APPROVED đã có like (toggle off)', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1', status: CommentStatus.APPROVED });
      prisma.commentLike.findFirst.mockResolvedValue({ id: 'cl1' });
      prisma.commentLike.count.mockResolvedValue(0);
      const res = await service.toggleCommentLike('c1', { anonymousId: '0x1' });
      expect(res).toEqual({ liked: false, count: 0 });
      expect(prisma.commentLike.delete).toHaveBeenCalledWith({ where: { id: 'cl1' } });
    });
  });
});
