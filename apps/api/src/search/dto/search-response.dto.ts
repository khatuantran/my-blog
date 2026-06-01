import { ApiProperty } from '@nestjs/swagger';
import { PaginatedPostsDto } from '../../posts/dto/post-response.dto';

export class SearchStatsDto {
  @ApiProperty({ example: 12 }) totalPosts!: number;
  @ApiProperty({ example: 7 }) withImages!: number;
  @ApiProperty({ example: 3 }) withFiles!: number;
  @ApiProperty({ example: 5 }) savedCount!: number;
}

export class SearchFileDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'report.pdf' }) name!: string;
  @ApiProperty() postId!: string;
  @ApiProperty({ example: 'PDF' }) type!: string;
}

export class SearchTagDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: '#travel' }) name!: string;
  @ApiProperty({ nullable: true, example: '#00FFE5' }) color!: string | null;
}

export class SearchResponseDto {
  @ApiProperty({ type: PaginatedPostsDto })
  posts!: PaginatedPostsDto;

  @ApiProperty({ type: SearchFileDto, isArray: true })
  files!: SearchFileDto[];

  @ApiProperty({ type: SearchTagDto, isArray: true })
  tags!: SearchTagDto[];

  @ApiProperty({ type: SearchStatsDto })
  stats!: SearchStatsDto;
}
