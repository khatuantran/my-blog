import { ApiProperty } from '@nestjs/swagger';

export class ToggleLikeResponseDto {
  @ApiProperty({ example: true, description: 'Trạng thái sau toggle' })
  liked!: boolean;

  @ApiProperty({ example: 5, description: 'Tổng số like của post/comment sau toggle' })
  count!: number;
}
