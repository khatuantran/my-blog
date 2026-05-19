import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommentStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { CommentResponseDto } from './dto/comment-response.dto';
import type { ModeratableStatus } from './dto/update-status.dto';

const COMMENT_INCLUDE = {
  user: { select: { id: true, username: true, role: true, avatarUrl: true } },
  _count: { select: { likes: true } },
} satisfies Prisma.CommentInclude;

type CommentWithRelations = Prisma.CommentGetPayload<{ include: typeof COMMENT_INCLUDE }>;

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
          role: c.user.role,
          avatarUrl: c.user.avatarUrl,
        }
      : null,
    anonymousName: c.anonymousName,
    likesCount: c._count.likes,
    createdAt: c.createdAt,
  };
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
  ): Promise<{ items: CommentResponseDto[] }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const where: Prisma.CommentWhereInput = { postId };
    if (viewerRole !== Role.ADMIN) {
      where.status = CommentStatus.APPROVED;
    }

    const items = await this.prisma.comment.findMany({
      where,
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return { items: items.map(toCommentResponse) };
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
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const data: Prisma.CommentCreateInput = viewer.userId
      ? {
          content: dto.content,
          post: { connect: { id: postId } },
          user: { connect: { id: viewer.userId } },
          // anonymousName ignored cho auth user
        }
      : {
          content: dto.content,
          post: { connect: { id: postId } },
          anonymousId: viewer.anonymousId,
          anonymousName: dto.anonymousName ?? null,
        };

    const comment = await this.prisma.comment.create({ data, include: COMMENT_INCLUDE });
    this.logger.log(
      `Comment ${comment.id} created on post ${postId} by ${viewer.userId ?? viewer.anonymousId}`,
    );
    return toCommentResponse(comment);
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
