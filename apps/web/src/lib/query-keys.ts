// Centralized TanStack Query key factory.
// Convention: `[domain, action, ...params]`. Invalidate qua prefix.

import type {
  ListActivityParams,
  ListAdminPostsParams,
  ListInteractionLogsParams,
  ListNotificationsParams,
  ListPostsParams,
  ListReactionsParams,
} from '@/types/api';

export const qk = {
  posts: {
    all: ['posts'] as const,
    list: (params: ListPostsParams = {}) => ['posts', 'list', params] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    reactionCounts: (id: string) => ['posts', 'reactions', 'counts', id] as const,
    reactionList: (id: string, params: ListReactionsParams = {}) =>
      ['posts', 'reactions', 'list', id, params] as const,
  },
  comments: {
    list: (postId: string) => ['comments', 'list', postId] as const,
    replies: (commentId: string, params: { page?: number; limit?: number } = {}) =>
      ['comments', 'replies', commentId, params] as const,
  },
  saved: {
    all: ['saved'] as const,
    list: (params: { page?: number; limit?: number } = {}) => ['saved', 'list', params] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params: { page?: number; limit?: number } = {}) => ['users', 'list', params] as const,
    byUsername: (username: string) => ['users', 'by-username', username] as const,
    stats: (id: string) => ['users', 'stats', id] as const,
    activity: (id: string, params: ListActivityParams = {}) =>
      ['users', 'activity', id, params] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
    moods: ['admin', 'moods'] as const,
    heatmap: ['admin', 'heatmap'] as const,
    comments: (params: { status?: string; page?: number; limit?: number } = {}) =>
      ['admin', 'comments', params] as const,
    posts: (params: ListAdminPostsParams = {}) => ['admin', 'posts', params] as const,
    logs: (params: ListInteractionLogsParams = {}) => ['admin', 'logs', params] as const,
  },
  tags: {
    all: ['tags'] as const,
    list: (params: { sort?: string; q?: string; limit?: number } = {}) =>
      ['tags', 'list', params] as const,
  },
  search: (params: { q?: string; type?: string; mood?: string } = {}) =>
    ['search', params] as const,
  notifications: {
    all: ['notifications'] as const,
    list: (params: ListNotificationsParams = {}) => ['notifications', 'list', params] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
};
