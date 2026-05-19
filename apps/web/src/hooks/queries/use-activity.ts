import { useInfiniteQuery } from '@tanstack/react-query';
import { listUserActivity } from '@/services/api/activity';
import { qk } from '@/lib/query-keys';
import type { PaginatedActivity } from '@/types/api';

const PAGE_SIZE = 20;

export function useUserActivity(userId: string, enabled: boolean = true) {
  return useInfiniteQuery<PaginatedActivity>({
    queryKey: qk.users.activity(userId, { limit: PAGE_SIZE }),
    queryFn: ({ pageParam }) =>
      listUserActivity(userId, { page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < last.total ? allPages.length + 1 : undefined;
    },
    enabled: enabled && Boolean(userId),
  });
}
