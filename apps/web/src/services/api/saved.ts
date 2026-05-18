import { apiFetch } from './client';
import type { PaginatedPosts, ToggleSaveResponse } from '@/types/api';

export function togglePostSave(postId: string): Promise<ToggleSaveResponse> {
  return apiFetch<ToggleSaveResponse>(`/posts/${encodeURIComponent(postId)}/save`, {
    method: 'POST',
  });
}

export function listSavedPosts(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedPosts> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return apiFetch<PaginatedPosts>(`/me/saved${s ? `?${s}` : ''}`);
}
