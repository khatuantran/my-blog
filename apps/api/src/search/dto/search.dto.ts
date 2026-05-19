import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Mood } from '@prisma/client';

export const SEARCH_TYPE_VALUES = ['all', 'posts', 'files', 'tags'] as const;
export type SearchType = (typeof SEARCH_TYPE_VALUES)[number];

export class SearchDto {
  @ApiPropertyOptional({ example: 'cyberpunk', description: 'Search query (empty → stats only)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: SEARCH_TYPE_VALUES, default: 'all' })
  @IsOptional()
  @IsIn(SEARCH_TYPE_VALUES as unknown as string[])
  type: SearchType = 'all';

  @ApiPropertyOptional({ enum: Mood })
  @IsOptional()
  @IsEnum(Mood)
  mood?: Mood;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 10, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit = 10;
}
