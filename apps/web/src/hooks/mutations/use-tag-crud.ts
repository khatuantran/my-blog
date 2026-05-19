import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTag, deleteTag, updateTag } from '@/services/api/tags';
import type { CreateTagPayload, Tag, UpdateTagPayload } from '@/types/api';

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation<Tag, Error, CreateTagPayload>({
    mutationFn: (body) => createTag(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation<Tag, Error, { id: string; body: UpdateTagPayload }>({
    mutationFn: ({ id, body }) => updateTag(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; force?: boolean }>({
    mutationFn: ({ id, force }) => deleteTag(id, force),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
