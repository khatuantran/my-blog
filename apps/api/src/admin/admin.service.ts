import { Injectable } from '@nestjs/common';
import { Mood } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from 'nestjs-prisma';
import type {
  HeatmapDayDto,
  HeatmapResponseDto,
  MetricBucketDto,
  MoodsResponseDto,
  StatsResponseDto,
} from './dto/admin-response.dto';

const SPARKLINE_DAYS = 12;
const HEATMAP_DAYS = 28;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Tạo ISO date string YYYY-MM-DD theo UTC. */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Set 00:00:00 UTC cho 1 Date instance (immutable, return Date mới). */
function startOfDayUtc(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

/**
 * Build N daily buckets (oldest → newest), zero-fill ngày không có data.
 * Mỗi row có `createdAt: Date`. Bucket theo UTC date.
 */
export function bucketByDay(rows: { createdAt: Date }[], days: number): HeatmapDayDto[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = isoDate(row.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const today = startOfDayUtc(new Date());
  const result: HeatmapDayDto[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const key = isoDate(d);
    result.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return result;
}

function deltaToday(buckets: HeatmapDayDto[]): number {
  if (buckets.length < 2) return 0;
  return buckets[buckets.length - 1].count - buckets[buckets.length - 2].count;
}

function metricFromRows(rows: { createdAt: Date }[], total: number): MetricBucketDto {
  const buckets = bucketByDay(rows, SPARKLINE_DAYS);
  return {
    total,
    sparkline: buckets.map((b) => b.count),
    deltaToday: deltaToday(buckets),
  };
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Truncate volatile tables + reseed admin/user fixtures cho E2E. */
  async resetForE2E(): Promise<{ ok: true; users: string[] }> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({}),
      this.prisma.postView.deleteMany({}),
      this.prisma.commentLike.deleteMany({}),
      this.prisma.reaction.deleteMany({}),
      this.prisma.comment.deleteMany({}),
      this.prisma.file.deleteMany({}),
      this.prisma.image.deleteMany({}),
      this.prisma.postTag.deleteMany({}),
      this.prisma.savedPost.deleteMany({}),
      this.prisma.post.deleteMany({}),
      this.prisma.tag.deleteMany({}),
      this.prisma.anonymousSession.deleteMany({}),
      this.prisma.user.deleteMany({}),
    ]);
    const adminHash = await bcrypt.hash('admin1234', 10);
    const userHash = await bcrypt.hash('user1234', 10);
    await this.prisma.user.createMany({
      data: [
        { username: 'admin', passwordHash: adminHash, role: 'ADMIN', email: 'admin@e2e.local' },
        { username: 'user', passwordHash: userHash, role: 'USER', email: 'user@e2e.local' },
      ],
    });
    return { ok: true, users: ['admin', 'user'] };
  }

  async getStats(): Promise<StatsResponseDto> {
    const windowStart = new Date(
      startOfDayUtc(new Date()).getTime() - (SPARKLINE_DAYS - 1) * DAY_MS,
    );
    const where = { createdAt: { gte: windowStart } };

    const [
      postsTotal,
      reactionsTotal,
      commentsTotal,
      viewsTotal,
      postsRecent,
      reactionsRecent,
      commentsRecent,
      viewsRecent,
    ] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.reaction.count(),
      this.prisma.comment.count(),
      this.prisma.postView.count(),
      this.prisma.post.findMany({ where, select: { createdAt: true } }),
      this.prisma.reaction.findMany({ where, select: { createdAt: true } }),
      this.prisma.comment.findMany({ where, select: { createdAt: true } }),
      this.prisma.postView.findMany({
        where: { viewedAt: { gte: windowStart } },
        select: { viewedAt: true },
      }),
    ]);

    return {
      posts: metricFromRows(postsRecent, postsTotal),
      reactions: metricFromRows(reactionsRecent, reactionsTotal),
      comments: metricFromRows(commentsRecent, commentsTotal),
      views: metricFromRows(
        viewsRecent.map((v) => ({ createdAt: v.viewedAt })),
        viewsTotal,
      ),
    };
  }

  async getMoodDistribution(): Promise<MoodsResponseDto> {
    const grouped = await this.prisma.post.groupBy({
      by: ['mood'],
      _count: { _all: true },
    });
    const byMood = new Map<Mood, number>();
    for (const row of grouped) {
      byMood.set(row.mood, row._count._all);
    }
    const items = Object.values(Mood).map((mood) => ({
      mood,
      count: byMood.get(mood) ?? 0,
    }));
    return { items };
  }

  async getHeatmap(): Promise<HeatmapResponseDto> {
    const windowStart = new Date(startOfDayUtc(new Date()).getTime() - (HEATMAP_DAYS - 1) * DAY_MS);
    const rows = await this.prisma.post.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { createdAt: true },
    });
    return { days: bucketByDay(rows, HEATMAP_DAYS) };
  }
}
