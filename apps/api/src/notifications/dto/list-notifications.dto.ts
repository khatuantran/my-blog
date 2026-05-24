import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type NotificationFilter = 'all' | 'unread';

export class ListNotificationsDto {
  @ApiPropertyOptional({ enum: ['all', 'unread'], default: 'all' })
  @IsOptional()
  @IsEnum(['all', 'unread'])
  filter: NotificationFilter = 'all';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
