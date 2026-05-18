// Test factory cho Post objects. Reuse trong tất cả MSW handlers + render tests.

import type { Post, PaginatedPosts } from '@/types/api';

export function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    content: 'Hello world',
    mood: 'HAPPY',
    viewCount: 0,
    author: {
      id: 'u-admin',
      username: 'admin',
      role: 'ADMIN',
      avatarUrl: null,
    },
    tags: [],
    images: [],
    files: [],
    counts: { likes: 0, comments: 0 },
    createdAt: '2026-05-18T12:00:00.000Z',
    updatedAt: '2026-05-18T12:00:00.000Z',
    ...overrides,
  };
}

export function makePaginatedPosts(
  items: Post[],
  overrides: Partial<Omit<PaginatedPosts, 'items'>> = {},
): PaginatedPosts {
  return {
    items,
    total: items.length,
    page: 1,
    limit: 10,
    ...overrides,
  };
}
