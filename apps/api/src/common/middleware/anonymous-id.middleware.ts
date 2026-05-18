import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { ANONYMOUS_COOKIE } from '../decorators/anonymous-id.decorator';

const COOKIE_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

/** Issue anonymous session ID cookie nếu chưa có. Format hex `0x7F4A2C` cho UI friendly. */
@Injectable()
export class AnonymousIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    if (!cookies?.[ANONYMOUS_COOKIE]) {
      const id = '0x' + randomBytes(3).toString('hex').toUpperCase();
      res.cookie(ANONYMOUS_COOKIE, id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: COOKIE_TTL_MS,
      });
      // Inject vào req để downstream handler đọc được (cookies object readonly)
      (req as Request & { cookies: Record<string, string> }).cookies = {
        ...cookies,
        [ANONYMOUS_COOKIE]: id,
      };
    }
    next();
  }
}
