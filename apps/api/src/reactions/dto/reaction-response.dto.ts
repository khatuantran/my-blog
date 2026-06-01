import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '@prisma/client';

/** Count per reaction type (Record<ReactionType, number>). */
export class ReactionCountsMapDto {
  @ApiProperty({ example: 5 }) LIKE!: number;
  @ApiProperty({ example: 2 }) LOVE!: number;
  @ApiProperty({ example: 0 }) HAHA!: number;
  @ApiProperty({ example: 1 }) WOW!: number;
  @ApiProperty({ example: 0 }) SAD!: number;
  @ApiProperty({ example: 0 }) ANGRY!: number;
}

export class UpsertReactionResponseDto {
  @ApiProperty({ enum: ReactionType, example: ReactionType.LOVE })
  type!: ReactionType;

  @ApiProperty({ type: ReactionCountsMapDto })
  totalCounts!: ReactionCountsMapDto;

  @ApiProperty({
    enum: ReactionType,
    isArray: true,
    example: [ReactionType.LIKE, ReactionType.LOVE],
  })
  topThree!: ReactionType[];
}

export class ReactionCountsResponseDto {
  @ApiProperty({ type: ReactionCountsMapDto })
  totalCounts!: ReactionCountsMapDto;

  @ApiProperty({ enum: ReactionType, isArray: true })
  topThree!: ReactionType[];

  @ApiProperty({ example: 8 })
  total!: number;

  @ApiProperty({ enum: ReactionType, nullable: true, example: ReactionType.LIKE })
  myReaction!: ReactionType | null;
}

export class ReactionActorDto {
  @ApiProperty({ example: 'clx0a1b2c3d4e5f6g7h8i9j0' }) id!: string;
  @ApiProperty({ example: 'alice' }) username!: string;
  @ApiProperty({ nullable: true, example: null }) avatarUrl!: string | null;
}

export class ReactionListItemDto {
  @ApiProperty({ type: ReactionActorDto, nullable: true })
  actor!: ReactionActorDto | null;

  @ApiProperty({ enum: ReactionType })
  type!: ReactionType;

  @ApiProperty({ example: '2026-05-30T12:00:00.000Z' })
  createdAt!: Date;
}

export class ReactionListResponseDto {
  @ApiProperty({ type: ReactionListItemDto, isArray: true })
  items!: ReactionListItemDto[];

  @ApiProperty({ example: 8 }) total!: number;
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;

  @ApiProperty({ type: ReactionCountsMapDto })
  byType!: ReactionCountsMapDto;
}

/** Binary comment-like toggle result. */
export class ToggleResultDto {
  @ApiProperty({ example: true }) liked!: boolean;
  @ApiProperty({ example: 3 }) count!: number;
}
