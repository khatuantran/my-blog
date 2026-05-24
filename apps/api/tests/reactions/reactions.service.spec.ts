import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReactionType, CommentStatus } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { ActivityService } from '@/activity/activity.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { ReactionsService } from '@/reactions/reactions.service';

type MockPrisma = {
  post: { findUnique: jest.Mock };
  comment: { findUnique: jest.Mock };
  reaction: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    groupBy: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
  };
  commentLike: {
    findFirst: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
};

describe('ReactionsService', () => {
  let service: ReactionsService;
  let prisma: MockPrisma;
  let activityLog: jest.Mock;
  let createNotification: jest.Mock;

  beforeEach(async () => {
    activityLog = jest.fn();
    createNotification = jest.fn();
    prisma = {
      post: { findUnique: jest.fn() },
      comment: { findUnique: jest.fn() },
      reaction: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      commentLike: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: { log: activityLog } },
        { provide: NotificationsService, useValue: { createNotification } },
      ],
    }).compile();
    service = moduleRef.get(ReactionsService);
  });

  describe('upsertReaction', () => {
    it('throws BadRequestException khi thiếu viewer identity', async () => {
      await expect(service.upsertReaction('p1', {}, ReactionType.LIKE)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('upsert: no existing → create, return type + counts', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', authorId: 'a1' });
      prisma.reaction.findFirst.mockResolvedValue(null);
      prisma.reaction.groupBy.mockResolvedValue([{ type: ReactionType.LIKE, _count: { type: 1 } }]);

      const res = await service.upsertReaction('p1', { anonymousId: 'anon1' }, ReactionType.LIKE);

      expect(prisma.reaction.create).toHaveBeenCalledWith({
        data: { postId: 'p1', userId: null, anonymousId: 'anon1', type: ReactionType.LIKE },
      });
      expect(res.type).toBe(ReactionType.LIKE);
      expect(res.totalCounts[ReactionType.LIKE]).toBe(1);
    });

    it('change-type: existing LIKE → update to LOVE', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', authorId: 'a1' });
      prisma.reaction.findFirst.mockResolvedValue({ id: 'r1', type: ReactionType.LIKE });
      prisma.reaction.groupBy.mockResolvedValue([{ type: ReactionType.LOVE, _count: { type: 1 } }]);

      const res = await service.upsertReaction('p1', { userId: 'u1' }, ReactionType.LOVE);

      expect(prisma.reaction.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { type: ReactionType.LOVE },
      });
      expect(res.type).toBe(ReactionType.LOVE);
      expect(res.totalCounts[ReactionType.LOVE]).toBe(1);
    });

    it('anonymous viewer: stored with anonymousId, no activity log', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', authorId: 'a1' });
      prisma.reaction.findFirst.mockResolvedValue(null);
      prisma.reaction.groupBy.mockResolvedValue([]);

      await service.upsertReaction('p1', { anonymousId: 'anon99' }, ReactionType.HAHA);

      expect(prisma.reaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ anonymousId: 'anon99', userId: null }),
        }),
      );
      expect(activityLog).not.toHaveBeenCalled();
      expect(createNotification).not.toHaveBeenCalled();
    });

    it('auth user new reaction → createNotification REACTION called', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', authorId: 'author1' });
      prisma.reaction.findFirst.mockResolvedValue(null);
      prisma.reaction.groupBy.mockResolvedValue([{ type: ReactionType.LOVE, _count: { type: 1 } }]);

      await service.upsertReaction('p1', { userId: 'u1' }, ReactionType.LOVE);

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'author1',
          actorId: 'u1',
          type: 'REACTION',
          targetType: 'POST',
          targetId: 'p1',
          postId: 'p1',
          metadata: { reactionType: ReactionType.LOVE },
        }),
      );
    });
  });

  describe('removeReaction', () => {
    it('removes existing reaction + throws 404 khi chưa react', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.reaction.findFirst.mockResolvedValue(null);

      await expect(service.removeReaction('p1', { userId: 'u1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes reaction khi tồn tại', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.reaction.findFirst.mockResolvedValue({ id: 'r1' });

      await service.removeReaction('p1', { userId: 'u1' });

      expect(prisma.reaction.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });
  });

  describe('toggleCommentLike', () => {
    it('throws NotFoundException khi comment PENDING', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1', status: CommentStatus.PENDING });
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
    });
  });
});
