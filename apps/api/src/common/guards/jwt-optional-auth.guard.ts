import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../../auth/jwt-payload';

/**
 * Try authenticate via JWT cookie. Không throw nếu token thiếu/invalid —
 * req.user sẽ là undefined cho anonymous. Dùng cho endpoints accept cả auth + anon.
 */
@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // ignore — anonymous allowed
    }
    return true;
  }

  handleRequest<TUser = AuthenticatedUser>(_err: unknown, user: TUser | false): TUser | undefined {
    return user ? (user as TUser) : undefined;
  }
}
