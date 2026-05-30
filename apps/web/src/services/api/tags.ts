import { apiFetch } from './client';
import type {
  CreateTagPayload,
  ListTagsParams,
  ListTagsResponse,
  Tag,
  UpdateTagPayload,
} from '@/types/api';

export function listTags(params: ListTagsParams = {}): Promise<ListTagsResponse> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.sort) qs.set('sort', params.sort);
  if (params.q) qs.set('q', params.q);
  const s = qs.toString();
  return apiFetch<ListTagsResponse>(`/tags${s ? `?${s}` : ''}`);
}

export function createTag(body: CreateTagPayload): Promise<Tag> {
  // Content-Type do client.doFetch set (BUG-014: KHÔNG pass lại để tránh doubled header).
  return apiFetch<Tag>('/tags', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateTag(id: string, body: UpdateTagPayload): Promise<Tag> {
  return apiFetch<Tag>(`/tags/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteTag(id: string, force = false): Promise<void> {
  const path = force
    ? `/tags/${encodeURIComponent(id)}?force=true`
    : `/tags/${encodeURIComponent(id)}`;
  return apiFetch<void>(path, { method: 'DELETE' });
}
