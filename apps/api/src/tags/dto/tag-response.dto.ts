import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: 'cmpa1tag00010ldmv5j5att' })
  id!: string;

  @ApiProperty({ example: 'dev' })
  name!: string;

  @ApiProperty({ example: '#00FFE5', nullable: true })
  color!: string | null;
}

export class PopularTagDto extends TagResponseDto {
  @ApiProperty({ example: 5 })
  postCount!: number;
}

export class PopularTagsResponseDto {
  @ApiProperty({ type: [PopularTagDto] })
  items!: PopularTagDto[];
}
