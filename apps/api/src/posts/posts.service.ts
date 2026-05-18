import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import type { CreatePostDto } from './dto/create-post.dto';
import type { UpdatePostDto } from './dto/update-post.dto';
import type { ListPostsDto } from './dto/list-posts.dto';

const POST_INCLUDE = {
  author: { select: { id: true, username: true, role: true, avatarUrl: true } },
  postTags: { include: { tag: true } },
  images: { orderBy: { order: 'asc' as const } },
  files: { orderBy: { createdAt: 'asc' as const } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{ include: typeof POST_INCLUDE }>;

export interface PostView {
  id: string;
  content: string;
  mood: PostWithRelations['mood'];
  viewCount: number;
  author: PostWithRelations['author'];
  tags: { id: string; name: string; color: string | null }[];
  images: PostWithRelations['images'];
  files: PostWithRelations['files'];
  counts: { likes: number; comments: number };
  createdAt: Date;
  updatedAt: Date;
}

export function toPostView(post: PostWithRelations): PostView {
  return {
    id: post.id,
    content: post.content,
    mood: post.mood,
    viewCount: post.viewCount,
    author: post.author,
    tags: post.postTags.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      color: pt.tag.color,
    })),
    images: post.images,
    files: post.files,
    counts: { likes: post._count.likes, comments: post._count.comments },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function normalizeTagName(raw: string): string {
  return raw.trim().toLowerCase().replace(/^#+/, '');
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: ListPostsDto,
  ): Promise<{ items: PostView[]; total: number; page: number; limit: number }> {
    const where: Prisma.PostWhereInput = {};
    if (query.mood) where.mood = query.mood;
    if (query.tag) {
      const tagName = normalizeTagName(query.tag);
      where.postTags = { some: { tag: { name: tagName } } };
    }

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: POST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map(toPostView),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: string): Promise<PostView> {
    const post = await this.prisma.post.findUnique({ where: { id }, include: POST_INCLUDE });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }
    return toPostView(post);
  }

  async create(authorId: string, dto: CreatePostDto): Promise<PostView> {
    const tagNames = (dto.tags ?? []).map(normalizeTagName).filter((n) => n.length > 0);
    const uniqueTagNames = Array.from(new Set(tagNames));

    const post = await this.prisma.$transaction(async (tx) => {
      // Upsert tags (auto-create missing)
      const tags = await Promise.all(
        uniqueTagNames.map((name) =>
          tx.tag.upsert({ where: { name }, update: {}, create: { name } }),
        ),
      );

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
    });

    this.logger.log(`Post ${post.id} created by ${authorId}`);
    return toPostView(post);
  }

  async update(id: string, dto: UpdatePostDto): Promise<PostView> {
    // Pre-check existence to surface 404 before transaction work
    const existing = await this.prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const tagsProvided = dto.tags !== undefined;
    const imagesProvided = dto.images !== undefined;
    const filesProvided = dto.files !== undefined;

    const post = await this.prisma.$transaction(async (tx) => {
      if (tagsProvided) {
        const tagNames = (dto.tags ?? []).map(normalizeTagName).filter((n) => n.length > 0);
        const uniqueTagNames = Array.from(new Set(tagNames));
        const tags = await Promise.all(
          uniqueTagNames.map((name) =>
            tx.tag.upsert({ where: { name }, update: {}, create: { name } }),
          ),
        );
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
        },
        include: POST_INCLUDE,
      });
    });

    return toPostView(post);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }
    await this.prisma.post.delete({ where: { id } });
    this.logger.log(`Post ${id} deleted`);
  }
}
