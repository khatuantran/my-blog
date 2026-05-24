import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications của current user, filter all|unread, paginated' })
  @ApiResponse({ status: 200 })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListNotificationsDto) {
    return this.notifications.listNotifications(user.sub, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Số notification chưa đọc của current user' })
  @ApiResponse({ status: 200 })
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.getUnreadCount(user.sub);
  }

  // Static route MUST be declared before :id/read to avoid route conflict
  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu tất cả notification của user là đã đọc' })
  @ApiResponse({ status: 200 })
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu 1 notification đã đọc/chưa đọc (self-scope)' })
  @ApiResponse({ status: 200 })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MarkReadDto,
  ) {
    return this.notifications.markRead(user.sub, id, dto.read);
  }

  // Static route MUST be declared before :id to avoid route conflict
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa nhiều notification (self-scope, ids không thuộc user bị skip)' })
  @ApiResponse({ status: 200 })
  deleteBulk(@CurrentUser() user: AuthenticatedUser, @Body() dto: BulkDeleteDto) {
    return this.notifications.deleteBulk(user.sub, dto.ids);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa 1 notification (self-scope)' })
  @ApiResponse({ status: 204 })
  deleteOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.notifications.deleteOne(user.sub, id);
  }
}
