import { apiFetch } from './client';
import type { AdminUser, PaginatedUsers } from '@/types/api';

export type ListUsersParams = { page?: number; limit?: number };

export function listUsers(params: ListUsersParams = {}): Promise<PaginatedUsers> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return apiFetch<PaginatedUsers>(`/users${s ? `?${s}` : ''}`);
}

export function banUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${encodeURIComponent(id)}/ban`, { method: 'POST' });
}

export function unbanUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${encodeURIComponent(id)}/unban`, { method: 'POST' });
}
