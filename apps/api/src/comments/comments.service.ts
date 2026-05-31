import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommentStatus, NotificationType, Prisma, Role } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { CommentResponseDto } from './dto/comment-response.dto';
import type { ModeratableStatus } from './dto/update-status.dto';

const COMMENT_INCLUDE = {
  user: { select: { id: true, username: true, name: true, role: true, avatarUrl: true } },
  _count: { select: { likes: true } },
} satisfies Prisma.CommentInclude;

const COMMENT_TOPLEVEL_INCLUDE = {
  ...COMMENT_INCLUDE,
  replies: {
    where: { status: CommentStatus.APPROVED },
    include: COMMENT_INCLUDE,
    // FR-03.7: preview = 3 reply MỚI NHẤT (newest-first), load-more lấy cũ hơn.
    orderBy: { createdAt: 'desc' as const },
    take: 3,
  },
  _count: { select: { likes: true, replies: true } },
} satisfies Prisma.CommentInclude;

type CommentWithRelations = Prisma.CommentGetPayload<{ include: typeof COMMENT_INCLUDE }>;
type CommentWithReplies = Prisma.CommentGetPayload<{ include: typeof COMMENT_TOPLEVEL_INCLUDE }>;

export interface Viewer {
  userId?: string;
  anonymousId?: string;
  role?: Role;
}

function toCommentResponse(c: CommentWithRelations): CommentResponseDto {
  return {
    id: c.id,
    postId: c.postId,
    content: c.content,
    status: c.status,
    author: c.user
      ? {
          id: c.user.id,
          username: c.user.username,
          name: c.user.name,
          role: c.user.role,
          avatarUrl: c.user.avatarUrl,
        }
      : null,
    anonymousName: c.anonymousName,
    likesCount: c._count.likes,
    parentId: c.parentId,
    replyTo: c.replyTo as { username: string; isAnon: boolean } | null,
    createdAt: c.createdAt,
  };
}

function toTopLevelCommentResponse(
  c: CommentWithReplies,
): CommentResponseDto & { replies: CommentResponseDto[]; replyCount: number } {
  return {
    ...toCommentResponse(c),
    replies: c.replies.map(toCommentResponse),
    replyCount: c._count.replies,
  };
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
  ) {}

  async listForAdmin(
    status: CommentStatus,
    page: number,
    limit: number,
  ): Promise<{
    items: (CommentResponseDto & { post: { id: string; content: string } })[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: Prisma.CommentWhereInput = { status };
    const [rows, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          ...COMMENT_INCLUDE,
          post: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ]);
    return {
      items: rows.map((c) => ({
        ...toCommentResponse(c),
        post: { id: c.post.id, content: c.post.content.slice(0, 80) },
      })),
      total,
      page,
      limit,
    };
  }

  async list(
    postId: string,
    viewerRole: Role | undefined,
  ): Promise<{
    items: (CommentResponseDto & { replies: CommentResponseDto[]; replyCount: number })[];
  }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    // FR-03.6: top-level comments only (parentId IS NULL), include first 3 replies + replyCount
    const where: Prisma.CommentWhereInput = { postId, parentId: null };
    if (viewerRole !== Role.ADMIN) {
      where.status = CommentStatus.APPROVED;
    }

    const items = await this.prisma.comment.findMany({
      where,
      include: COMMENT_TOPLEVEL_INCLUDE,
      // FR-03.7: top-level comment mới→cũ (newest first) cho Feed + Post Detail.
      orderBy: { createdAt: 'desc' },
    });
    return { items: items.map(toTopLevelCommentResponse) };
  }

  async create(postId: string, viewer: Viewer, dto: CreateCommentDto): Promise<CommentResponseDto> {
    if (!viewer.userId && !viewer.anonymousId) {
      throw new BadRequestException({
        code: 'VIEWER_ID_REQUIRED',
        message: 'Cần auth cookie hoặc anonymous cookie để comment',
      });
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    let replyTo: { username: string; isAnon: boolean } | null = null;
    let parentForNotify: { id: string; userId: string | null } | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        include: { user: { select: { username: true } } },
      });
      if (!parent) {
        throw new NotFoundException({
          code: 'PARENT_COMMENT_NOT_FOUND',
          message: 'Parent comment không tồn tại',
        });
      }
      if (parent.postId !== postId) {
        throw new BadRequestException({
          code: 'INVALID_PARENT_POST',
          message: 'Parent comment thuộc post khác',
        });
      }
      if (parent.parentId !== null) {
        throw new BadRequestException({
          code: 'INVALID_PARENT_DEPTH',
          message: 'Reply chỉ depth 1 — không reply vào reply',
        });
      }
      replyTo = {
        username: parent.user?.username ?? parent.anonymousName ?? 'anonymous',
        isAnon: !parent.userId,
      };
      parentForNotify = { id: parent.id, userId: parent.userId };
    }

    // BUG-017: authed user vẫn comment ẩn danh được (design "post as anon" toggle) — khi
    // dto.anonymousName được gửi → tạo comment anon (author=null), KHÔNG attribute cho user
    // (và không log activity / gửi notification dưới danh nghĩa user → giữ ẩn danh thật).
    const effectiveUserId = viewer.userId && !dto.anonymousName ? viewer.userId : null;
    const baseData = effectiveUserId
      ? {
          content: dto.content,
          post: { connect: { id: postId } },
          user: { connect: { id: effectiveUserId } },
        }
      : {
          content: dto.content,
          post: { connect: { id: postId } },
          anonymousId: viewer.anonymousId,
          anonymousName: dto.anonymousName ?? null,
        };
    const data: Prisma.CommentCreateInput = dto.parentId
      ? {
          ...baseData,
          parent: { connect: { id: dto.parentId } },
          replyTo: replyTo as Prisma.InputJsonValue,
        }
      : baseData;

    const comment = await this.prisma.comment.create({ data, include: COMMENT_INCLUDE });
    this.logger.log(
      `Comment ${comment.id} created on post ${postId} by ${viewer.userId ?? viewer.anonymousId}`,
    );
    if (effectiveUserId) {
      await this.activity.log({
        actorId: effectiveUserId,
        type: 'COMMENT_CREATED',
        targetType: 'POST',
        targetId: postId,
        targetOwnerId: post.authorId,
      });
      try {
        if (parentForNotify) {
          // FR-14.1: Reply → REPLY notification to parent comment author
          // Skip nếu parent anonymous (userId null) hoặc self-reply (avoid spam)
          if (parentForNotify.userId && parentForNotify.userId !== effectiveUserId) {
            await this.notifications.createNotification({
              userId: parentForNotify.userId,
              actorId: effectiveUserId,
              type: NotificationType.REPLY,
              targetType: 'COMMENT',
              targetId: parentForNotify.id,
              postId,
              metadata: { replyTo: { username: comment.user?.username ?? 'unknown' } },
              snippet: comment.content,
            });
          }
        } else {
          // Top-level comment → COMMENT notification to post author
          await this.notifications.createNotification({
            userId: post.authorId,
            actorId: effectiveUserId,
            type: NotificationType.COMMENT,
            targetType: 'POST',
            targetId: postId,
            postId,
            snippet: comment.content,
          });
        }
      } catch (err) {
        this.logger.warn(`createNotification failed: ${err}`);
      }
    }
    return toCommentResponse(comment);
  }

  async listReplies(
    parentId: string,
    page: number,
    limit: number,
    viewerRole: Role | undefined,
  ): Promise<{ items: CommentResponseDto[]; total: number; page: number; limit: number }> {
    const parent = await this.prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true },
    });
    if (!parent) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Parent comment không tồn tại',
      });
    }

    const where: Prisma.CommentWhereInput = { parentId };
    if (viewerRole !== Role.ADMIN) {
      where.status = CommentStatus.APPROVED;
    }

    const [rows, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: COMMENT_INCLUDE,
        // FR-03.7: replies load-more cũng mới→cũ (khớp preview).
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return { items: rows.map(toCommentResponse), total, page, limit };
  }

  async findById(id: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({ where: { id }, select: { id: true } });
    if (!comment) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Comment không tồn tại',
      });
    }
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.comment.delete({ where: { id } });
    this.logger.log(`Comment ${id} deleted`);
  }

  async updateStatus(id: string, status: ModeratableStatus): Promise<CommentResponseDto> {
    await this.findById(id);
    const comment = await this.prisma.comment.update({
      where: { id },
      data: { status },
      include: COMMENT_INCLUDE,
    });
    this.logger.log(`Comment ${id} status → ${status}`);
    return toCommentResponse(comment);
  }
}
