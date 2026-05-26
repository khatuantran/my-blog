import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from '../comments/comments.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PostsService } from '../posts/posts.service';
import { AdminService } from './admin.service';
import { HeatmapResponseDto, MoodsResponseDto, StatsResponseDto } from './dto/admin-response.dto';
import { ListAdminCommentsDto } from './dto/list-admin-comments.dto';
import { ListAdminPostsDto } from './dto/list-admin-posts.dto';
import { UpdateAdminPostDto } from './dto/update-admin-post.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly comments: CommentsService,
    private readonly posts: PostsService,
  ) {}

  /** Test-only endpoint: truncate + reseed admin/user. Gated by env ALLOW_TEST_RESET=1. */
  @Public()
  @Roles()
  @Post('test-reset')
  @ApiOperation({ summary: 'Reset DB + reseed test fixtures (E2E only, env-gated)' })
  async testReset(): Promise<{ ok: true; users: string[] }> {
    if (process.env.ALLOW_TEST_RESET !== '1') {
      throw new NotFoundException();
    }
    return this.admin.resetForE2E();
  }

  @Get('stats')
  @ApiOperation({ summary: '4 metrics aggregation + 12-day sparkline + delta today' })
  @ApiResponse({ status: 200, type: StatsResponseDto })
  stats(): Promise<StatsResponseDto> {
    return this.admin.getStats();
  }

  @Get('moods')
  @ApiOperation({ summary: 'Mood distribution zero-filled 7 moods' })
  @ApiResponse({ status: 200, type: MoodsResponseDto })
  moods(): Promise<MoodsResponseDto> {
    return this.admin.getMoodDistribution();
  }

  @Get('comments')
  @ApiOperation({ summary: 'Cross-post comment moderation queue (FR-07.4)' })
  listComments(@Query() q: ListAdminCommentsDto) {
    return this.comments.listForAdmin(q.status, q.page, q.limit);
  }

  @Get('heatmap')
  @ApiOperation({ summary: '28-day post creation heatmap' })
  @ApiResponse({ status: 200, type: HeatmapResponseDto })
  heatmap(): Promise<HeatmapResponseDto> {
    return this.admin.getHeatmap();
  }

  @Get('posts')
  @ApiOperation({ summary: 'List all posts (any status) with filters' })
  listPosts(@Query() q: ListAdminPostsDto) {
    return this.posts.adminList(q);
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: 'Update post content/mood/status/tags' })
  updatePost(@Param('id') id: string, @Body() dto: UpdateAdminPostDto) {
    return this.posts.update(id, dto);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete post + Cloudinary assets' })
  async deletePost(@Param('id') id: string): Promise<void> {
    return this.posts.remove(id);
  }
}
