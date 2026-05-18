import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ListSavedDto } from './dto/list-saved.dto';
import { PaginatedSavedDto, ToggleSaveResponseDto } from './dto/saved-response.dto';
import { SavedService } from './saved.service';

@ApiTags('saved')
@Controller()
@UseGuards(JwtAuthGuard)
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Post('posts/:id/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle bookmark (auth user only, idempotent)' })
  @ApiResponse({ status: 200, type: ToggleSaveResponseDto })
  toggle(
    @Param('id') postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ToggleSaveResponseDto> {
    return this.saved.toggleSave(user.sub, postId);
  }

  @Get('me/saved')
  @ApiOperation({ summary: 'List saved posts của current user (paginated, sort savedAt DESC)' })
  @ApiResponse({ status: 200, type: PaginatedSavedDto })
  list(
    @Query() query: ListSavedDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedSavedDto> {
    return this.saved.listSaved(user.sub, query) as Promise<PaginatedSavedDto>;
  }
}
