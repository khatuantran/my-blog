import { apiFetch } from './client';
import type { SearchParams, SearchResult } from '@/types/api';

export function searchAll(params: SearchParams = {}): Promise<SearchResult> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.type && params.type !== 'all') qs.set('type', params.type);
  if (params.mood) qs.set('mood', params.mood);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return apiFetch<SearchResult>(`/search${s ? `?${s}` : ''}`);
}
