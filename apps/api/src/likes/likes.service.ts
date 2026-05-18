import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

export interface Viewer {
  userId?: string;
  anonymousId?: string;
}

interface DedupKey {
  userId: string | null;
  anonymousId: string | null;
}

export interface ToggleResult {
  liked: boolean;
  count: number;
}

function buildDedupKey(viewer: Viewer): DedupKey {
  if (viewer.userId) return { userId: viewer.userId, anonymousId: null };
  if (viewer.anonymousId) return { userId: null, anonymousId: viewer.anonymousId };
  throw new BadRequestException({
    code: 'VIEWER_ID_REQUIRED',
    message: 'Cần auth cookie hoặc anonymous cookie để like',
  });
}

@Injectable()
export class LikesService {
  private readonly logger = new Logger(LikesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async togglePostLike(postId: string, viewer: Viewer): Promise<ToggleResult> {
    const key = buildDedupKey(viewer);

    const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const existing = await this.prisma.like.findFirst({
      where: { postId, userId: key.userId, anonymousId: key.anonymousId },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.like.create({
        data: { postId, userId: key.userId, anonymousId: key.anonymousId },
      });
    }

    const count = await this.prisma.like.count({ where: { postId } });
    return { liked: !existing, count };
  }

  async toggleCommentLike(commentId: string, viewer: Viewer): Promise<ToggleResult> {
    const key = buildDedupKey(viewer);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, status: true },
    });
    if (!comment || comment.status !== CommentStatus.APPROVED) {
      // Ẩn PENDING/REJECTED → trả 404 như khi không tồn tại
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
    }

    const count = await this.prisma.commentLike.count({ where: { commentId } });
    return { liked: !existing, count };
  }
}
