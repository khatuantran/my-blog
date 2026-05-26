import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Mood, PostStatus } from '@prisma/client';
import { POST_SORT_VALUES, PostSort } from '../../posts/dto/list-posts.dto';

export class ListAdminPostsDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: PostStatus })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ enum: Mood })
  @IsOptional()
  @IsEnum(Mood)
  mood?: Mood;

  @ApiPropertyOptional({ enum: POST_SORT_VALUES, default: 'latest' })
  @IsOptional()
  @IsIn(POST_SORT_VALUES as unknown as string[])
  sort: PostSort = 'latest';

  @ApiPropertyOptional({ example: 'hello world', description: 'Full-text search in content' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
