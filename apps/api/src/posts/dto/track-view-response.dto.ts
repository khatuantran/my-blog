import { ApiProperty } from '@nestjs/swagger';

export class TrackViewResponseDto {
  @ApiProperty({ example: 42, description: 'Tổng viewCount sau khi (có thể) increment' })
  viewCount!: number;

  @ApiProperty({
    example: true,
    description: 'true nếu view được tính (record mới); false nếu bị dedup trong 30 phút',
  })
  counted!: boolean;
}
