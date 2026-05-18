import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { POST_INCLUDE, toPostView, type PostView } from '../posts/posts.service';
import type { ListSavedDto } from './dto/list-saved.dto';

export interface SavedPostView extends PostView {
  savedAt: Date;
}

@Injectable()
export class SavedService {
  private readonly logger = new Logger(SavedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async toggleSave(userId: string, postId: string): Promise<{ saved: boolean }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post không tồn tại' });
    }

    const existing = await this.prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { userId: true },
    });

    if (existing) {
      await this.prisma.savedPost.delete({ where: { userId_postId: { userId, postId } } });
      this.logger.log(`Saved removed user=${userId} post=${postId}`);
      return { saved: false };
    }
    await this.prisma.savedPost.create({ data: { userId, postId } });
    this.logger.log(`Saved created user=${userId} post=${postId}`);
    return { saved: true };
  }

  async listSaved(
    userId: string,
    query: ListSavedDto,
  ): Promise<{ items: SavedPostView[]; total: number; page: number; limit: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.savedPost.findMany({
        where: { userId },
        include: { post: { include: POST_INCLUDE } },
        orderBy: { savedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.savedPost.count({ where: { userId } }),
    ]);

    return {
      items: rows.map((r) => ({ ...toPostView(r.post), savedAt: r.savedAt })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
