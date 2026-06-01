import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationActorDto {
  @ApiProperty({ example: 'clx0a1b2c3d4e5f6g7h8i9j0' }) id!: string;
  @ApiProperty({ example: 'alice' }) username!: string;
  @ApiProperty({ nullable: true, example: null }) avatarUrl!: string | null;
}

export class NotificationItemDto {
  @ApiProperty() id!: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.REACTION })
  type!: NotificationType;

  @ApiProperty({ type: NotificationActorDto, nullable: true })
  actor!: NotificationActorDto | null;

  @ApiProperty({ example: 'POST', description: 'POST | COMMENT (polymorphic)' })
  targetType!: string;

  @ApiProperty() targetId!: string;

  @ApiProperty({ nullable: true, description: 'Denorm post id cho fast nav' })
  postId!: string | null;

  @ApiProperty({ example: false }) read!: boolean;

  @ApiProperty({ nullable: true, type: Object, example: { reactionType: 'LOVE' } })
  metadata!: unknown;

  @ApiProperty({ example: '2026-05-30T12:00:00.000Z' })
  createdAt!: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: NotificationItemDto, isArray: true })
  items!: NotificationItemDto[];

  @ApiProperty({ example: 42 }) total!: number;
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 5, description: 'Tổng số chưa đọc của user' }) unreadCount!: number;
}

export class UnreadCountResponseDto {
  @ApiProperty({ example: 3 }) count!: number;
}

/** PATCH /:id/read → updated notification (id + read state). */
export class MarkReadResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: true }) read!: boolean;
}

/** mark-all-read / bulk-read → số row updated. */
export class UpdatedCountResponseDto {
  @ApiProperty({ example: 5 }) updated!: number;
}

/** delete all / bulk → số row deleted. */
export class DeletedCountResponseDto {
  @ApiProperty({ example: 5 }) deleted!: number;
}
