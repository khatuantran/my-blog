import { ApiProperty } from '@nestjs/swagger';
import { ActivityTargetType, ActivityType } from '@prisma/client';

export type ActivityDirection = 'OUTGOING' | 'INCOMING';

export class ActivityActorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null;
}

export class ActivityTargetDto {
  @ApiProperty({ enum: ActivityTargetType })
  type!: ActivityTargetType;

  @ApiProperty()
  id!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Truncate 80 chars, null nếu target deleted',
  })
  snippet!: string | null;
}

export class ActivityItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ActivityType })
  type!: ActivityType;

  @ApiProperty({ enum: ['OUTGOING', 'INCOMING'] })
  direction!: ActivityDirection;

  @ApiProperty({ type: ActivityActorDto })
  actor!: ActivityActorDto;

  @ApiProperty({ type: ActivityTargetDto })
  target!: ActivityTargetDto;

  @ApiProperty()
  createdAt!: Date;
}

export class PaginatedActivityDto {
  @ApiProperty({ type: [ActivityItemDto] })
  items!: ActivityItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
