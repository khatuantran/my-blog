import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Bài viết rất hay!', minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({
    example: 'Khách qua đường',
    description: 'Tên hiển thị cho anonymous (ignored nếu auth)',
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  anonymousName?: string;

  @ApiPropertyOptional({
    example: 'cmpa-comment-1',
    description: 'Parent comment id để reply (FR-03.6, depth 1 only)',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
