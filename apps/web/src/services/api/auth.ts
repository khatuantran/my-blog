import { apiFetch } from './client';
import type { Role } from '@/types/api';

// FR-11.8 — Expand từ 6 → 15 fields (avatarPublicId, title, bio, skills + 5 contact).
// FE useAuth() consumer (ProfileAvatar hero / AvatarMenu / EditProfileDrawer prefill)
// có đủ profile data 1 query thay phải fetch /users/by-username riêng cho viewer-self case.
export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  avatarUrl: string | null;
  avatarPublicId?: string | null;
  title?: string | null;
  bio?: string | null;
  skills?: { name: string; color: string }[];
  name?: string | null;
  location?: string | null;
  bornYear?: number | null;
  github?: string | null;
  website?: string | null;
  createdAt: string;
};

export type LoginDto = {
  username: string;
  password: string;
};

export type RegisterDto = {
  username: string;
  password: string;
  email?: string;
};

export function login(dto: LoginDto): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify(dto) });
}

export function register(dto: RegisterDto): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify(dto) });
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me');
}

export function refresh(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/refresh', { method: 'POST', skipRefresh: true });
}
