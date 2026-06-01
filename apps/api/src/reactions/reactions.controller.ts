import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AnonymousId } from '../common/decorators/anonymous-id.decorator';
import { ClientInfo } from '../common/decorators/client-info.decorator';
import type { ClientInfo as ClientInfoType } from '../common/decorators/client-info.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtOptionalAuthGuard } from '../common/guards/jwt-optional-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { UpsertReactionDto } from './dto/upsert-reaction.dto';
import { ListReactionsDto } from './dto/list-reactions.dto';
import {
  UpsertReactionResponseDto,
  ReactionCountsResponseDto,
  ReactionListResponseDto,
  ToggleResultDto,
} from './dto/reaction-response.dto';
import { ReactionsService } from './reactions.service';
import type {
  ToggleResult,
  UpsertReactionResult,
  ReactionCountsResult,
  ReactionListResult,
} from './reactions.service';

@ApiTags('reactions')
@Controller()
@Public()
@UseGuards(JwtOptionalAuthGuard)
export class ReactionsController {
  constructor(private readonly reactions: ReactionsService) {}

  @Post('posts/:id/reactions')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert reaction cho post (optional auth, idempotent)' })
  @ApiResponse({ status: 200, type: UpsertReactionResponseDto })
  upsertReaction(
    @Param('id') id: string,
    @Body() dto: UpsertReactionDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @AnonymousId() anonymousId: string | undefined,
    @ClientInfo() client: ClientInfoType,
  ): Promise<UpsertReactionResult> {
    return this.reactions.upsertReaction(
      id,
      { userId: user?.sub, anonymousId, role: user?.role, client },
      dto.type,
    );
  }

  @Delete('posts/:id/reactions')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa reaction của actor khỏi post' })
  @ApiResponse({ status: 204 })
  async removeReaction(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @AnonymousId() anonymousId: string | undefined,
  ): Promise<void> {
    return this.reactions.removeReaction(id, { userId: user?.sub, anonymousId });
  }

  @Get('posts/:id/reactions/counts')
  @ApiOperation({
    summary: 'Aggregate reaction counts cho post (public, myReaction nếu có viewer)',
  })
  @ApiResponse({ status: 200, type: ReactionCountsResponseDto })
  getReactionCounts(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @AnonymousId() anonymousId: string | undefined,
  ): Promise<ReactionCountsResult> {
    return this.reactions.getReactionCounts(id, { userId: user?.sub, anonymousId });
  }

  @Get('posts/:id/reactions')
  @ApiOperation({ summary: 'List users đã react, optional filter by type, paginated' })
  @ApiResponse({ status: 200, type: ReactionListResponseDto })
  listReactions(
    @Param('id') id: string,
    @Query() query: ListReactionsDto,
  ): Promise<ReactionListResult> {
    return this.reactions.listReactions(id, query);
  }

  // Legacy endpoint — returns 410 Gone for 1 release window (M11.7)
  @Post('posts/:id/like')
  @HttpCode(410)
  @ApiOperation({ summary: '[DEPRECATED] Use POST /posts/:id/reactions instead' })
  @ApiResponse({ status: 410, description: 'Gone — endpoint replaced by /reactions' })
  legacyLike(): { message: string } {
    return { message: 'use /posts/:id/reactions' };
  }

  @Post('comments/:id/like')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like cho comment APPROVED (binary, optional auth)' })
  @ApiResponse({ status: 200, type: ToggleResultDto })
  toggleCommentLike(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @AnonymousId() anonymousId: string | undefined,
    @ClientInfo() client: ClientInfoType,
  ): Promise<ToggleResult> {
    return this.reactions.toggleCommentLike(id, {
      userId: user?.sub,
      anonymousId,
      role: user?.role,
      client,
    });
  }
}
