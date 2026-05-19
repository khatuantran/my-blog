import { Test } from '@nestjs/testing';
import { ActivityTargetType, ActivityType } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { ActivityService } from '@/activity/activity.service';

type MockPrisma = {
  activityLog: { create: jest.Mock; count: jest.Mock; findMany: jest.Mock };
  post: { findMany: jest.Mock };
  comment: { findMany: jest.Mock };
  $transaction: jest.Mock;
};

describe('ActivityService', () => {
  let service: ActivityService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      activityLog: { create: jest.fn(), count: jest.fn(), findMany: jest.fn() },
      post: { findMany: jest.fn().mockResolvedValue([]) },
      comment: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((calls: Promise<unknown>[]) => Promise.all(calls)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ActivityService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ActivityService);
  });

  describe('log', () => {
    it('insert row với shape đầy đủ', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: 'a1' });
      await service.log({
        actorId: 'u1',
        type: ActivityType.POST_CREATED,
        targetType: ActivityTargetType.POST,
        targetId: 'p1',
        targetOwnerId: 'u1',
      });
      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: 'u1',
          type: 'POST_CREATED',
          targetType: 'POST',
          targetId: 'p1',
          targetOwnerId: 'u1',
        }),
      });
    });

    it('không throw khi prisma fail (best-effort)', async () => {
      prisma.activityLog.create.mockRejectedValue(new Error('DB down'));
      await expect(
        service.log({
          actorId: 'u1',
          type: ActivityType.LIKE_CREATED,
          targetType: ActivityTargetType.POST,
          targetId: 'p1',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('listForUser', () => {
    const baseRow = (overrides: Record<string, unknown>) => ({
      id: 'a1',
      actorId: 'u1',
      type: ActivityType.POST_CREATED,
      targetType: ActivityTargetType.POST,
      targetId: 'p1',
      targetOwnerId: 'u1',
      metadata: null,
      createdAt: new Date('2026-05-19T00:00:00Z'),
      actor: { id: 'u1', username: 'kha', avatarUrl: null },
      ...overrides,
    });

    it('returns empty paginated nếu không có row', async () => {
      prisma.activityLog.count.mockResolvedValue(0);
      prisma.activityLog.findMany.mockResolvedValue([]);
      const result = await service.listForUser('u1', 1, 20);
      expect(result).toEqual({ items: [], total: 0, page: 1, limit: 20 });
    });

    it('direction OUTGOING khi actor === userId', async () => {
      const row = baseRow({ id: 'a1', actorId: 'u1', targetId: 'p1', targetOwnerId: 'u1' });
      prisma.activityLog.count.mockResolvedValue(1);
      prisma.activityLog.findMany.mockResolvedValue([row]);
      prisma.post.findMany.mockResolvedValue([{ id: 'p1', content: 'hello world' }]);
      const result = await service.listForUser('u1', 1, 20);
      expect(result.items[0].direction).toBe('OUTGOING');
      expect(result.items[0].target.snippet).toBe('hello world');
    });

    it('direction INCOMING khi actor khác userId nhưng là targetOwner', async () => {
      const row = baseRow({
        actorId: 'u2',
        targetOwnerId: 'u1',
        actor: { id: 'u2', username: 'bob', avatarUrl: null },
      });
      prisma.activityLog.count.mockResolvedValue(1);
      prisma.activityLog.findMany.mockResolvedValue([row]);
      prisma.post.findMany.mockResolvedValue([{ id: 'p1', content: 'hi' }]);
      const result = await service.listForUser('u1', 1, 20);
      expect(result.items[0].direction).toBe('INCOMING');
      expect(result.items[0].actor.username).toBe('bob');
    });

    it('target snippet null khi post đã deleted', async () => {
      const row = baseRow({ targetId: 'p-gone' });
      prisma.activityLog.count.mockResolvedValue(1);
      prisma.activityLog.findMany.mockResolvedValue([row]);
      prisma.post.findMany.mockResolvedValue([]); // không tìm thấy
      const result = await service.listForUser('u1', 1, 20);
      expect(result.items[0].target.snippet).toBeNull();
    });

    it('snippet truncate 80 char', async () => {
      const longContent = 'x'.repeat(120);
      const row = baseRow({});
      prisma.activityLog.count.mockResolvedValue(1);
      prisma.activityLog.findMany.mockResolvedValue([row]);
      prisma.post.findMany.mockResolvedValue([{ id: 'p1', content: longContent }]);
      const result = await service.listForUser('u1', 1, 20);
      expect(result.items[0].target.snippet).toHaveLength(80);
    });
  });
});
