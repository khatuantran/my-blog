import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { JwtRefreshPayload } from '../jwt-payload';

const REFRESH_COOKIE = 'refresh_token';

const cookieExtractor = (req: Request): string | null => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[REFRESH_COOKIE] ?? null;
};

export interface RefreshRequestUser {
  sub: string;
  tid: string;
  refreshToken: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload): RefreshRequestUser {
    if (!payload?.sub || !payload?.tid) throw new UnauthorizedException();
    const refreshToken = cookieExtractor(req);
    if (!refreshToken) throw new UnauthorizedException();
    return { sub: payload.sub, tid: payload.tid, refreshToken };
  }
}
