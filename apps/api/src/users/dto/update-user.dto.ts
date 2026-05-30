import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
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

  // FR-11.8 contact + identity fields. github/website KHÔNG strict IsUrl (cho phép
  // handle dạng `myname` hoặc full URL). bornYear range 1900-currentYear.
  @ApiPropertyOptional({ example: 'Kha Tran', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;

  @ApiPropertyOptional({ example: 1995, minimum: 1900 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  bornYear?: number;

  @ApiPropertyOptional({ example: 'khatran', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  github?: string;

  @ApiPropertyOptional({ example: 'https://kha.dev', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
