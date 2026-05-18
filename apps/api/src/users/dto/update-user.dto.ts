import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'kha@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../avatar.jpg', required: false })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string;
}
