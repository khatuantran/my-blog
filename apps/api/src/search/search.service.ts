import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import {
  POST_INCLUDE,
  buildReactionMetaMap,
  toPostView,
  type PostView,
  type PostsViewer,
} from '../posts/posts.service';
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

  async search(query: SearchDto, viewer?: PostsViewer): Promise<SearchResult> {
    const viewerUserId = viewer?.userId;
    const q = (query.q ?? '').trim();

    // type=saved requires authed user (T-381, FR-12.9)
    if (query.type === 'saved' && !viewerUserId) {
      throw new UnauthorizedException('Authentication required for saved search');
    }

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

    // type=saved branch — list user's saved posts (ignore q for now, apply mood if set)
    if (query.type === 'saved' && viewerUserId) {
      const postWhere: Prisma.PostWhereInput = {
        savedBy: { some: { userId: viewerUserId } },
      };
      if (query.mood) postWhere.mood = query.mood;
      if (q.length > 0) postWhere.content = { contains: q, mode: 'insensitive' };
      const [rows, total] = await Promise.all([
        this.prisma.post.findMany({
          where: postWhere,
          include: POST_INCLUDE,
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        this.prisma.post.count({ where: postWhere }),
      ]);
      const metaMap = await buildReactionMetaMap(
        this.prisma,
        rows.map((r) => r.id),
        viewer,
      );
      return {
        posts: {
          items: rows.map((r) => toPostView(r, metaMap.get(r.id))),
          total,
          page: query.page,
          limit: query.limit,
        },
        files: [],
        tags: [],
        stats,
      };
    }

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
      const metaMap = await buildReactionMetaMap(
        this.prisma,
        rows.map((r) => r.id),
        viewer,
      );
      posts = {
        items: rows.map((r) => toPostView(r, metaMap.get(r.id))),
        total,
        page: query.page,
        limit: query.limit,
      };
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
