import { apiFetch } from './client';
import type {
  AdminPost,
  ListAdminPostsParams,
  PaginatedAdminPosts,
  UpdateAdminPostPayload,
} from '@/types/api';

export function listAdminPosts(params: ListAdminPostsParams = {}): Promise<PaginatedAdminPosts> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.mood) qs.set('mood', params.mood);
  if (params.sort) qs.set('sort', params.sort);
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return apiFetch<PaginatedAdminPosts>(`/admin/posts${s ? `?${s}` : ''}`);
}

export function updateAdminPost(id: string, body: UpdateAdminPostPayload): Promise<AdminPost> {
  return apiFetch<AdminPost>(`/admin/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteAdminPost(id: string): Promise<void> {
  return apiFetch<void>(`/admin/posts/${id}`, { method: 'DELETE' });
}
