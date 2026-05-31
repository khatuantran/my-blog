import { apiFetch } from './client';
import type { ListInteractionLogsParams, PaginatedInteractionLogs } from '@/types/api';

// FR-18.4: admin trace log list.
export function listInteractionLogs(
  params: ListInteractionLogsParams = {},
): Promise<PaginatedInteractionLogs> {
  const qs = new URLSearchParams();
  if (params.action) qs.set('action', params.action);
  if (params.actorType) qs.set('actorType', params.actorType);
  if (params.q) qs.set('q', params.q);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return apiFetch<PaginatedInteractionLogs>(`/admin/interaction-logs${s ? `?${s}` : ''}`);
}
