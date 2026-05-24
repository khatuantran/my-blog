import { ApiProperty } from '@nestjs/swagger';
import { Mood } from '@prisma/client';

export class MetricBucketDto {
  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ type: [Number], example: [0, 1, 0, 3, 2, 1, 4, 0, 2, 1, 3, 5] })
  sparkline!: number[];

  @ApiProperty({ example: 3, description: 'count today - count yesterday' })
  deltaToday!: number;
}

export class StatsResponseDto {
  @ApiProperty({ type: MetricBucketDto })
  posts!: MetricBucketDto;

  @ApiProperty({ type: MetricBucketDto })
  reactions!: MetricBucketDto;

  @ApiProperty({ type: MetricBucketDto })
  comments!: MetricBucketDto;

  @ApiProperty({ type: MetricBucketDto })
  views!: MetricBucketDto;
}

export class MoodCountDto {
  @ApiProperty({ enum: Mood, example: Mood.HAPPY })
  mood!: Mood;

  @ApiProperty({ example: 5 })
  count!: number;
}

export class MoodsResponseDto {
  @ApiProperty({ type: [MoodCountDto] })
  items!: MoodCountDto[];
}

export class HeatmapDayDto {
  @ApiProperty({ example: '2026-05-18' })
  date!: string;

  @ApiProperty({ example: 3 })
  count!: number;
}

export class HeatmapResponseDto {
  @ApiProperty({ type: [HeatmapDayDto] })
  days!: HeatmapDayDto[];
}
