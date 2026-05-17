import { Role } from '@prisma/client';

/** Access token payload — minimum thông tin cho RBAC + audit. */
export interface JwtAccessPayload {
  sub: string; // user.id
  username: string;
  role: Role;
}

/** Refresh token payload — chỉ chứa sub + tokenId (để lookup RefreshToken row). */
export interface JwtRefreshPayload {
  sub: string;
  tid: string; // RefreshToken.id (lookup row → verify hash)
}

export type AuthenticatedUser = JwtAccessPayload;
