import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { togglePostSave } from '@/services/api/saved';
import { qk } from '@/lib/query-keys';
import type { PaginatedPosts, Post, ToggleSaveResponse } from '@/types/api';

type Ctx = {
  prevDetail?: Post;
  prevLists: [readonly unknown[], InfiniteData<PaginatedPosts> | undefined][];
};

export function useTogglePostSave() {
  const qc = useQueryClient();
  return useMutation<ToggleSaveResponse, Error, { postId: string; currentlySaved: boolean }, Ctx>({
    mutationFn: ({ postId }) => togglePostSave(postId),

    onMutate: async ({ postId, currentlySaved }) => {
      await qc.cancelQueries({ queryKey: qk.posts.all });
      const saved = !currentlySaved;

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
            items: page.items.map((p) => (p.id === postId ? { ...p, saved } : p)),
          })),
        });
      }

      const prevDetail = qc.getQueryData<Post>(qk.posts.detail(postId));
      if (prevDetail) {
        qc.setQueryData<Post>(qk.posts.detail(postId), { ...prevDetail, saved });
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
      qc.invalidateQueries({ queryKey: qk.saved.all });
    },
  });
}
