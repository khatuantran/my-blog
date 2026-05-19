import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService, TokenPair } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthUserDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { AuthenticatedUser } from './jwt-payload';
import type { RefreshRequestUser } from './strategies/jwt-refresh.strategy';
import type { User } from '@prisma/client';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

function clientMeta(req: Request) {
  return {
    userAgent: req.get('user-agent') ?? undefined,
    ipAddress: req.ip ?? undefined,
  };
}

function setAuthCookies(res: Response, tokens: TokenPair, isProd: boolean) {
  const baseOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    path: '/',
  };
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOpts,
    maxAge: tokens.accessExpiresInSec * 1000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOpts,
    maxAge: tokens.refreshExpiresInSec * 1000,
  });
}

function clearAuthCookies(res: Response, isProd: boolean) {
  const opts = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    path: '/',
  };
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}

function toAuthUser(user: User): AuthUserDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly isProd = process.env.NODE_ENV === 'production';

  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, type: AuthUserDto })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.register(dto);
    setAuthCookies(res, tokens, this.isProd);
    return toAuthUser(user);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username + password' })
  @ApiResponse({ status: 200, type: AuthUserDto })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.login(dto, clientMeta(req));
    setAuthCookies(res, tokens, this.isProd);
    return toAuthUser(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Rotate refresh token + issue new access' })
  @ApiResponse({ status: 200, type: AuthUserDto })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ru = req.user as RefreshRequestUser;
    const { user, tokens } = await this.auth.refresh(
      ru.sub,
      ru.tid,
      ru.refreshToken,
      clientMeta(req),
    );
    setAuthCookies(res, tokens, this.isProd);
    return toAuthUser(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Revoke refresh + clear cookies' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ru = req.user as RefreshRequestUser;
    await this.auth.logout(ru.tid);
    clearAuthCookies(res, this.isProd);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiResponse({ status: 200, type: AuthUserDto })
  async me(@Req() req: Request) {
    const u = req.user as AuthenticatedUser;
    const user = await this.auth.me(u.sub);
    return toAuthUser(user);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({
    summary: 'Change password (FR-11.3) — verify current + revoke other refresh tokens',
  })
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const ru = req.user as RefreshRequestUser;
    await this.auth.changePassword(ru.sub, ru.tid, dto.currentPassword, dto.newPassword);
    return { ok: true };
  }
}
