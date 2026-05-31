import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Mood, Prisma, Role, type User } from '@prisma/client';
import { StorageService } from '../files/storage.service';
import type { SignedUploadParams } from '../files/storage.types';
import type { ListUsersDto } from './dto/list-users.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_DAYS = 28;

function startOfDayUtc(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type ProfileStats = {
  postsCount: number;
  likesReceived: number;
  commentsReceived: number;
  viewsTotal: number;
  streak: number;
  heatmap28d: { date: string; count: number }[];
  moodBreakdown: Record<Mood, number>;
  tagsUsed: { name: string; color: string | null; count: number }[];
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(
    query: ListUsersDto,
  ): Promise<{ items: User[]; total: number; page: number; limit: number }> {
    const where = query.role ? { role: query.role } : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User không tồn tại' });
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user)
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User không tồn tại' });
    return user;
  }

  async getStats(id: string): Promise<ProfileStats> {
    await this.findById(id);

    const today = startOfDayUtc(new Date());
    const heatmapStart = new Date(today.getTime() - (HEATMAP_DAYS - 1) * DAY_MS);

    const [
      postsCount,
      likesReceived,
      commentsReceived,
      viewsAgg,
      recentPosts,
      moodGroups,
      tagRows,
    ] = await Promise.all([
      this.prisma.post.count({ where: { authorId: id } }),
      this.prisma.reaction.count({ where: { post: { authorId: id } } }),
      this.prisma.comment.count({ where: { post: { authorId: id } } }),
      this.prisma.post.aggregate({
        where: { authorId: id },
        _sum: { viewCount: true },
      }),
      this.prisma.post.findMany({
        where: { authorId: id, createdAt: { gte: heatmapStart } },
        select: { createdAt: true },
      }),
      this.prisma.post.groupBy({
        by: ['mood'],
        where: { authorId: id },
        _count: true,
      }),
      this.prisma.postTag.findMany({
        where: { post: { authorId: id } },
        select: { tag: { select: { name: true, color: true } } },
      }),
    ]);

    // Heatmap 28d zero-fill
    const heatmapCounts = new Map<string, number>();
    for (const p of recentPosts) {
      const key = isoDate(p.createdAt);
      heatmapCounts.set(key, (heatmapCounts.get(key) ?? 0) + 1);
    }
    const heatmap28d: { date: string; count: number }[] = [];
    for (let i = 0; i < HEATMAP_DAYS; i++) {
      const d = new Date(heatmapStart.getTime() + i * DAY_MS);
      const key = isoDate(d);
      heatmap28d.push({ date: key, count: heatmapCounts.get(key) ?? 0 });
    }

    // Streak: distinct days liên tiếp ngược về quá khứ tính từ today.
    const distinctDays = new Set<string>();
    const allPostsForStreak = await this.prisma.post.findMany({
      where: { authorId: id },
      select: { createdAt: true },
    });
    for (const p of allPostsForStreak) distinctDays.add(isoDate(p.createdAt));
    let streak = 0;
    const cursor = new Date(today);
    while (distinctDays.has(isoDate(cursor))) {
      streak += 1;
      cursor.setTime(cursor.getTime() - DAY_MS);
    }

    // Mood breakdown zero-fill 7 mood
    const moodBreakdown: Record<Mood, number> = {
      [Mood.HAPPY]: 0,
      [Mood.EXCITED]: 0,
      [Mood.THOUGHTFUL]: 0,
      [Mood.CALM]: 0,
      [Mood.SAD]: 0,
      [Mood.GRATEFUL]: 0,
      [Mood.ANGRY]: 0,
    };
    for (const g of moodGroups) {
      moodBreakdown[g.mood] = g._count;
    }

    // Tags used top 8
    const tagCounts = new Map<string, { color: string | null; count: number }>();
    for (const pt of tagRows) {
      const cur = tagCounts.get(pt.tag.name);
      if (cur) cur.count += 1;
      else tagCounts.set(pt.tag.name, { color: pt.tag.color, count: 1 });
    }
    const tagsUsed = [...tagCounts.entries()]
      .map(([name, v]) => ({ name, color: v.color, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      postsCount,
      likesReceived,
      commentsReceived,
      viewsTotal: viewsAgg._sum.viewCount ?? 0,
      streak,
      heatmap28d,
      moodBreakdown,
      tagsUsed,
    };
  }

  async update(
    targetId: string,
    requester: { sub: string; role: Role },
    dto: UpdateUserDto,
  ): Promise<User> {
    const isAdmin = requester.role === Role.ADMIN;
    const isSelf = requester.sub === targetId;
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Chỉ admin hoặc chính chủ mới update được',
      });
    }

    await this.findById(targetId); // 404 nếu không có

    if (dto.email) {
      const emailTaken = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: targetId } },
      });
      if (emailTaken) {
        throw new ForbiddenException({ code: 'EMAIL_TAKEN', message: 'Email đã được dùng' });
      }
    }

    const data: Prisma.UserUpdateInput = {
      email: dto.email,
      avatarUrl: dto.avatarUrl,
    };
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.skills !== undefined) {
      data.skills = dto.skills as unknown as Prisma.InputJsonValue;
    }
    // FR-11.8 contact + identity fields — propagate khi present
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.bornYear !== undefined) data.bornYear = dto.bornYear;
    if (dto.github !== undefined) data.github = dto.github;
    if (dto.website !== undefined) data.website = dto.website;

    return this.prisma.user.update({ where: { id: targetId }, data });
  }

  async ban(targetId: string, requesterId: string): Promise<User> {
    if (targetId === requesterId) {
      throw new ForbiddenException({ code: 'BAN_SELF', message: 'Không thể ban chính mình' });
    }
    const target = await this.findById(targetId);
    if (target.role === Role.ADMIN) {
      throw new ForbiddenException({ code: 'BAN_ADMIN', message: 'Không thể ban admin' });
    }

    // Revoke all active refresh tokens → kick out session
    await this.prisma.refreshToken.updateMany({
      where: { userId: targetId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.warn(`User ${targetId} banned by ${requesterId}`);
    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: Role.BANNED },
    });
  }

  // ── FR-11.7 Avatar upload (3 endpoint) ──────────────────────

  // POST /users/me/avatar/sign — issue Cloudinary signed params cho self.
  // Folder cố định `avatars/`, publicId = `<userId>-<timestamp>` để tránh collision +
  // làm prefix check khi save (chống cross-user PII injection qua publicId).
  getAvatarSignParams(userId: string): SignedUploadParams {
    const timestamp = Math.floor(Date.now() / 1000);
    return this.storage.signUpload({
      folder: 'avatars',
      publicId: `${userId}-${timestamp}`,
      resourceType: 'image',
    });
  }

  // PATCH /users/me/avatar — save URL + publicId sau khi FE upload Cloudinary success.
  // Validate publicId prefix `avatars/<userId>-` để chống user X save avatar publicId của user Y.
  // Cleanup avatarPublicId cũ qua Cloudinary destroy (best-effort, không throw nếu fail).
  async setAvatar(userId: string, url: string, publicId: string): Promise<User> {
    const expectedPrefix = `avatars/${userId}-`;
    if (!publicId.startsWith(expectedPrefix)) {
      throw new BadRequestException({
        code: 'INVALID_AVATAR_PUBLIC_ID',
        message: `publicId phải bắt đầu bằng ${expectedPrefix}`,
      });
    }

    const user = await this.findById(userId);

    // Best-effort cleanup avatar cũ trên Cloudinary
    if (user.avatarPublicId) {
      await this.storage.destroyMany([{ publicId: user.avatarPublicId, resourceType: 'image' }]);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url, avatarPublicId: publicId },
    });
  }

  // DELETE /users/me/avatar — destroy Cloudinary + null 2 field. Idempotent.
  async removeAvatar(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (user.avatarPublicId) {
      await this.storage.destroyMany([{ publicId: user.avatarPublicId, resourceType: 'image' }]);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null, avatarPublicId: null },
    });
  }

  async unban(targetId: string, requesterId: string): Promise<User> {
    const target = await this.findById(targetId);
    if (target.role !== Role.BANNED) {
      throw new ForbiddenException({ code: 'NOT_BANNED', message: 'User không bị ban' });
    }
    this.logger.log(`User ${targetId} unbanned by ${requesterId}`);
    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: Role.USER },
    });
  }
}
