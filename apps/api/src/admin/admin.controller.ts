import { Controller, Get, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
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

  @Get('heatmap')
  @ApiOperation({ summary: '28-day post creation heatmap' })
  @ApiResponse({ status: 200, type: HeatmapResponseDto })
  heatmap(): Promise<HeatmapResponseDto> {
    return this.admin.getHeatmap();
  }
}
