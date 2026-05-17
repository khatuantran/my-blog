import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  ping() {
    return { message: 'MyBlog API 🚀' };
  }

  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
