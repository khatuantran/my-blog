import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { HeatmapResponseDto, MoodsResponseDto, StatsResponseDto } from './dto/admin-response.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

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

  @Get('heatmap')
  @ApiOperation({ summary: '28-day post creation heatmap' })
  @ApiResponse({ status: 200, type: HeatmapResponseDto })
  heatmap(): Promise<HeatmapResponseDto> {
    return this.admin.getHeatmap();
  }
}
