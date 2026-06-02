import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma, PostStatus, ReactionType } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { StorageService } from '../files/storage.service';
import type { CloudinaryAsset } from '../files/cloudinary.service';
import { TagsService, normalizeTagName as normalizeTagNameImpl } from '../tags/tags.service';
import type { CreatePostDto } from './dto/create-post.dto';
import type { UpdatePostDto } from './dto/update-post.dto';
import type { ListPostsDto } from './dto/list-posts.dto';

export { PostStatus };

// Re-export for backward compat (tests import from posts.service)
export const normalizeTagName = normalizeTagNameImpl;

export const POST_INCLUDE = {
  author: { select: { id: true, username: true, name: true, role: true, avatarUrl: true } },
  postTags: { include: { tag: true } },
  images: { orderBy: { order: 'asc' as const } },
  files: { orderBy: { createdAt: 'asc' as const } },
  _count: { select: { reactions: true, comments: true } },
} satisfies Prisma.PostInclude;

export type PostWithRelations = Prisma.PostGetPayload<{ include: typeof POST_INCLUDE }>;

export interface ReactionMeta {
  topReactions: ReactionType[];
  myReaction: ReactionType | null;
}

const EMPTY_REACTION_META: ReactionMeta = { topReactions: [], myReaction: null };

export interface PostView {
  id: string;
  content: string;
  mood: PostWithRelations['mood'];
  status: PostStatus;
  viewCount: number;
  author: PostWithRelations['author'];
  tags: { id: string; name: string; color: string | null }[];
  images: PostWithRelations['images'];
  files: PostWithRelations['files'];
  counts: { reactions: number; comments: number };
  topReactions: ReactionType[];
  myReaction: ReactionType | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPostView(
  post: PostWithRelations,
  meta: ReactionMeta = EMPTY_REACTION_META,
): PostView {
  return {
    id: post.id,
    content: post.content,
    mood: post.mood,
    status: post.status,
    viewCount: post.viewCount,
    author: post.author,
    tags: post.postTags.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      color: pt.tag.color,
    })),
    images: post.images,
    files: post.files,
    counts: { reactions: post._count.reactions, comments: post._count.comments },
    topReactions: meta.topReactions,
    myReaction: meta.myReaction,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export interface PostsViewer {
  userId?: string;
  anonymousId?: string;
}

/**
 * Aggregate reaction meta (topReactions[3] + myReaction) for a batch of post IDs.
 * 1 groupBy + 1 findMany (only when viewer present). Returns map; missing entries → empty meta.
 */
export async function buildReactionMetaMap(
  prisma: PrismaService,
  postIds: string[],
  viewer?: PostsViewer,
): Promise<Map<string, ReactionMeta>> {
  const map = new Map<string, ReactionMeta>();
  if (postIds.length === 0) return map;

  const grouped = await prisma.reaction.groupBy({
    by: ['postId', 'type'],
    where: { postId: { in: postIds } },
    _count: { type: true },
  });

  const byPost = new Map<string, [ReactionType, number][]>();
  for (const row of grouped) {
    const arr = byPost.get(row.postId) ?? [];
    arr.push([row.type, row._count.type]);
    byPost.set(row.postId, arr);
  }

  let mineMap = new Map<string, ReactionType>();
  if (viewer?.userId || viewer?.anonymousId) {
    const mine = await prisma.reaction.findMany({
      where: {
        postId: { in: postIds },
        ...(viewer.userId
          ? { userId: viewer.userId, anonymousId: null }
          : { userId: null, anonymousId: viewer.anonymousId }),
      },
      select: { postId: true, type: true },
    });
    mineMap = new Map(mine.map((m) => [m.postId, m.type]));
  }

  for (const postId of postIds) {
    const tuples = byPost.get(postId) ?? [];
    const topReactions = tuples
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([t]) => t);
    map.set(postId, { topReactions, myReaction: mineMap.get(postId) ?? null });
  }

  return map;
}

export const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly tags: TagsService,
    private readonly activity: ActivityService,
  ) {}

  async list(
    query: ListPostsDto,
    viewer?: PostsViewer,
  ): Promise<{ items: PostView[]; total: number; page: number; limit: number }> {
    const where: Prisma.PostWhereInput = { status: PostStatus.PUBLISHED };
    if (query.mood) where.mood = query.mood;
    if (query.tag) {
      const tagName = normalizeTagName(query.tag);
      where.postTags = { some: { tag: { name: tagName } } };
    }

    const orderBy: Prisma.PostOrderByWithRelationInput =
      query.sort === 'oldest'
        ? { createdAt: 'asc' }
        : query.sort === 'likes'
          ? { reactions: { _count: 'desc' } }
          : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: POST_INCLUDE,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    const metaMap = await buildReactionMetaMap(
      this.prisma,
      items.map((p) => p.id),
      viewer,
    );

    return {
      items: items.map((p) => toPostView(p, metaMap.get(p.id))),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: string, viewer?: PostsViewer): Promise<PostView> {
    const post = await this.prisma.post.findUnique({ where: { id }, include: POST_INCLUDE });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }
    const metaMap = await buildReactionMetaMap(this.prisma, [post.id], viewer);
    return toPostView(post, metaMap.get(post.id));
  }

  async create(authorId: string, dto: CreatePostDto): Promise<PostView> {
    const post = await this.prisma.$transaction(async (tx) => {
      // Upsert tags via TagsService (auto-assign color cycle cho tag mới)
      const tags = await this.tags.upsertMany(dto.tags ?? [], tx);

      return tx.post.create({
        data: {
          content: dto.content,
          mood: dto.mood,
          authorId,
          postTags: { create: tags.map((t) => ({ tagId: t.id })) },
          images: dto.images?.length
            ? {
                create: dto.images.map((img, idx) => ({
                  url: img.url,
                  publicId: img.publicId,
                  width: img.width,
                  height: img.height,
                  order: img.order ?? idx,
                })),
              }
            : undefined,
          files: dto.files?.length
            ? {
                create: dto.files.map((f) => ({
                  name: f.name,
                  type: f.type,
                  size: f.size,
                  url: f.url,
                  publicId: f.publicId,
                })),
              }
            : undefined,
        },
        include: POST_INCLUDE,
      });
      // Cross-region latency (Fly sin ↔ Neon us-east): nâng timeout như update() (BUG-037).
    }, { maxWait: 15_000, timeout: 30_000 });

    this.logger.log(`Post ${post.id} created by ${authorId}`);
    await this.activity.log({
      actorId: authorId,
      type: 'POST_CREATED',
      targetType: 'POST',
      targetId: post.id,
      targetOwnerId: authorId,
    });
    return toPostView(post);
  }

  async update(id: string, dto: UpdatePostDto): Promise<PostView> {
    // Pre-fetch existing publicIds for Cloudinary cleanup if images/files being replaced
    const existing = await this.prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        images: { select: { publicId: true } },
        files: { select: { publicId: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const tagsProvided = dto.tags !== undefined;
    const imagesProvided = dto.images !== undefined;
    const filesProvided = dto.files !== undefined;

    const orphanedAssets: CloudinaryAsset[] = [];
    if (imagesProvided) {
      orphanedAssets.push(
        ...existing.images.map((i) => ({ publicId: i.publicId, resourceType: 'image' as const })),
      );
    }
    if (filesProvided) {
      orphanedAssets.push(
        ...existing.files.map((f) => ({ publicId: f.publicId, resourceType: 'raw' as const })),
      );
    }

    const post = await this.prisma.$transaction(
      async (tx) => {
        if (tagsProvided) {
          const tags = await this.tags.upsertMany(dto.tags ?? [], tx);
          await tx.postTag.deleteMany({ where: { postId: id } });
          if (tags.length > 0) {
            await tx.postTag.createMany({
              data: tags.map((t) => ({ postId: id, tagId: t.id })),
            });
          }
        }

        if (imagesProvided) {
          await tx.image.deleteMany({ where: { postId: id } });
          if (dto.images && dto.images.length > 0) {
            await tx.image.createMany({
              data: dto.images.map((img, idx) => ({
                postId: id,
                url: img.url,
                publicId: img.publicId,
                width: img.width,
                height: img.height,
                order: img.order ?? idx,
              })),
            });
          }
        }

        if (filesProvided) {
          await tx.file.deleteMany({ where: { postId: id } });
          if (dto.files && dto.files.length > 0) {
            await tx.file.createMany({
              data: dto.files.map((f) => ({
                postId: id,
                name: f.name,
                type: f.type,
                size: f.size,
                url: f.url,
                publicId: f.publicId,
              })),
            });
          }
        }

        return tx.post.update({
          where: { id },
          data: {
            ...(dto.content !== undefined ? { content: dto.content } : {}),
            ...(dto.mood !== undefined ? { mood: dto.mood } : {}),
            ...('status' in dto && dto.status !== undefined
              ? { status: dto.status as PostStatus }
              : {}),
          },
          include: POST_INCLUDE,
        });
        // Cross-region latency (Fly sin ↔ Neon us-east ~250ms/query): nhiều query tuần tự
        // dễ vượt default interactive-tx timeout 5s → "Transaction already closed". Nâng timeout.
        // Fix gốc = co-locate app + DB cùng region (xem BUG-037).
      },
      { maxWait: 15_000, timeout: 30_000 },
    );

    // Best-effort Cloudinary cleanup after successful DB tx
    await this.storage.destroyMany(orphanedAssets);

    return toPostView(post);
  }

  async trackView(
    id: string,
    viewer: { userId?: string; anonymousId?: string },
  ): Promise<{ viewCount: number; counted: boolean }> {
    if (!viewer.userId && !viewer.anonymousId) {
      throw new BadRequestException({
        code: 'VIEWER_ID_REQUIRED',
        message: 'Cần auth cookie hoặc anonymous cookie để track view',
      });
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, viewCount: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const dedupKey: Prisma.PostViewWhereInput = viewer.userId
      ? { userId: viewer.userId }
      : { anonymousId: viewer.anonymousId };

    const recent = await this.prisma.postView.findFirst({
      where: {
        postId: id,
        ...dedupKey,
        viewedAt: { gte: new Date(Date.now() - VIEW_DEDUP_WINDOW_MS) },
      },
      select: { id: true },
    });
    if (recent) {
      return { viewCount: post.viewCount, counted: false };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postView.create({
        data: {
          postId: id,
          userId: viewer.userId ?? null,
          anonymousId: viewer.userId ? null : (viewer.anonymousId ?? null),
        },
      });
      return tx.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
    });

    return { viewCount: updated.viewCount, counted: true };
  }

  async adminList(query: {
    page: number;
    limit: number;
    status?: PostStatus;
    mood?: string;
    sort?: string;
    q?: string;
  }): Promise<{ items: PostView[]; total: number; page: number; limit: number }> {
    const where: Prisma.PostWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.mood) where.mood = query.mood as PostWithRelations['mood'];
    if (query.q) where.content = { contains: query.q, mode: 'insensitive' };

    const orderBy: Prisma.PostOrderByWithRelationInput =
      query.sort === 'oldest'
        ? { createdAt: 'asc' }
        : query.sort === 'likes'
          ? { reactions: { _count: 'desc' } }
          : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: POST_INCLUDE,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map((p) => toPostView(p)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        images: { select: { publicId: true } },
        files: { select: { publicId: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }
    await this.prisma.post.delete({ where: { id } });
    // Best-effort Cloudinary cleanup after cascade delete
    await this.storage.destroyMany([
      ...existing.images.map((i) => ({ publicId: i.publicId, resourceType: 'image' as const })),
      ...existing.files.map((f) => ({ publicId: f.publicId, resourceType: 'raw' as const })),
    ]);
    this.logger.log(`Post ${id} deleted`);
  }
}
