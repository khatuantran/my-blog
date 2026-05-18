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

  @ApiProperty({ example: '2026-05-18T10:00:00.000Z' })
  createdAt!: Date;
}

export class CommentsListResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  items!: CommentResponseDto[];
}
