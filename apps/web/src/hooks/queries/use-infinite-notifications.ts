import { useInfiniteQuery } from '@tanstack/react-query';
import { listNotifications } from '@/services/api/notifications';
import { qk } from '@/lib/query-keys';

export function useInfiniteNotifications(params: { filter?: 'all' | 'unread' } = {}) {
  return useInfiniteQuery({
    queryKey: qk.notifications.list(params),
    queryFn: ({ pageParam = 1 }) =>
      listNotifications({
        filter: params.filter,
        page: pageParam as number,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const loaded = (last.page - 1) * last.limit + last.items.length;
      return loaded < last.total ? last.page + 1 : undefined;
    },
  });
}
