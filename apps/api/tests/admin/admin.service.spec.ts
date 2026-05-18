import { Test } from '@nestjs/testing';
import { Mood } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AdminService, bucketByDay } from '@/admin/admin.service';

type MockPrisma = {
  post: { count: jest.Mock; findMany: jest.Mock; groupBy: jest.Mock };
  like: { count: jest.Mock; findMany: jest.Mock };
  comment: { count: jest.Mock; findMany: jest.Mock };
  postView: { count: jest.Mock; findMany: jest.Mock };
};

const DAY_MS = 24 * 60 * 60 * 1000;

function utcStartOfToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

describe('AdminService', () => {
  let service: AdminService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      post: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
      like: { count: jest.fn(), findMany: jest.fn() },
      comment: { count: jest.fn(), findMany: jest.fn() },
      postView: { count: jest.fn(), findMany: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(AdminService);
  });

  describe('bucketByDay (helper)', () => {
    it('return N entries, oldest first, zero-fill missing', () => {
      const today = utcStartOfToday();
      const yesterday = new Date(today.getTime() - DAY_MS);
      const rows = [{ createdAt: today }, { createdAt: today }, { createdAt: yesterday }];
      const buckets = bucketByDay(rows, 5);
      expect(buckets).toHaveLength(5);
      expect(buckets[buckets.length - 1].count).toBe(2); // today
      expect(buckets[buckets.length - 2].count).toBe(1); // yesterday
      expect(buckets[0].count).toBe(0); // 4 days ago
    });

    it('empty rows → tất cả 0', () => {
      const buckets = bucketByDay([], 3);
      expect(buckets.every((b) => b.count === 0)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('aggregate 4 metrics + sparkline length 12 + deltaToday', async () => {
      const today = utcStartOfToday();
      const yesterday = new Date(today.getTime() - DAY_MS);
      prisma.post.count.mockResolvedValue(10);
      prisma.like.count.mockResolvedValue(20);
      prisma.comment.count.mockResolvedValue(5);
      prisma.postView.count.mockResolvedValue(100);
      prisma.post.findMany.mockResolvedValue([
        { createdAt: today },
        { createdAt: today },
        { createdAt: today },
        { createdAt: yesterday },
      ]);
      prisma.like.findMany.mockResolvedValue([{ createdAt: today }]);
      prisma.comment.findMany.mockResolvedValue([]);
      prisma.postView.findMany.mockResolvedValue([
        { viewedAt: today },
        { viewedAt: yesterday },
        { viewedAt: yesterday },
      ]);

      const res = await service.getStats();
      expect(res.posts.total).toBe(10);
      expect(res.posts.sparkline).toHaveLength(12);
      expect(res.posts.deltaToday).toBe(3 - 1); // today=3, yesterday=1
      expect(res.likes.total).toBe(20);
      expect(res.likes.deltaToday).toBe(1 - 0);
      expect(res.comments.total).toBe(5);
      expect(res.comments.sparkline.every((n) => n === 0)).toBe(true);
      expect(res.views.total).toBe(100);
      expect(res.views.deltaToday).toBe(1 - 2);
    });
  });

  describe('getMoodDistribution', () => {
    it('7 moods zero-filled khi DB chỉ có 2', async () => {
      prisma.post.groupBy.mockResolvedValue([
        { mood: Mood.HAPPY, _count: { _all: 5 } },
        { mood: Mood.SAD, _count: { _all: 2 } },
      ]);
      const res = await service.getMoodDistribution();
      expect(res.items).toHaveLength(7);
      const byMood = Object.fromEntries(res.items.map((i) => [i.mood, i.count]));
      expect(byMood[Mood.HAPPY]).toBe(5);
      expect(byMood[Mood.SAD]).toBe(2);
      expect(byMood[Mood.ANGRY]).toBe(0);
      expect(byMood[Mood.CALM]).toBe(0);
      expect(byMood[Mood.EXCITED]).toBe(0);
      expect(byMood[Mood.GRATEFUL]).toBe(0);
      expect(byMood[Mood.THOUGHTFUL]).toBe(0);
    });

    it('empty DB → 7 entries count=0', async () => {
      prisma.post.groupBy.mockResolvedValue([]);
      const res = await service.getMoodDistribution();
      expect(res.items).toHaveLength(7);
      expect(res.items.every((i) => i.count === 0)).toBe(true);
    });
  });

  describe('getHeatmap', () => {
    it('28 entries, count đúng cho mỗi day', async () => {
      const today = utcStartOfToday();
      prisma.post.findMany.mockResolvedValue([
        { createdAt: today },
        { createdAt: today },
        { createdAt: new Date(today.getTime() - 3 * DAY_MS) },
      ]);
      const res = await service.getHeatmap();
      expect(res.days).toHaveLength(28);
      expect(res.days[res.days.length - 1].count).toBe(2); // today
      expect(res.days[res.days.length - 4].count).toBe(1); // 3 days ago
    });
  });
});
