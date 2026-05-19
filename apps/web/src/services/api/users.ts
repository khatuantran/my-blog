import { apiFetch } from './client';
import type {
  AdminUser,
  PaginatedUsers,
  ProfileStats,
  ProfileUser,
  UpdateUserPayload,
} from '@/types/api';

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

export function getUserByUsername(username: string): Promise<ProfileUser> {
  return apiFetch<ProfileUser>(`/users/by-username/${encodeURIComponent(username)}`);
}

export function getUserStats(id: string): Promise<ProfileStats> {
  return apiFetch<ProfileStats>(`/users/${encodeURIComponent(id)}/stats`);
}

export function updateUser(id: string, body: UpdateUserPayload): Promise<ProfileUser> {
  return apiFetch<ProfileUser>(`/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

export function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}
