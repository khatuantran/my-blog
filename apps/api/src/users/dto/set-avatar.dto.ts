import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

// FR-11.7 — User upload avatar lên Cloudinary trực tiếp (signed),
// rồi PATCH endpoint này để save url + publicId vào User.
export class SetAvatarDto {
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v1234567890/avatars/u-alice-1234.jpg',
    description: 'Cloudinary secure_url returned từ direct upload',
  })
  @IsString()
  @MaxLength(500)
  @Matches(/^https:\/\/res\.cloudinary\.com\//, {
    message: 'url phải bắt đầu bằng https://res.cloudinary.com/',
  })
  url!: string;

  @ApiProperty({
    example: 'avatars/u-alice-1234567890',
    description: 'Cloudinary publicId (folder avatars/ + userId prefix). Server validate prefix.',
  })
  @IsString()
  @MaxLength(200)
  @Matches(/^avatars\//, {
    message: 'publicId phải bắt đầu bằng avatars/',
  })
  publicId!: string;
}
