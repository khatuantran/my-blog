import { apiFetch } from './client';
import type { ToggleLikeResponse } from '@/types/api';

// Comment-like is still binary (FR-16 only multi-reaction posts).
export function toggleCommentLike(commentId: string): Promise<ToggleLikeResponse> {
  return apiFetch<ToggleLikeResponse>(`/comments/${encodeURIComponent(commentId)}/like`, {
    method: 'POST',
  });
}
