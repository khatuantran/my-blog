import { useQuery } from '@tanstack/react-query';
import { listReactions } from '@/services/api/reactions';
import { qk } from '@/lib/query-keys';
import type { ListReactionsParams, ReactionListResponse } from '@/types/api';

export function useReactionList(
  postId: string | undefined,
  params: ListReactionsParams = {},
  enabled = true,
) {
  return useQuery<ReactionListResponse>({
    queryKey: postId
      ? qk.posts.reactionList(postId, params)
      : ['posts', 'reactions', 'list', 'noop'],
    queryFn: () => listReactions(postId!, params),
    enabled: !!postId && enabled,
    staleTime: 30_000,
  });
}
