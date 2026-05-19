import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Mood } from '@prisma/client';

export const POST_SORT_VALUES = ['latest', 'oldest', 'likes'] as const;
export type PostSort = (typeof POST_SORT_VALUES)[number];

export class ListPostsDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 10, default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  @ApiPropertyOptional({ enum: Mood })
  @IsOptional()
  @IsEnum(Mood)
  mood?: Mood;

  @ApiPropertyOptional({ example: 'dev', description: 'Tag name (with or without # prefix)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;

  @ApiPropertyOptional({ enum: POST_SORT_VALUES, default: 'latest' })
  @IsOptional()
  @IsIn(POST_SORT_VALUES as unknown as string[])
  sort: PostSort = 'latest';
}
