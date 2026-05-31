import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/services/api/client';
import { qk } from '@/lib/query-keys';
import type { Post } from '@/types/api';
import type { CreatePostDto } from './use-create-post';

export type UpdatePostDto = CreatePostDto & { id: string };

// useUpdatePost — PATCH /posts/:id (admin edit full post: content/mood/tags/images/files).
// BE replace (không merge) images/files/tags. Dùng cho CreatePostPage edit mode (?edit=<id>).
export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation<Post, Error, UpdatePostDto>({
    mutationFn: ({ id, ...dto }) =>
      apiFetch<Post>(`/posts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    onSuccess: (_post, { id }) => {
      qc.invalidateQueries({ queryKey: qk.posts.all });
      qc.invalidateQueries({ queryKey: qk.posts.detail(id) });
    },
  });
}
