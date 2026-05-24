import { apiFetch } from './client';
import type {
  ListReactionsParams,
  ReactionCountsResponse,
  ReactionListResponse,
  ReactionType,
  UpsertReactionResponse,
} from '@/types/api';

export function upsertReaction(
  postId: string,
  type: ReactionType,
): Promise<UpsertReactionResponse> {
  return apiFetch<UpsertReactionResponse>(`/posts/${encodeURIComponent(postId)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}

export function removeReaction(postId: string): Promise<void> {
  return apiFetch<void>(`/posts/${encodeURIComponent(postId)}/reactions`, { method: 'DELETE' });
}

export function getReactionCounts(postId: string): Promise<ReactionCountsResponse> {
  return apiFetch<ReactionCountsResponse>(`/posts/${encodeURIComponent(postId)}/reactions/counts`);
}

export function listReactions(
  postId: string,
  params: ListReactionsParams = {},
): Promise<ReactionListResponse> {
  const sp = new URLSearchParams();
  if (params.type) sp.set('type', params.type);
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return apiFetch<ReactionListResponse>(
    `/posts/${encodeURIComponent(postId)}/reactions${qs ? `?${qs}` : ''}`,
  );
}
