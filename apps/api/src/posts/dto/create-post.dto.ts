import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FileType, Mood } from '@prisma/client';

export class ImageInputDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/.../img.jpg' })
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  url!: string;

  @ApiProperty({ example: 'myblog/posts/abc123' })
  @IsString()
  @MaxLength(200)
  publicId!: string;

  @ApiProperty({ example: 1920 })
  @IsInt()
  @Min(1)
  width!: number;

  @ApiProperty({ example: 1080 })
  @IsInt()
  @Min(1)
  height!: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class FileInputDto {
  @ApiProperty({ example: 'report.pdf' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: FileType, example: FileType.PDF })
  @IsEnum(FileType)
  type!: FileType;

  @ApiProperty({ example: 102400 })
  @IsInt()
  @Min(0)
  size!: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../report.pdf' })
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  url!: string;

  @ApiProperty({ example: 'myblog/files/report-xyz' })
  @IsString()
  @MaxLength(200)
  publicId!: string;
}

export class CreatePostDto {
  @ApiProperty({ example: 'Hôm nay code rất vui...' })
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  content!: string;

  @ApiProperty({ enum: Mood, example: Mood.HAPPY })
  @IsEnum(Mood)
  mood!: Mood;

  @ApiPropertyOptional({
    type: [String],
    example: ['#dev', '#life'],
    description: 'Tag names (with or without # prefix). Auto-create if not exists.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [ImageInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ImageInputDto)
  images?: ImageInputDto[];

  @ApiPropertyOptional({ type: [FileInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FileInputDto)
  files?: FileInputDto[];
}
