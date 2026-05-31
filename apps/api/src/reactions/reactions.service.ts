import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CommentStatus,
  InteractionAction,
  InteractionTargetType,
  NotificationType,
  ReactionType,
  Role,
} from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InteractionLogService } from '../interaction-logs/interaction-logs.service';
import type { ClientInfo } from '../common/decorators/client-info.decorator';
import type { ListReactionsDto } from './dto/list-reactions.dto';

export interface Viewer {
  userId?: string;
  anonymousId?: string;
  role?: Role; // FR-18: phân biệt admin (không trace)
  client?: ClientInfo; // FR-18: ip/ua/... cho trace log
}

interface DedupKey {
  userId: string | null;
  anonymousId: string | null;
}

export interface ToggleResult {
  liked: boolean;
  count: number;
}

export type TotalCounts = Record<ReactionType, number>;

export interface UpsertReactionResult {
  type: ReactionType;
  totalCounts: TotalCounts;
  topThree: ReactionType[];
}

export interface ReactionCountsResult {
  totalCounts: TotalCounts;
  topThree: ReactionType[];
  total: number;
  myReaction: ReactionType | null;
}

export interface ReactionListResult {
  items: Array<{
    actor: { id: string; username: string; avatarUrl: string | null } | null;
    type: ReactionType;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  byType: TotalCounts;
}

function buildDedupKey(viewer: Viewer): DedupKey {
  if (viewer.userId) return { userId: viewer.userId, anonymousId: null };
  if (viewer.anonymousId) return { userId: null, anonymousId: viewer.anonymousId };
  throw new BadRequestException({
    code: 'VIEWER_ID_REQUIRED',
    message: 'Cần auth cookie hoặc anonymous cookie để react',
  });
}

const ALL_REACTION_TYPES = Object.values(ReactionType);

function emptyTotalCounts(): TotalCounts {
  return Object.fromEntries(ALL_REACTION_TYPES.map((t) => [t, 0])) as TotalCounts;
}

@Injectable()
export class ReactionsService {
  private readonly logger = new Logger(ReactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
    private readonly interactionLog: InteractionLogService,
  ) {}

  private async buildCounts(
    postId: string,
  ): Promise<{ totalCounts: TotalCounts; topThree: ReactionType[]; total: number }> {
    const grouped = await this.prisma.reaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { type: true },
    });

    const totalCounts = emptyTotalCounts();
    let total = 0;
    for (const row of grouped) {
      totalCounts[row.type] = row._count.type;
      total += row._count.type;
    }

    const topThree = (Object.entries(totalCounts) as [ReactionType, number][])
      .filter(([, n]) => n > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([t]) => t);

    return { totalCounts, topThree, total };
  }

  async upsertReaction(
    postId: string,
    viewer: Viewer,
    type: ReactionType,
  ): Promise<UpsertReactionResult> {
    const key = buildDedupKey(viewer);

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, content: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const existing = await this.prisma.reaction.findFirst({
      where: { postId, userId: key.userId, anonymousId: key.anonymousId },
      select: { id: true, type: true },
    });

    if (existing) {
      if (existing.type !== type) {
        await this.prisma.reaction.update({
          where: { id: existing.id },
          data: { type },
        });
      }
      // Same type → treat as no-op (idempotent upsert; use DELETE to remove)
    } else {
      await this.prisma.reaction.create({
        data: { postId, userId: key.userId, anonymousId: key.anonymousId, type },
      });
      // FR-18: trace log react mới (best-effort, skip admin internally)
      await this.interactionLog.log({
        action: InteractionAction.POST_REACTION,
        targetType: InteractionTargetType.POST,
        targetId: postId,
        postId,
        actorUserId: viewer.userId ?? null,
        actorRole: viewer.role ?? null,
        anonymousId: viewer.anonymousId ?? null,
        client: viewer.client,
        metadata: { reactionType: type },
      });
      if (key.userId && key.userId !== post.authorId) {
        await this.activity.log({
          actorId: key.userId,
          type: 'LIKE_CREATED',
          targetType: 'POST',
          targetId: postId,
          targetOwnerId: post.authorId,
          metadata: { reactionType: type },
        });
        try {
          await this.notifications.createNotification({
            userId: post.authorId,
            actorId: key.userId,
            type: NotificationType.REACTION,
            targetType: 'POST',
            targetId: postId,
            postId,
            metadata: { reactionType: type },
            snippet: post.content,
          });
        } catch (err) {
          this.logger.warn(`createNotification REACTION failed: ${err}`);
        }
      }
    }

    const { totalCounts, topThree } = await this.buildCounts(postId);
    return { type, totalCounts, topThree };
  }

  async removeReaction(postId: string, viewer: Viewer): Promise<void> {
    const key = buildDedupKey(viewer);

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const existing = await this.prisma.reaction.findFirst({
      where: { postId, userId: key.userId, anonymousId: key.anonymousId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'REACTION_NOT_FOUND',
        message: 'Chưa react bài viết này',
      });
    }

    await this.prisma.reaction.delete({ where: { id: existing.id } });
  }

  async getReactionCounts(postId: string, viewer?: Viewer): Promise<ReactionCountsResult> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const { totalCounts, topThree, total } = await this.buildCounts(postId);

    let myReaction: ReactionType | null = null;
    if (viewer?.userId || viewer?.anonymousId) {
      try {
        const key = buildDedupKey(viewer);
        const mine = await this.prisma.reaction.findFirst({
          where: { postId, userId: key.userId, anonymousId: key.anonymousId },
          select: { type: true },
        });
        myReaction = mine?.type ?? null;
      } catch {
        // VIEWER_ID_REQUIRED — no viewer provided, myReaction stays null
      }
    }

    return { totalCounts, topThree, total, myReaction };
  }

  async listReactions(postId: string, query: ListReactionsDto): Promise<ReactionListResult> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const where = { postId, ...(query.type ? { type: query.type } : {}) };
    const [rows, total] = await Promise.all([
      this.prisma.reaction.findMany({
        where,
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.reaction.count({ where }),
    ]);

    const { totalCounts: byType } = await this.buildCounts(postId);

    const items = rows.map((r) => ({
      actor: r.user
        ? { id: r.user.id, username: r.user.username, avatarUrl: r.user.avatarUrl }
        : null,
      type: r.type,
      createdAt: r.createdAt,
    }));

    return { items, total, page: query.page, limit: query.limit, byType };
  }

  async toggleCommentLike(commentId: string, viewer: Viewer): Promise<ToggleResult> {
    const key = buildDedupKey(viewer);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, status: true, postId: true },
    });
    if (!comment || comment.status !== CommentStatus.APPROVED) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Comment không tồn tại',
      });
    }

    const existing = await this.prisma.commentLike.findFirst({
      where: { commentId, userId: key.userId, anonymousId: key.anonymousId },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.commentLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.commentLike.create({
        data: { commentId, userId: key.userId, anonymousId: key.anonymousId },
      });
      // FR-18: trace log comment-like mới (chỉ khi like, không khi unlike). Skip admin internally.
      await this.interactionLog.log({
        action: InteractionAction.COMMENT_LIKE,
        targetType: InteractionTargetType.COMMENT,
        targetId: commentId,
        postId: comment.postId,
        actorUserId: viewer.userId ?? null,
        actorRole: viewer.role ?? null,
        anonymousId: viewer.anonymousId ?? null,
        client: viewer.client,
      });
    }

    const count = await this.prisma.commentLike.count({ where: { commentId } });
    return { liked: !existing, count };
  }
}
