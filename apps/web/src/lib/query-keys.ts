// Centralized TanStack Query key factory.
// Convention: `[domain, action, ...params]`. Invalidate qua prefix.

import type { ListPostsParams } from '@/types/api';

export const qk = {
  posts: {
    all: ['posts'] as const,
    list: (params: ListPostsParams = {}) => ['posts', 'list', params] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
  },
  comments: {
    list: (postId: string) => ['comments', 'list', postId] as const,
  },
  saved: {
    all: ['saved'] as const,
    list: (params: { page?: number; limit?: number } = {}) => ['saved', 'list', params] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params: { page?: number; limit?: number } = {}) => ['users', 'list', params] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
    moods: ['admin', 'moods'] as const,
    heatmap: ['admin', 'heatmap'] as const,
    comments: (params: { status?: string; page?: number; limit?: number } = {}) =>
      ['admin', 'comments', params] as const,
  },
};
