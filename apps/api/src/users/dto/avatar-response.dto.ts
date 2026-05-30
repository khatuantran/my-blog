import { ApiProperty } from '@nestjs/swagger';

// FR-11.7 — Response shape cho PATCH/DELETE /users/me/avatar
export class AvatarResponseDto {
  @ApiProperty({ nullable: true, example: 'https://res.cloudinary.com/.../avatar.jpg' })
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true, example: 'avatars/u-alice-1234567890' })
  avatarPublicId!: string | null;
}
