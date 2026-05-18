import { ApiProperty } from '@nestjs/swagger';
import { PostResponseDto } from '../../posts/dto/post-response.dto';

export class ToggleSaveResponseDto {
  @ApiProperty({ example: true, description: 'Trạng thái bookmark sau toggle' })
  saved!: boolean;
}

export class SavedPostDto extends PostResponseDto {
  @ApiProperty({ example: '2026-05-18T10:00:00.000Z', description: 'Thời điểm save bài' })
  savedAt!: Date;
}

export class PaginatedSavedDto {
  @ApiProperty({ type: [SavedPostDto] })
  items!: SavedPostDto[];

  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;
}
