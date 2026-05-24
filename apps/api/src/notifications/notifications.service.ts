import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

export interface CreateNotificationInput {
  userId: string;
  actorId: string;
  type: NotificationType;
  targetType: string;
  targetId: string;
  postId?: string;
  metadata?: Record<string, unknown>;
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
}
