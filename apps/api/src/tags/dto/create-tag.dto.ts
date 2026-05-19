import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'dev', description: 'Tag name (auto-normalize lowercase + strip #)' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({
    example: '#00FFE5',
    description: 'Hex color, auto-assign từ palette nếu thiếu',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ example: 'Lập trình, debugging', maxLength: 280 })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;
}
