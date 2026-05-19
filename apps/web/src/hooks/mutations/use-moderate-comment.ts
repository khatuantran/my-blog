import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/services/api/client';
import type { Comment, CommentStatus } from '@/types/api';

export function useUpdateCommentStatus() {
  const qc = useQueryClient();
  return useMutation<Comment, Error, { id: string; status: CommentStatus }>({
    mutationFn: ({ id, status }) =>
      apiFetch<Comment>(`/comments/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'content-type': 'application/json' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiFetch<void>(`/comments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
  });
}
