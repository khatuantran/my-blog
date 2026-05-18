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
    items: { id: string; name: string; color: string | null; postCount: number }[];
  }> {
    const rows = await this.prisma.tag.findMany({
      take: query.limit,
      include: { _count: { select: { posts: true } } },
      orderBy: [{ posts: { _count: 'desc' } }, { name: 'asc' }],
    });
    return {
      items: rows.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        postCount: t._count.posts,
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
    return this.prisma.tag.create({ data: { name, color } });
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
    return this.prisma.tag.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.tag.delete({ where: { id } });
    this.logger.log(`Tag ${id} deleted`);
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
