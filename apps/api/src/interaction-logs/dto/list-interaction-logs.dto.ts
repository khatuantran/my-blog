import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { InteractionAction } from '@prisma/client';

export class ListInteractionLogsDto {
  @ApiPropertyOptional({ enum: InteractionAction, description: 'Filter theo loại hành động' })
  @IsOptional()
  @IsEnum(InteractionAction)
  action?: InteractionAction;

  @ApiPropertyOptional({ enum: ['anon', 'user'], description: 'anon = chưa login, user = USER' })
  @IsOptional()
  @IsIn(['anon', 'user'])
  actorType?: 'anon' | 'user';

  @ApiPropertyOptional({ description: 'Tìm trong ip / fingerprint / anonymousId / userAgent' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Từ ngày (ISO 8601) — lọc createdAt >=' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (ISO 8601) — lọc createdAt <=' })
  @IsOptional()
  @IsString()
  to?: string;

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
}
