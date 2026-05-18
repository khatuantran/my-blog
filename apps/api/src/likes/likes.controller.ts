import { Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnonymousId } from '../common/decorators/anonymous-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtOptionalAuthGuard } from '../common/guards/jwt-optional-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { ToggleLikeResponseDto } from './dto/toggle-like-response.dto';
import { LikesService } from './likes.service';

@ApiTags('likes')
@Controller()
@Public()
@UseGuards(JwtOptionalAuthGuard)
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @Post('posts/:id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like cho post (optional auth, idempotent)' })
  @ApiResponse({ status: 200, type: ToggleLikeResponseDto })
  togglePost(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @AnonymousId() anonymousId: string | undefined,
  ): Promise<ToggleLikeResponseDto> {
    return this.likes.togglePostLike(id, { userId: user?.sub, anonymousId });
  }

  @Post('comments/:id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like cho comment APPROVED (optional auth, idempotent)' })
  @ApiResponse({ status: 200, type: ToggleLikeResponseDto })
  toggleComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @AnonymousId() anonymousId: string | undefined,
  ): Promise<ToggleLikeResponseDto> {
    return this.likes.toggleCommentLike(id, { userId: user?.sub, anonymousId });
  }
}
