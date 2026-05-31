import { describe, expect, it, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { routes } from '@/routes';
import { mswServer } from '../_helpers/msw-server';
import { createTestQueryClient } from '../_helpers/query-client';
import { makePost, makePaginatedPosts } from '../_helpers/post-factory';

const API_URL = 'http://localhost:3001';

function renderAt(path: string) {
  const router = createMemoryRouter(routes as RouteObject[], { initialEntries: [path] });
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <Suspense fallback={<div>loading…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mswServer.use(
    http.get(`${API_URL}/posts`, () => HttpResponse.json({ data: makePaginatedPosts([]) })),
    http.get(`${API_URL}/posts/:id/comments`, () =>
      HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 10 } }),
    ),
  );
});

describe('PostDetailPage', () => {
  it('renders post detail từ GET /posts/:id thành công', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/abc123`, () =>
        HttpResponse.json({
          data: makePost({
            id: 'abc123',
            content: 'detail body',
            counts: { reactions: 24, comments: 5 },
            viewCount: 142,
            tags: [{ id: 't1', name: 'code', color: '#00FFE5' }],
          }),
        }),
      ),
      http.post(`${API_URL}/posts/abc123/view`, () =>
        HttpResponse.json({ data: { viewCount: 143, counted: true } }),
      ),
    );

    renderAt('/post/abc123');

    expect(await screen.findByText('detail body')).toBeInTheDocument();
    // Breadcrumb chứa short id, StatusBar cũng có nên dùng findAll
    expect(screen.getAllByText(/~\/post\/abc123/).length).toBeGreaterThan(0);
    // MetaPanel
    expect(screen.getByText('// post.meta')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    // Comments header — split spans (design L419: ❯ cyan + // comments white + [N] muted)
    expect(screen.getByText('// comments')).toBeInTheDocument();
    expect(screen.getByText('[5]')).toBeInTheDocument();
  });

  it('comment form đặt SAU comment list (FR-03.7: add comment ở cuối section)', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/abc123`, () =>
        HttpResponse.json({
          data: makePost({ id: 'abc123', counts: { reactions: 0, comments: 2 } }),
        }),
      ),
      http.post(`${API_URL}/posts/abc123/view`, () =>
        HttpResponse.json({ data: { viewCount: 1, counted: true } }),
      ),
      http.get(`${API_URL}/posts/abc123/comments`, () =>
        HttpResponse.json({
          data: {
            items: [
              {
                id: 'c1',
                postId: 'abc123',
                content: 'a comment body',
                status: 'APPROVED',
                author: { id: 'u1', username: 'user1', role: 'USER', avatarUrl: null },
                anonymousName: null,
                likesCount: 0,
                liked: false,
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            limit: 50,
          },
        }),
      ),
    );

    renderAt('/post/abc123');

    const comment = await screen.findByText('a comment body');
    const form = screen.getByRole('form', { name: /add comment/i });
    // Form FOLLOW comment trong DOM → comment list ở trên, form ở cuối
    expect(comment.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('404 → renders "// post not found" + back to feed link', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/missing`, () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Post not found' } },
          { status: 404 },
        ),
      ),
    );

    renderAt('/post/missing');

    expect(await screen.findByText(/post not found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to feed/i })).toHaveAttribute('href', '/');
  });

  it('view tracking POST /posts/:id/view fired sau khi load', async () => {
    const viewSpy = vi.fn();
    mswServer.use(
      http.get(`${API_URL}/posts/abc123`, () =>
        HttpResponse.json({ data: makePost({ id: 'abc123' }) }),
      ),
      http.post(`${API_URL}/posts/abc123/view`, () => {
        viewSpy();
        return HttpResponse.json({ data: { viewCount: 1, counted: true } });
      }),
    );

    renderAt('/post/abc123');

    await screen.findByText('Hello world');
    await waitFor(() => expect(viewSpy).toHaveBeenCalledTimes(1));
  });
});
