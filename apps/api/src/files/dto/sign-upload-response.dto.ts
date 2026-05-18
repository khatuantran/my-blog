import { ApiProperty } from '@nestjs/swagger';

export class SignedUploadParamsDto {
  @ApiProperty({ example: 'abc123signaturehash' })
  signature!: string;

  @ApiProperty({ example: 1715952000 })
  timestamp!: number;

  @ApiProperty({ example: '123456789012345' })
  apiKey!: string;

  @ApiProperty({ example: 'my-cloud' })
  cloudName!: string;

  @ApiProperty({ example: 'myblog/posts' })
  folder!: string;

  @ApiProperty({ enum: ['image', 'raw'], example: 'image' })
  resourceType!: 'image' | 'raw';

  @ApiProperty({ example: 'post-abc-image-1', nullable: true })
  publicId!: string | null;
}
