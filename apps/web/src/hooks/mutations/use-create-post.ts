import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/services/api/client';
import { qk } from '@/lib/query-keys';
import type { Mood } from '@/lib/mood-config';
import type { FileType } from '@/lib/file-config';
import type { Post } from '@/types/api';

export type CreatePostImageInput = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  order?: number;
};

export type CreatePostFileInput = {
  name: string;
  type: FileType;
  size: number;
  url: string;
  publicId: string;
};

export type CreatePostDto = {
  content: string;
  mood: Mood;
  tags?: string[];
  images?: CreatePostImageInput[];
  files?: CreatePostFileInput[];
};

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation<Post, Error, CreatePostDto>({
    mutationFn: (dto) => apiFetch<Post>('/posts', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}
