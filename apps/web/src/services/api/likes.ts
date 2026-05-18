import { apiFetch } from './client';
import type { ToggleLikeResponse } from '@/types/api';

export function togglePostLike(postId: string): Promise<ToggleLikeResponse> {
  return apiFetch<ToggleLikeResponse>(`/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
  });
}

export function toggleCommentLike(commentId: string): Promise<ToggleLikeResponse> {
  return apiFetch<ToggleLikeResponse>(`/comments/${encodeURIComponent(commentId)}/like`, {
    method: 'POST',
  });
}
