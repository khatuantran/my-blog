import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

export const ANONYMOUS_COOKIE = 'anon_id';

/** Extract anonymous session ID từ cookie (issued bởi AnonymousIdMiddleware). */
export const AnonymousId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.[ANONYMOUS_COOKIE];
  },
);
