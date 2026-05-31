import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

/** Network/device context của request — cho interaction trace log (FR-18). */
export interface ClientInfo {
  ip?: string;
  userAgent?: string;
  acceptLanguage?: string;
  referer?: string;
  /** Raw X-Forwarded-For chain (lần ngược proxy khi `ip` bị NAT). */
  xForwardedFor?: string;
}

/**
 * Extract client info (IP, user-agent, accept-language, referer) từ request.
 * `req.ip` chính xác khi `trust proxy` đã bật (main.ts) — lấy IP thật sau Fly.io.
 */
export const ClientInfo = createParamDecorator((_: unknown, ctx: ExecutionContext): ClientInfo => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const xff = req.headers['x-forwarded-for'];
  return {
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
    acceptLanguage: req.get('accept-language') ?? undefined,
    referer: req.get('referer') ?? undefined,
    xForwardedFor: Array.isArray(xff) ? xff.join(', ') : (xff ?? undefined),
  };
});
