import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtOptionalAuthGuard } from '../common/guards/jwt-optional-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { SearchDto } from './dto/search.dto';
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
  async query(@Query() dto: SearchDto, @Req() req: Request) {
    const viewer = req.user as AuthenticatedUser | undefined;
    return this.search.search(dto, viewer?.sub);
  }
}
