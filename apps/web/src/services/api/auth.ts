import { apiFetch } from './client';
import type { Role } from '@/types/api';

export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  avatarUrl: string | null;
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
