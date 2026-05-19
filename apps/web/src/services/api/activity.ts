import { apiFetch } from './client';
import type { ListActivityParams, PaginatedActivity } from '@/types/api';

export function listUserActivity(
  userId: string,
  params: ListActivityParams = {},
): Promise<PaginatedActivity> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return apiFetch<PaginatedActivity>(
    `/users/${encodeURIComponent(userId)}/activity${s ? `?${s}` : ''}`,
  );
}
