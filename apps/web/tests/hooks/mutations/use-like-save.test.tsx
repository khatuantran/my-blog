import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { useTogglePostLike } from '@/hooks/mutations/use-like';
import { useTogglePostSave } from '@/hooks/mutations/use-save';
import { qk } from '@/lib/query-keys';
import { mswServer } from '../../_helpers/msw-server';
import { makePost } from '../../_helpers/post-factory';
import type { PaginatedPosts, Post } from '@/types/api';

const API = 'http://localhost:3001';

function infinite(items: Post[]): InfiniteData<PaginatedPosts> {
  return {
    pages: [{ items, page: 1, limit: 20, total: items.length }],
    pageParams: [1],
  };
}

describe('useTogglePostLike + useTogglePostSave optimistic flow', () => {
  let qc: QueryClient;
  const post = makePost({
    id: 'p1',
    counts: { likes: 5, comments: 0 },
    liked: false,
    saved: false,
  });

  beforeEach(() => {
    qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    qc.setQueryData(['posts', 'list', { mood: 'ALL' }], infinite([post]));
    qc.setQueryData(qk.posts.detail('p1'), { ...post });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );

  describe('useTogglePostLike', () => {
    it('optimistically patches list + detail then settles on success', async () => {
      mswServer.use(
        http.post(`${API}/posts/p1/like`, () => HttpResponse.json({ liked: true, likes: 6 })),
      );

      const { result } = renderHook(() => useTogglePostLike(), { wrapper });
      act(() => {
        result.current.mutate({ postId: 'p1', currentlyLiked: false });
      });

      // Optimistic immediately
      await waitFor(() => {
        const list = qc.getQueryData<InfiniteData<PaginatedPosts>>([
          'posts',
          'list',
          { mood: 'ALL' },
        ]);
        expect(list?.pages[0].items[0].liked).toBe(true);
        expect(list?.pages[0].items[0].counts.likes).toBe(6);
        const detail = qc.getQueryData<Post>(qk.posts.detail('p1'));
        expect(detail?.liked).toBe(true);
        expect(detail?.counts.likes).toBe(6);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('rolls back list + detail when server returns error', async () => {
      mswServer.use(
        http.post(`${API}/posts/p1/like`, () =>
          HttpResponse.json({ message: 'Internal' }, { status: 500 }),
        ),
      );

      const { result } = renderHook(() => useTogglePostLike(), { wrapper });
      act(() => {
        result.current.mutate({ postId: 'p1', currentlyLiked: false });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      const list = qc.getQueryData<InfiniteData<PaginatedPosts>>([
        'posts',
        'list',
        { mood: 'ALL' },
      ]);
      expect(list?.pages[0].items[0].liked).toBe(false);
      expect(list?.pages[0].items[0].counts.likes).toBe(5);
      const detail = qc.getQueryData<Post>(qk.posts.detail('p1'));
      expect(detail?.liked).toBe(false);
      expect(detail?.counts.likes).toBe(5);
    });
  });

  describe('useTogglePostSave', () => {
    it('optimistically flips saved=true then settles', async () => {
      mswServer.use(http.post(`${API}/posts/p1/save`, () => HttpResponse.json({ saved: true })));

      const { result } = renderHook(() => useTogglePostSave(), { wrapper });
      act(() => {
        result.current.mutate({ postId: 'p1', currentlySaved: false });
      });

      await waitFor(() => {
        const detail = qc.getQueryData<Post>(qk.posts.detail('p1'));
        expect(detail?.saved).toBe(true);
        const list = qc.getQueryData<InfiniteData<PaginatedPosts>>([
          'posts',
          'list',
          { mood: 'ALL' },
        ]);
        expect(list?.pages[0].items[0].saved).toBe(true);
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('rolls back saved flag on 500', async () => {
      mswServer.use(
        http.post(`${API}/posts/p1/save`, () =>
          HttpResponse.json({ message: 'oops' }, { status: 500 }),
        ),
      );

      const { result } = renderHook(() => useTogglePostSave(), { wrapper });
      act(() => {
        result.current.mutate({ postId: 'p1', currentlySaved: false });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      const detail = qc.getQueryData<Post>(qk.posts.detail('p1'));
      expect(detail?.saved).toBe(false);
    });
  });
});
