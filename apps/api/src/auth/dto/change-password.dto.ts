import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'current-pw', minLength: 5 })
  @IsString()
  @MinLength(5)
  currentPassword!: string;

  @ApiProperty({ example: 'new-pw', minLength: 5 })
  @IsString()
  @MinLength(5)
  newPassword!: string;
}
