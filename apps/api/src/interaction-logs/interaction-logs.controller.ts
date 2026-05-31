import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { InteractionLogService } from './interaction-logs.service';
import { ListInteractionLogsDto } from './dto/list-interaction-logs.dto';
import { InteractionLogsListResponseDto } from './dto/interaction-log-response.dto';

// FR-18.4: admin truy vết interaction non-admin. Admin-only.
@ApiTags('admin')
@Controller('admin/interaction-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class InteractionLogsController {
  constructor(private readonly interactionLogs: InteractionLogService) {}

  @Get()
  @ApiOperation({ summary: 'List interaction trace logs (admin, paginated + filter)' })
  @ApiResponse({ status: 200, type: InteractionLogsListResponseDto })
  list(@Query() query: ListInteractionLogsDto): Promise<InteractionLogsListResponseDto> {
    return this.interactionLogs.adminList(query);
  }
}
