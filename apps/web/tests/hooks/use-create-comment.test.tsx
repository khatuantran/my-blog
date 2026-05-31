import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../_helpers/msw-server';
import { useCreateComment } from '@/hooks/mutations/use-create-comment';
import { qk } from '@/lib/query-keys';
import type { Comment, PaginatedComments } from '@/types/api';

const API_URL = 'http://localhost:3001';

function makeComment(id: string, content: string): Comment {
  return {
    id,
    postId: 'p1',
    content,
    status: 'APPROVED',
    author: null,
    anonymousName: 'anon',
    likesCount: 0,
    liked: false,
    createdAt: new Date('2026-05-18T00:00:00.000Z').toISOString(),
  };
}

describe('useCreateComment', () => {
  it('FR-03.7: optimistic comment prepend ĐẦU list (khớp BE order desc — mới nhất ở đầu)', async () => {
    // gcTime mặc định (không 0) để query seeded không bị GC khi không có observer.
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const seeded: PaginatedComments = {
      items: [makeComment('c1', 'first'), makeComment('c2', 'second')],
      total: 2,
      page: 1,
      limit: 10,
    };
    qc.setQueryData(qk.comments.list('p1'), seeded);
    mswServer.use(
      http.post(`${API_URL}/posts/p1/comments`, () =>
        HttpResponse.json({ data: makeComment('c3', 'third') }),
      ),
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateComment(), { wrapper });

    act(() => {
      result.current.mutate({ postId: 'p1', dto: { content: 'third' } });
    });

    // Optimistic: comment mới nằm ĐẦU (index 0), khớp BE desc.
    await waitFor(() => {
      const data = qc.getQueryData<PaginatedComments>(qk.comments.list('p1'));
      expect(data?.items.length).toBe(3);
      expect(data?.items[0].content).toBe('third');
      expect(data?.items[data.items.length - 1].content).toBe('second');
    });
  });
});
