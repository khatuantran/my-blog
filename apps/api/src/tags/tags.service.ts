import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma, type Tag } from '@prisma/client';
import type { CreateTagDto } from './dto/create-tag.dto';
import type { UpdateTagDto } from './dto/update-tag.dto';
import type { ListTagsDto } from './dto/list-tags.dto';

/** Cyberpunk palette per DESIGN_SYSTEM.md > Tag Color Rotation Palette. */
export const TAG_COLORS = [
  '#00FFE5', // cyan
  '#FF6E96', // magenta
  '#BB9AF7', // purple
  '#9ECE6A', // green
  '#E0AF68', // yellow
  '#FF9E64', // orange
  '#7DCFFF', // blue
] as const;

export function normalizeTagName(raw: string): string {
  return raw.trim().toLowerCase().replace(/^#+/, '');
}

/** Subset of Prisma client interface đủ cho upsertMany — work với cả PrismaService lẫn tx. */
type PrismaLike = {
  tag: Pick<PrismaService['tag'], 'upsert' | 'count'>;
};

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  pickColor(index: number): string {
    return TAG_COLORS[index % TAG_COLORS.length];
  }

  async listPopular(query: ListTagsDto): Promise<{
    items: {
      id: string;
      name: string;
      color: string | null;
      description: string | null;
      postCount: number;
      sparkline7d: number[];
      createdAt: string;
    }[];
  }> {
    const orderBy: Prisma.TagOrderByWithRelationInput[] =
      query.sort === 'name'
        ? [{ name: 'asc' }]
        : query.sort === 'recent'
          ? [{ createdAt: 'desc' }, { name: 'asc' }]
          : [{ posts: { _count: 'desc' } }, { name: 'asc' }];

    const where: Prisma.TagWhereInput = query.q
      ? { name: { contains: normalizeTagName(query.q), mode: 'insensitive' } }
      : {};

    const rows = await this.prisma.tag.findMany({
      where,
      take: query.limit,
      include: { _count: { select: { posts: true } } },
      orderBy,
    });

    if (rows.length === 0) return { items: [] };

    // Sparkline7d: count post-with-tag mỗi ngày trong 7 ngày gần đây.
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const windowStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const tagIds = rows.map((t) => t.id);
    const recentPostTags = await this.prisma.postTag.findMany({
      where: {
        tagId: { in: tagIds },
        post: { createdAt: { gte: windowStart } },
      },
      select: { tagId: true, post: { select: { createdAt: true } } },
    });
    const buckets = new Map<string, number[]>(tagIds.map((id) => [id, [0, 0, 0, 0, 0, 0, 0]]));
    for (const pt of recentPostTags) {
      const dayOffset = Math.floor(
        (pt.post.createdAt.getTime() - windowStart.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (dayOffset < 0 || dayOffset > 6) continue;
      const arr = buckets.get(pt.tagId);
      if (arr) arr[dayOffset] += 1;
    }

    return {
      items: rows.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        description: t.description,
        postCount: t._count.posts,
        sparkline7d: buckets.get(t.id) ?? [0, 0, 0, 0, 0, 0, 0],
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  async findById(id: string): Promise<Tag> {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException({ code: 'TAG_NOT_FOUND', message: 'Tag không tồn tại' });
    return tag;
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const name = normalizeTagName(dto.name);
    if (!name) {
      throw new ConflictException({ code: 'INVALID_TAG_NAME', message: 'Tag name không hợp lệ' });
    }
    const existing = await this.prisma.tag.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException({ code: 'DUPLICATE_TAG', message: `Tag '${name}' đã tồn tại` });
    }
    const color = dto.color ?? this.pickColor(await this.prisma.tag.count());
    return this.prisma.tag.create({
      data: { name, color, description: dto.description ?? null },
    });
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    await this.findById(id);
    const data: Prisma.TagUpdateInput = {};
    if (dto.name !== undefined) {
      const name = normalizeTagName(dto.name);
      if (!name) {
        throw new ConflictException({ code: 'INVALID_TAG_NAME', message: 'Tag name không hợp lệ' });
      }
      const dup = await this.prisma.tag.findFirst({ where: { name, NOT: { id } } });
      if (dup) {
        throw new ConflictException({ code: 'DUPLICATE_TAG', message: `Tag '${name}' đã tồn tại` });
      }
      data.name = name;
    }
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.description !== undefined) data.description = dto.description;
    return this.prisma.tag.update({ where: { id }, data });
  }

  async remove(id: string, force = false): Promise<void> {
    await this.findById(id);
    const postCount = await this.prisma.postTag.count({ where: { tagId: id } });
    if (postCount > 0 && !force) {
      throw new ConflictException({
        code: 'TAG_IN_USE',
        message: `Tag đang được dùng bởi ${postCount} post(s) — pass ?force=true để xóa`,
        postCount,
      });
    }
    await this.prisma.tag.delete({ where: { id } });
    this.logger.log(`Tag ${id} deleted (force=${force}, postCount=${postCount})`);
  }

  /**
   * Upsert nhiều tag theo name. Auto-assign color cycle khi tạo mới (KHÔNG đổi color tag đã có).
   * Truyền `tx` (Prisma.TransactionClient) khi gọi trong $transaction để giữ atomicity.
   */
  async upsertMany(rawNames: string[], tx?: PrismaLike): Promise<Tag[]> {
    const client = (tx ?? this.prisma).tag;
    const names = Array.from(new Set(rawNames.map(normalizeTagName).filter((n) => n.length > 0)));
    if (names.length === 0) return [];

    let baseIndex = await client.count();
    const tags: Tag[] = [];
    for (const name of names) {
      const color = this.pickColor(baseIndex);
      const tag = await client.upsert({
        where: { name },
        update: {},
        create: { name, color },
      });
      tags.push(tag);
      baseIndex += 1;
    }
    return tags;
  }
}
