import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: 'cmpa1tag00010ldmv5j5att' })
  id!: string;

  @ApiProperty({ example: 'dev' })
  name!: string;

  @ApiProperty({ example: '#00FFE5', nullable: true })
  color!: string | null;

  @ApiPropertyOptional({ example: 'Lập trình, debugging', nullable: true })
  description?: string | null;
}

export class PopularTagDto extends TagResponseDto {
  @ApiProperty({ example: 5 })
  postCount!: number;

  @ApiProperty({ example: [0, 1, 2, 1, 0, 3, 1], description: 'Last 7 days post-with-tag count' })
  sparkline7d!: number[];

  @ApiProperty({ example: '2026-05-19T00:00:00.000Z' })
  createdAt!: string;
}

export class PopularTagsResponseDto {
  @ApiProperty({ type: [PopularTagDto] })
  items!: PopularTagDto[];
}
