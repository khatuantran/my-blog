import { apiFetch } from './client';
import type { ListPostsParams, PaginatedPosts, Post, TrackViewResponse } from '@/types/api';

function toQuery(params: ListPostsParams): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.mood) qs.set('mood', params.mood);
  if (params.tag) qs.set('tag', params.tag);
  if (params.sort && params.sort !== 'latest') qs.set('sort', params.sort);
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export function listPosts(params: ListPostsParams = {}): Promise<PaginatedPosts> {
  return apiFetch<PaginatedPosts>(`/posts${toQuery(params)}`);
}

export function getPost(id: string): Promise<Post> {
  return apiFetch<Post>(`/posts/${encodeURIComponent(id)}`);
}

export function trackPostView(id: string): Promise<TrackViewResponse> {
  return apiFetch<TrackViewResponse>(`/posts/${encodeURIComponent(id)}/view`, {
    method: 'POST',
  });
}
