import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class SkillItemDto {
  @ApiProperty({ example: 'TypeScript' })
  @IsString()
  @MaxLength(32)
  name!: string;

  @ApiProperty({ example: '#7DCFFF' })
  @IsHexColor()
  color!: string;
}

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

  @ApiPropertyOptional({ example: 'Full-stack Developer', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional({ example: 'Bio markdown...', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Skills array — max 20 items',
    type: [SkillItemDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SkillItemDto)
  skills?: SkillItemDto[];
}
