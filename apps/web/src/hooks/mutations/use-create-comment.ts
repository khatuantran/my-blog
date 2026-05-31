import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment } from '@/services/api/comments';
import { qk } from '@/lib/query-keys';
import type { Comment, CreateCommentDto, PaginatedComments } from '@/types/api';

type Vars = { postId: string; dto: CreateCommentDto };

type Ctx = {
  prev?: PaginatedComments;
  tempId: string;
};

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation<Comment, Error, Vars, Ctx>({
    mutationFn: ({ postId, dto }) => createComment(postId, dto),

    onMutate: async ({ postId, dto }) => {
      await qc.cancelQueries({ queryKey: qk.comments.list(postId) });
      const prev = qc.getQueryData<PaginatedComments>(qk.comments.list(postId));
      const tempId = `temp-${Date.now()}`;
      const optimistic: Comment = {
        id: tempId,
        postId,
        content: dto.content,
        status: 'APPROVED',
        author: null,
        anonymousName: dto.anonymousName ?? null,
        likesCount: 0,
        liked: false,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<PaginatedComments>(qk.comments.list(postId), (curr) => {
        if (!curr) {
          return { items: [optimistic], total: 1, page: 1, limit: 10 };
        }
        // Append (cuối list) cho khớp BE order `createdAt: asc` (mới nhất ở CUỐI) — BUG-026:
        // prepend cũ làm comment mới flash lên đầu rồi nhảy xuống cuối sau refetch.
        return { ...curr, items: [...curr.items, optimistic], total: curr.total + 1 };
      });
      return { prev, tempId };
    },

    onError: (_err, { postId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.comments.list(postId), ctx.prev);
    },

    onSettled: (_data, _err, { postId, dto }) => {
      qc.invalidateQueries({ queryKey: qk.comments.list(postId) });
      qc.invalidateQueries({ queryKey: qk.posts.detail(postId) });
      // Reply: invalidate replies list của parent (FR-03.6)
      if (dto.parentId) {
        qc.invalidateQueries({ queryKey: ['comments', 'replies', dto.parentId] });
      }
    },
  });
}
