import { useQuery } from '@tanstack/react-query';
import { getReactionCounts } from '@/services/api/reactions';
import { qk } from '@/lib/query-keys';
import type { ReactionCountsResponse } from '@/types/api';

export function useReactionCounts(postId: string | undefined, enabled = true) {
  return useQuery<ReactionCountsResponse>({
    queryKey: postId ? qk.posts.reactionCounts(postId) : ['posts', 'reactions', 'counts', 'noop'],
    queryFn: () => getReactionCounts(postId!),
    enabled: !!postId && enabled,
    staleTime: 30_000,
  });
}
