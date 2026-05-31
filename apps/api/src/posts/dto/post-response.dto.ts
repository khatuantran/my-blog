import { ApiProperty } from '@nestjs/swagger';
import { FileType, Mood, ReactionType, Role } from '@prisma/client';

export class PostAuthorDto {
  @ApiProperty({ example: 'cmpa14i8t000010ldmv5j5att' })
  id!: string;

  @ApiProperty({ example: 'kha' })
  username!: string;

  @ApiProperty({ example: 'Kha Tran', nullable: true, description: 'Display name (FR-11.8)' })
  name!: string | null;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role!: Role;

  @ApiProperty({ example: 'https://...avatar.jpg', nullable: true })
  avatarUrl!: string | null;
}

export class PostTagDto {
  @ApiProperty({ example: 'cmpa1tg00000010ldmv5j5att' })
  id!: string;

  @ApiProperty({ example: 'dev' })
  name!: string;

  @ApiProperty({ example: '#7AF7FF', nullable: true })
  color!: string | null;
}

export class PostImageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  publicId!: string;

  @ApiProperty({ example: 1920 })
  width!: number;

  @ApiProperty({ example: 1080 })
  height!: number;

  @ApiProperty({ example: 0 })
  order!: number;
}

export class PostFileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: FileType })
  type!: FileType;

  @ApiProperty({ example: 102400 })
  size!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  publicId!: string;
}

export class PostCountsDto {
  @ApiProperty({ example: 5 })
  reactions!: number;

  @ApiProperty({ example: 3 })
  comments!: number;
}

export class PostResponseDto {
  @ApiProperty({ example: 'cmpa1post00010ldmv5j5att' })
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: Mood })
  mood!: Mood;

  @ApiProperty({ example: 0 })
  viewCount!: number;

  @ApiProperty({ type: PostAuthorDto })
  author!: PostAuthorDto;

  @ApiProperty({ type: [PostTagDto] })
  tags!: PostTagDto[];

  @ApiProperty({ type: [PostImageDto] })
  images!: PostImageDto[];

  @ApiProperty({ type: [PostFileDto] })
  files!: PostFileDto[];

  @ApiProperty({ type: PostCountsDto })
  counts!: PostCountsDto;

  @ApiProperty({
    enum: ReactionType,
    isArray: true,
    description: 'Top 3 reaction types by count (desc). Empty if no reactions.',
    example: ['LIKE', 'LOVE', 'HAHA'],
  })
  topReactions!: ReactionType[];

  @ApiProperty({
    enum: ReactionType,
    nullable: true,
    description: 'Viewer reaction on this post; null if no viewer or not reacted.',
    example: 'LIKE',
  })
  myReaction!: ReactionType | null;

  @ApiProperty({ example: '2026-05-17T16:59:32.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-17T16:59:32.000Z' })
  updatedAt!: Date;
}

export class PaginatedPostsDto {
  @ApiProperty({ type: [PostResponseDto] })
  items!: PostResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;
}
