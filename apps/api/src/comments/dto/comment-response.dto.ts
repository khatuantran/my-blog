import { ApiProperty } from '@nestjs/swagger';
import { CommentStatus, Role } from '@prisma/client';

export class CommentAuthorDto {
  @ApiProperty({ example: 'cmpa-user-1' })
  id!: string;

  @ApiProperty({ example: 'kha' })
  username!: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  role!: Role;

  @ApiProperty({ example: 'https://.../avatar.jpg', nullable: true })
  avatarUrl!: string | null;
}

export class CommentResponseDto {
  @ApiProperty({ example: 'cmpa-comment-1' })
  id!: string;

  @ApiProperty({ example: 'cmpa-post-1' })
  postId!: string;

  @ApiProperty({ example: 'Bài hay quá!' })
  content!: string;

  @ApiProperty({ enum: CommentStatus, example: CommentStatus.APPROVED })
  status!: CommentStatus;

  @ApiProperty({ type: CommentAuthorDto, nullable: true, description: 'null nếu anonymous' })
  author!: CommentAuthorDto | null;

  @ApiProperty({ example: 'Khách qua đường', nullable: true })
  anonymousName!: string | null;

  @ApiProperty({ example: 3 })
  likesCount!: number;

  @ApiProperty({ example: 'cmpa-comment-parent', nullable: true })
  parentId!: string | null;

  @ApiProperty({
    example: { username: 'kha', isAnon: false },
    nullable: true,
    description: 'Denormalized parent author info (reply only)',
  })
  replyTo!: { username: string; isAnon: boolean } | null;

  @ApiProperty({ example: '2026-05-18T10:00:00.000Z' })
  createdAt!: Date;
}

export class CommentsListResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  items!: CommentResponseDto[];
}

export class CommentRepliesResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  items!: CommentResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
