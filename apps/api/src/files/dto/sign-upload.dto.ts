import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { CloudinaryResourceType } from '../cloudinary.service';

export class SignUploadDto {
  @ApiPropertyOptional({
    example: 'myblog/posts',
    description: 'Cloudinary folder (default: myblog)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  folder?: string;

  @ApiPropertyOptional({ example: 'post-abc-image-1', description: 'Optional public_id override' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  publicId?: string;

  @ApiProperty({
    enum: ['image', 'raw'],
    example: 'image',
    description: 'image cho PNG/JPG/WebP, raw cho PDF/DOC/...',
  })
  @IsIn(['image', 'raw'])
  resourceType!: CloudinaryResourceType;
}
