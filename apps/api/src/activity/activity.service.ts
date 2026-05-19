import { Injectable, Logger } from '@nestjs/common';
import { ActivityTargetType, ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import type {
  ActivityDirection,
  ActivityItemDto,
  PaginatedActivityDto,
} from './dto/activity-response.dto';

type LogInput = {
  actorId: string;
  type: ActivityType;
  targetType: ActivityTargetType;
  targetId: string;
  targetOwnerId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Best-effort log — không throw để không break parent transaction. */
  async log(input: LogInput): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          actorId: input.actorId,
          type: input.type,
          targetType: input.targetType,
          targetId: input.targetId,
          targetOwnerId: input.targetOwnerId ?? null,
          metadata: input.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (err) {
      this.logger.warn(`ActivityLog insert failed (best-effort skip): ${(err as Error).message}`);
    }
  }

  async listForUser(userId: string, page: number, limit: number): Promise<PaginatedActivityDto> {
    const where: Prisma.ActivityLogWhereInput = {
      OR: [{ actorId: userId }, { AND: [{ targetOwnerId: userId }, { NOT: { actorId: userId } }] }],
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
    ]);

    const postIds = rows.filter((r) => r.targetType === 'POST').map((r) => r.targetId);
    const commentIds = rows.filter((r) => r.targetType === 'COMMENT').map((r) => r.targetId);

    const [posts, comments] = await Promise.all([
      postIds.length
        ? this.prisma.post.findMany({
            where: { id: { in: postIds } },
            select: { id: true, content: true },
          })
        : Promise.resolve([]),
      commentIds.length
        ? this.prisma.comment.findMany({
            where: { id: { in: commentIds } },
            select: { id: true, content: true },
          })
        : Promise.resolve([]),
    ]);

    const postMap = new Map(posts.map((p) => [p.id, p.content]));
    const commentMap = new Map(comments.map((c) => [c.id, c.content]));

    const items: ActivityItemDto[] = rows.map((row) => {
      const sourceContent =
        row.targetType === 'POST' ? postMap.get(row.targetId) : commentMap.get(row.targetId);
      const snippet = sourceContent ? sourceContent.slice(0, 80) : null;
      const direction: ActivityDirection = row.actorId === userId ? 'OUTGOING' : 'INCOMING';
      return {
        id: row.id,
        type: row.type,
        direction,
        actor: row.actor,
        target: { type: row.targetType, id: row.targetId, snippet },
        createdAt: row.createdAt,
      };
    });

    return { items, total, page, limit };
  }
}
