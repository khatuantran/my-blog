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
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsDto } from './dto/list-posts.dto';
import { PaginatedPostsDto, PostResponseDto } from './dto/post-response.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List posts (public, paginated, optional mood/tag filter)' })
  @ApiResponse({ status: 200, type: PaginatedPostsDto })
  async list(@Query() query: ListPostsDto): Promise<PaginatedPostsDto> {
    return this.posts.list(query) as Promise<PaginatedPostsDto>;
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get post by id (public)' })
  @ApiResponse({ status: 200, type: PostResponseDto })
  async get(@Param('id') id: string): Promise<PostResponseDto> {
    return this.posts.findById(id) as Promise<PostResponseDto>;
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create post (admin only)' })
  @ApiResponse({ status: 201, type: PostResponseDto })
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<PostResponseDto> {
    return this.posts.create(requester.sub, dto) as Promise<PostResponseDto>;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update post (admin only, partial)' })
  @ApiResponse({ status: 200, type: PostResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdatePostDto): Promise<PostResponseDto> {
    return this.posts.update(id, dto) as Promise<PostResponseDto>;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete post (admin only, hard delete with cascade)' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    await this.posts.remove(id);
  }
}
