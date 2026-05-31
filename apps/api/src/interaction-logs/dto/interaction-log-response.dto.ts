import { ApiProperty } from '@nestjs/swagger';
import { InteractionAction, InteractionTargetType, Role } from '@prisma/client';

export class InteractionLogActorDto {
  @ApiProperty({ example: 'usr_abc' })
  id!: string;

  @ApiProperty({ example: 'alice' })
  username!: string;
}

export class InteractionLogResponseDto {
  @ApiProperty({ example: 'log_abc' })
  id!: string;

  @ApiProperty({ enum: InteractionAction })
  action!: InteractionAction;

  @ApiProperty({ enum: InteractionTargetType })
  targetType!: InteractionTargetType;

  @ApiProperty({ example: 'post_abc' })
  targetId!: string;

  @ApiProperty({ example: 'post_abc', nullable: true })
  postId!: string | null;

  @ApiProperty({ type: InteractionLogActorDto, nullable: true, description: 'null = anonymous' })
  actor!: InteractionLogActorDto | null;

  @ApiProperty({ enum: Role, nullable: true, description: 'null = anonymous' })
  actorRole!: Role | null;

  @ApiProperty({ example: '0x7F4A2C', nullable: true })
  anonymousId!: string | null;

  @ApiProperty({ example: '203.0.113.7', nullable: true })
  ip!: string | null;

  @ApiProperty({ example: 'Mozilla/5.0 ...', nullable: true })
  userAgent!: string | null;

  @ApiProperty({ example: 'Chrome 120.0.0.0', nullable: true })
  browser!: string | null;

  @ApiProperty({ example: 'macOS 10.15.7', nullable: true })
  os!: string | null;

  @ApiProperty({ example: 'desktop', nullable: true })
  device!: string | null;

  @ApiProperty({ example: 'vi-VN', nullable: true })
  acceptLang!: string | null;

  @ApiProperty({ example: 'http://localhost:5173/', nullable: true })
  referer!: string | null;

  @ApiProperty({ example: 'a1b2c3d4e5f6a7b8', nullable: true })
  fingerprint!: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-05-31T10:00:00.000Z' })
  createdAt!: Date;
}

export class InteractionLogsListResponseDto {
  @ApiProperty({ type: [InteractionLogResponseDto] })
  items!: InteractionLogResponseDto[];

  @ApiProperty({ example: 128 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
