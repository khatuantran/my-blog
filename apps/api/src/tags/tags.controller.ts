import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role, type Tag } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTagDto } from './dto/create-tag.dto';
import { ListTagsDto } from './dto/list-tags.dto';
import { PopularTagsResponseDto, TagResponseDto } from './dto/tag-response.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

function toTagResponse(tag: Tag): TagResponseDto {
  return { id: tag.id, name: tag.name, color: tag.color, description: tag.description };
}

@ApiTags('tags')
@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List popular tags (public, top N by postCount DESC)' })
  @ApiResponse({ status: 200, type: PopularTagsResponseDto })
  list(@Query() query: ListTagsDto): Promise<PopularTagsResponseDto> {
    return this.tags.listPopular(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create tag (admin only) — auto-assign color nếu thiếu' })
  @ApiResponse({ status: 201, type: TagResponseDto })
  async create(@Body() dto: CreateTagDto): Promise<TagResponseDto> {
    return toTagResponse(await this.tags.create(dto));
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update tag (admin only)' })
  @ApiResponse({ status: 200, type: TagResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto): Promise<TagResponseDto> {
    return toTagResponse(await this.tags.update(id, dto));
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete tag (admin only). ?force=true để xóa khi tag đang được dùng',
  })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Query('force') force?: string): Promise<void> {
    await this.tags.remove(id, force === 'true');
  }
}
