import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { CommentStatus } from '@prisma/client';

export type ModeratableStatus = typeof CommentStatus.APPROVED | typeof CommentStatus.REJECTED;

export class UpdateCommentStatusDto {
  @ApiProperty({
    enum: [CommentStatus.APPROVED, CommentStatus.REJECTED],
    example: CommentStatus.APPROVED,
    description: 'PENDING không cho phép via PATCH — chỉ APPROVED | REJECTED',
  })
  @IsIn([CommentStatus.APPROVED, CommentStatus.REJECTED])
  status!: ModeratableStatus;
}
