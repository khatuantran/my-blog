import { useMutation } from '@tanstack/react-query';
import { toggleCommentLike } from '@/services/api/likes';
import type { ToggleLikeResponse } from '@/types/api';

// Simple comment-like mutation. CommentItem giữ local optimistic state,
// nên không cần cache-touching ở đây.
export function useToggleCommentLike() {
  return useMutation<ToggleLikeResponse, Error, { commentId: string }>({
    mutationFn: ({ commentId }) => toggleCommentLike(commentId),
  });
}
