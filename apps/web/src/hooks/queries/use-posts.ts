import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getPost, listPosts } from '@/services/api/posts';
import { qk } from '@/lib/query-keys';
import type { ListPostsParams } from '@/types/api';

const PAGE_SIZE = 10;

export function usePostsInfinite(params: Omit<ListPostsParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: qk.posts.list(params),
    queryFn: ({ pageParam }) =>
      listPosts({ ...params, page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const consumed = last.page * last.limit;
      return consumed < last.total ? last.page + 1 : undefined;
    },
  });
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.posts.detail(id) : ['posts', 'detail', 'noop'],
    queryFn: () => getPost(id as string),
    enabled: !!id,
  });
}
