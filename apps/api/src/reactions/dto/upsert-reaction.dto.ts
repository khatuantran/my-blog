import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReactionType } from '@prisma/client';

export class UpsertReactionDto {
  @ApiProperty({ enum: ReactionType, example: 'LOVE', description: 'Kiểu reaction' })
  @IsEnum(ReactionType)
  type!: ReactionType;
}
