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
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { AnonymousId } from '../common/decorators/anonymous-id.decorator';
import { ClientInfo } from '../common/decorators/client-info.decorator';
import type { ClientInfo as ClientInfoType } from '../common/decorators/client-info.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtOptionalAuthGuard } from '../common/guards/jwt-optional-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CommentsService } from './comments.service';
import {
  CommentRepliesResponseDto,
  CommentResponseDto,
  CommentsListResponseDto,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListRepliesDto } from './dto/list-replies.dto';
import { UpdateCommentStatusDto } from './dto/update-status.dto';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('posts/:id/comments')
  @Public()
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({
    summary: 'List comments (public role-aware: USER chỉ APPROVED, admin tất cả status)',
  })
  @ApiResponse({ status: 200, type: CommentsListResponseDto })
  list(
    @Param('id') postId: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<CommentsListResponseDto> {
    return this.comments.list(postId, user?.role);
  }

  @Post('posts/:id/comments')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Create comment (optional auth, default status APPROVED)' })
  @ApiResponse({ status: 201, type: CommentResponseDto })
  create(
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @AnonymousId() anonymousId: string | undefined,
    @ClientInfo() client: ClientInfoType,
  ): Promise<CommentResponseDto> {
    return this.comments.create(
      postId,
      { userId: user?.sub, anonymousId, role: user?.role, client },
      dto,
    );
  }

  @Get('comments/:id/replies')
  @Public()
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({
    summary: 'List replies of a comment (FR-03.6, paginated, role-aware status filter)',
  })
  @ApiResponse({ status: 200, type: CommentRepliesResponseDto })
  listReplies(
    @Param('id') id: string,
    @Query() query: ListRepliesDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<CommentRepliesResponseDto> {
    return this.comments.listReplies(id, query.page, query.limit, user?.role);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment (admin only, cascade CommentLike)' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    await this.comments.remove(id);
  }

  @Patch('comments/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Moderate status (admin only) — APPROVED | REJECTED' })
  @ApiResponse({ status: 200, type: CommentResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCommentStatusDto,
  ): Promise<CommentResponseDto> {
    return this.comments.updateStatus(id, dto.status);
  }
}
