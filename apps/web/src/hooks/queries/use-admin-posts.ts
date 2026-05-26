import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteAdminPost, listAdminPosts, updateAdminPost } from '@/services/api/admin-posts';
import { qk } from '@/lib/query-keys';
import type { ListAdminPostsParams, UpdateAdminPostPayload } from '@/types/api';

export function useAdminPosts(params: ListAdminPostsParams = {}) {
  return useQuery({
    queryKey: qk.admin.posts(params),
    queryFn: () => listAdminPosts(params),
  });
}

export function useUpdateAdminPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAdminPostPayload }) =>
      updateAdminPost(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeleteAdminPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminPost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
