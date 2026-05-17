import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'nestjs-prisma';
import bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';
import type { User } from '@prisma/client';
import type { JwtAccessPayload, JwtRefreshPayload } from './jwt-payload';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

const BCRYPT_COST = 10;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresInSec: number;
  refreshExpiresInSec: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; tokens: TokenPair }> {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing)
      throw new ConflictException({ code: 'USERNAME_TAKEN', message: 'Username đã tồn tại' });

    if (dto.email) {
      const emailTaken = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailTaken)
        throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'Email đã tồn tại' });
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email ?? null,
        passwordHash,
        role: 'USER',
      },
    });

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user)
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Username hoặc password sai',
      });

    if (user.role === 'BANNED') {
      throw new UnauthorizedException({ code: 'USER_BANNED', message: 'Tài khoản đã bị ban' });
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid)
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Username hoặc password sai',
      });

    const tokens = await this.issueTokens(user, meta);
    return { user, tokens };
  }

  /** Verify refresh token → rotate (revoke old + issue new). */
  async refresh(
    sub: string,
    tid: string,
    rawRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ user: User; tokens: TokenPair }> {
    const record = await this.prisma.refreshToken.findUnique({ where: { id: tid } });
    if (!record || record.userId !== sub)
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH',
        message: 'Refresh token không hợp lệ',
      });
    if (record.revokedAt)
      throw new UnauthorizedException({
        code: 'REFRESH_REVOKED',
        message: 'Refresh token đã bị revoke',
      });
    if (record.expiresAt < new Date())
      throw new UnauthorizedException({
        code: 'REFRESH_EXPIRED',
        message: 'Refresh token hết hạn',
      });

    const expectedHash = hashToken(rawRefreshToken);
    if (record.tokenHash !== expectedHash) {
      // Token mismatch — possible reuse attack. Revoke entire family.
      this.logger.warn(`Refresh token mismatch for user ${sub} — revoking all`);
      await this.prisma.refreshToken.updateMany({
        where: { userId: sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({
        code: 'REFRESH_REUSE',
        message: 'Refresh token bị compromise — đã revoke',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: sub } });
    if (!user || user.role === 'BANNED')
      throw new UnauthorizedException({ code: 'USER_INVALID', message: 'User không hợp lệ' });

    // Revoke old + issue new (rotation)
    await this.prisma.refreshToken.update({
      where: { id: tid },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(user, meta);
    return { user, tokens };
  }

  async logout(tid: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tid },
      data: { revokedAt: new Date() },
    });
  }

  async me(sub: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: sub } });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async issueTokens(
    user: User,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<TokenPair> {
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL', '30d');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(accessPayload, { expiresIn: accessTtl });

    // Create RefreshToken row first → embed its id (tid) in refresh JWT
    const tid = randomUUID();
    const rawRefresh = randomUUID() + '.' + randomUUID();
    const refreshPayload: JwtRefreshPayload = { sub: user.id, tid };
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshTtl,
    });

    const expiresAt = new Date(Date.now() + parseTtlMs(refreshTtl));
    await this.prisma.refreshToken.create({
      data: {
        id: tid,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
      },
    });

    // Mark rawRefresh as used to satisfy lint (kept for future composite token strategy)
    void rawRefresh;

    return {
      accessToken,
      refreshToken,
      accessExpiresInSec: Math.floor(parseTtlMs(accessTtl) / 1000),
      refreshExpiresInSec: Math.floor(parseTtlMs(refreshTtl) / 1000),
    };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Parse JWT-style TTL ('15m', '30d', '1h', '30s') → milliseconds. */
function parseTtlMs(ttl: string): number {
  const match = /^(\d+)([smhdw])$/.exec(ttl);
  if (!match) throw new Error(`Invalid TTL: ${ttl}`);
  const n = Number(match[1]);
  const unit = match[2];
  const mult: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  return n * mult[unit];
}
