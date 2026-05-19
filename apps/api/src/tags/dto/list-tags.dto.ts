import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const TAG_SORT_VALUES = ['name', 'posts', 'recent'] as const;
export type TagSort = (typeof TAG_SORT_VALUES)[number];

export class ListTagsDto {
  @ApiPropertyOptional({ example: 20, default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: TAG_SORT_VALUES, default: 'posts' })
  @IsOptional()
  @IsIn(TAG_SORT_VALUES as unknown as string[])
  sort: TagSort = 'posts';

  @ApiPropertyOptional({ example: 'cod', description: 'Substring filter on tag name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  q?: string;
}
