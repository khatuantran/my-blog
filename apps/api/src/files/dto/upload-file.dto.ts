import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// Multipart fields kèm file cho POST /files/upload (STORAGE_DRIVER=local).
export class UploadFileDto {
  @ApiProperty({ example: 'myblog/posts' })
  @IsString()
  @MaxLength(120)
  folder!: string;

  @ApiProperty({ enum: ['image', 'raw'], example: 'image' })
  @IsIn(['image', 'raw'])
  resourceType!: 'image' | 'raw';

  @ApiPropertyOptional({ example: 'u-abc-1717000000' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  publicId?: string;
}
