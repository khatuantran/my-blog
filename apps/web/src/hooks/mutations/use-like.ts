import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { togglePostLike } from '@/services/api/likes';
import { qk } from '@/lib/query-keys';
import type { PaginatedPosts, Post, ToggleLikeResponse } from '@/types/api';

type Ctx = {
  prevDetail?: Post;
  prevLists: [readonly unknown[], InfiniteData<PaginatedPosts> | undefined][];
};

function patchPost(p: Post, delta: number, liked: boolean): Post {
  return { ...p, liked, counts: { ...p.counts, likes: Math.max(0, p.counts.likes + delta) } };
}

export function useTogglePostLike() {
  const qc = useQueryClient();
  return useMutation<ToggleLikeResponse, Error, { postId: string; currentlyLiked: boolean }, Ctx>({
    mutationFn: ({ postId }) => togglePostLike(postId),

    onMutate: async ({ postId, currentlyLiked }) => {
      await qc.cancelQueries({ queryKey: qk.posts.all });

      const delta = currentlyLiked ? -1 : 1;
      const liked = !currentlyLiked;

      // Snapshot + patch infinite list caches (every variant)
      const prevLists: Ctx['prevLists'] = [];
      const listEntries = qc.getQueriesData<InfiniteData<PaginatedPosts>>({
        queryKey: ['posts', 'list'],
      });
      for (const [key, data] of listEntries) {
        prevLists.push([key, data]);
        if (!data) continue;
        qc.setQueryData<InfiniteData<PaginatedPosts>>(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((p) => (p.id === postId ? patchPost(p, delta, liked) : p)),
          })),
        });
      }

      // Patch detail cache
      const prevDetail = qc.getQueryData<Post>(qk.posts.detail(postId));
      if (prevDetail) {
        qc.setQueryData<Post>(qk.posts.detail(postId), patchPost(prevDetail, delta, liked));
      }

      return { prevDetail, prevLists };
    },

    onError: (_err, { postId }, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.prevLists) {
        qc.setQueryData(key, data);
      }
      if (ctx.prevDetail) {
        qc.setQueryData(qk.posts.detail(postId), ctx.prevDetail);
      }
    },

    onSettled: (_data, _err, { postId }) => {
      qc.invalidateQueries({ queryKey: qk.posts.detail(postId) });
      qc.invalidateQueries({ queryKey: ['posts', 'list'] });
    },
  });
}
