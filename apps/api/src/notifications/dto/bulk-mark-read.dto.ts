import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkMarkReadDto {
  @ApiProperty({ type: [String], maxItems: 100 })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids!: string[];
}
