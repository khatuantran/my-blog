import { useQuery } from '@tanstack/react-query';
import { listPostComments } from '@/services/api/comments';
import { qk } from '@/lib/query-keys';

export function usePostComments(postId: string | undefined) {
  return useQuery({
    queryKey: postId ? qk.comments.list(postId) : ['comments', 'list', 'noop'],
    queryFn: () => listPostComments(postId as string),
    enabled: !!postId,
  });
}
