import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('meta')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root ping' })
  ping() {
    return this.appService.ping();
  }

  @Get('health')
  @ApiOperation({ summary: 'Liveness health check' })
  health() {
    return this.appService.health();
  }
}
