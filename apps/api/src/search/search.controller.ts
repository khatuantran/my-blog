import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AnonymousId } from '../common/decorators/anonymous-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtOptionalAuthGuard } from '../common/guards/jwt-optional-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { SearchDto } from './dto/search.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtOptionalAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Get()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Full-text search Postgres ILIKE multi-table (FR-12.1)' })
  @ApiResponse({ status: 200, type: SearchResponseDto })
  async query(
    @Query() dto: SearchDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @AnonymousId() anonymousId: string | undefined,
  ) {
    return this.search.search(dto, { userId: user?.sub, anonymousId });
  }
}
