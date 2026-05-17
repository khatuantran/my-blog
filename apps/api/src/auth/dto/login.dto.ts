import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'kha' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  username!: string;

  @ApiProperty({ example: 'strong-password-123' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
