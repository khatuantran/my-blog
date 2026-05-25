import { useQuery } from '@tanstack/react-query';
import { listCommentReplies } from '@/services/api/comments';
import { qk } from '@/lib/query-keys';

export function useReplies(
  commentId: string | undefined,
  params: { page?: number; limit?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: commentId ? qk.comments.replies(commentId, params) : ['comments', 'replies', 'noop'],
    queryFn: () => listCommentReplies(commentId as string, params),
    enabled: !!commentId && enabled,
  });
}
