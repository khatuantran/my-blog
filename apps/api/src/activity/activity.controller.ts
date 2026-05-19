import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { ActivityService } from './activity.service';
import { ListActivityDto } from './dto/list-activity.dto';
import { PaginatedActivityDto } from './dto/activity-response.dto';

@ApiTags('users')
@Controller('users/:id/activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(
    private readonly activity: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Activity timeline hybrid (FR-13) — self/admin only' })
  @ApiResponse({ status: 200, type: PaginatedActivityDto })
  async list(
    @Param('id') id: string,
    @Query() query: ListActivityDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<PaginatedActivityDto> {
    if (viewer.sub !== id && viewer.role !== Role.ADMIN) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Activity is private' });
    }
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
    }
    return this.activity.listForUser(id, query.page, query.limit);
  }
}
