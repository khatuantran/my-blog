import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { POST_INCLUDE, toPostView, type PostView } from '../posts/posts.service';
import type { SearchDto } from './dto/search.dto';

export type SearchStats = {
  totalPosts: number;
  withImages: number;
  withFiles: number;
  savedCount: number;
};

export type SearchResult = {
  posts: { items: PostView[]; total: number; page: number; limit: number };
  files: { id: string; name: string; postId: string; type: string }[];
  tags: { id: string; name: string; color: string | null }[];
  stats: SearchStats;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchDto, viewerUserId?: string): Promise<SearchResult> {
    const q = (query.q ?? '').trim();
    const includePosts = query.type === 'all' || query.type === 'posts';
    const includeFiles = query.type === 'all' || query.type === 'files';
    const includeTags = query.type === 'all' || query.type === 'tags';

    // Stats — always computed (toàn cục).
    const [totalPosts, withImages, withFiles, savedCount] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.count({ where: { images: { some: {} } } }),
      this.prisma.post.count({ where: { files: { some: {} } } }),
      viewerUserId
        ? this.prisma.savedPost.count({ where: { userId: viewerUserId } })
        : Promise.resolve(0),
    ]);
    const stats: SearchStats = { totalPosts, withImages, withFiles, savedCount };

    // Empty query → empty result + stats only
    if (q.length === 0) {
      return {
        posts: { items: [], total: 0, page: query.page, limit: query.limit },
        files: [],
        tags: [],
        stats,
      };
    }

    const qStripped = q.replace(/^#+/, '');

    // Posts: ILIKE on content + mood filter optional
    let posts: SearchResult['posts'] = {
      items: [],
      total: 0,
      page: query.page,
      limit: query.limit,
    };
    if (includePosts) {
      const where: Prisma.PostWhereInput = {
        content: { contains: q, mode: 'insensitive' },
      };
      if (query.mood) where.mood = query.mood;
      const [rows, total] = await Promise.all([
        this.prisma.post.findMany({
          where,
          include: POST_INCLUDE,
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        this.prisma.post.count({ where }),
      ]);
      posts = { items: rows.map(toPostView), total, page: query.page, limit: query.limit };
    }

    // Files: ILIKE on name
    let files: SearchResult['files'] = [];
    if (includeFiles) {
      const rows = await this.prisma.file.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true, postId: true, type: true },
        take: 20,
      });
      files = rows.map((f) => ({ id: f.id, name: f.name, postId: f.postId, type: f.type }));
    }

    // Tags: ILIKE on name (strip #)
    let tags: SearchResult['tags'] = [];
    if (includeTags) {
      const rows = await this.prisma.tag.findMany({
        where: { name: { contains: qStripped, mode: 'insensitive' } },
        select: { id: true, name: true, color: true },
        take: 20,
      });
      tags = rows;
    }

    return { posts, files, tags, stats };
  }
}
