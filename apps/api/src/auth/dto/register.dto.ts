import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'kha', minLength: 3, maxLength: 32 })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'username chỉ chứa chữ, số, _, -' })
  username!: string;

  @ApiProperty({ example: 'strong-password-123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'kha@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
