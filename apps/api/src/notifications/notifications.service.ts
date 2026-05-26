import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import type { ListNotificationsDto } from './dto/list-notifications.dto';

export interface CreateNotificationInput {
  userId: string;
  actorId: string;
  type: NotificationType;
  targetType: string;
  targetId: string;
  postId?: string;
  metadata?: Record<string, unknown>;
}

const ACTOR_SELECT = { id: true, username: true, avatarUrl: true } as const;

type NotificationWithActor = Prisma.NotificationGetPayload<{
  include: { actor: { select: typeof ACTOR_SELECT } };
}>;

function toItem(n: NotificationWithActor) {
  return {
    id: n.id,
    type: n.type,
    actor: n.actor
      ? { id: n.actor.id, username: n.actor.username, avatarUrl: n.actor.avatarUrl }
      : null,
    targetType: n.targetType,
    targetId: n.targetId,
    postId: n.postId,
    read: n.read,
    metadata: n.metadata,
    createdAt: n.createdAt,
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNotification(input: CreateNotificationInput): Promise<void> {
    if (input.actorId === input.userId) return;

    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId,
        type: input.type,
        targetType: input.targetType,
        targetId: input.targetId,
        postId: input.postId ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    this.logger.log(`Notification ${input.type} → user ${input.userId}`);
  }

  async listNotifications(userId: string, query: ListNotificationsDto) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.filter === 'unread' ? { read: false } : {}),
    };

    const [rows, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: { actor: { select: ACTOR_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { items: rows.map(toItem), total, page: query.page, limit: query.limit, unreadCount };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }

  async markRead(userId: string, notificationId: string, read: boolean) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });
    if (!notification) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Notification không tồn tại',
      });
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException({
        code: 'NOTIFICATION_FORBIDDEN',
        message: 'Không có quyền truy cập notification này',
      });
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read },
      select: { id: true, read: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }

  async deleteOne(userId: string, notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });
    if (!notification) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Notification không tồn tại',
      });
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException({
        code: 'NOTIFICATION_FORBIDDEN',
        message: 'Không có quyền xóa notification này',
      });
    }

    await this.prisma.notification.delete({ where: { id: notificationId } });
  }

  async deleteBulk(userId: string, ids: string[]) {
    const result = await this.prisma.notification.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return { deleted: result.count };
  }

  async bulkMarkRead(userId: string, ids: string[]) {
    const result = await this.prisma.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { read: true },
    });
    return { updated: result.count };
  }

  async deleteAll(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return { deleted: result.count };
  }
}
