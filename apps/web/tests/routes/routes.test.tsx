import { describe, expect, it, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { routes } from '@/routes';
import { mswServer } from '../_helpers/msw-server';
import { createTestQueryClient } from '../_helpers/query-client';
import { makePaginatedPosts } from '../_helpers/post-factory';

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
  // Default empty Feed cho HomePage tests — bất kỳ route nào touch / cũng gọi GET /posts.
  mswServer.use(
    http.get(`${API_URL}/posts`, () => HttpResponse.json({ data: makePaginatedPosts([]) })),
    http.get(`${API_URL}/posts/:id/comments`, () =>
      HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 10 } }),
    ),
  );
});

describe('App router', () => {
  it('renders FeedPage at / (empty state)', async () => {
    renderAt('/');
    expect(await screen.findByText(/no posts matching filter/i)).toBeInTheDocument();
  });

  it('renders PostDetailPage at /post/:id (404 vì MSW default)', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/abc123`, () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Post not found' } },
          { status: 404 },
        ),
      ),
    );
    renderAt('/post/abc123');
    expect(await screen.findByText(/post not found/i)).toBeInTheDocument();
  });

  it('renders AdminPage at /admin (admin role allowed)', async () => {
    mswServer.use(
      http.get(`${API_URL}/admin/stats`, () =>
        HttpResponse.json({
          data: {
            posts: { total: 0, sparkline: [], deltaToday: 0 },
            likes: { total: 0, sparkline: [], deltaToday: 0 },
            comments: { total: 0, sparkline: [], deltaToday: 0 },
            views: { total: 0, sparkline: [], deltaToday: 0 },
          },
        }),
      ),
      http.get(`${API_URL}/admin/moods`, () => HttpResponse.json({ data: { items: [] } })),
      http.get(`${API_URL}/users`, () =>
        HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 20 } }),
      ),
    );
    renderAt('/admin');
    expect((await screen.findAllByText('~/admin/dashboard')).length).toBeGreaterThan(0);
  });

  it('renders CreatePostPage at /admin/create (admin role allowed)', async () => {
    renderAt('/admin/create');
    expect(await screen.findByText('// mood')).toBeInTheDocument();
    expect(screen.getByText('// content')).toBeInTheDocument();
  });

  it('renders LoginPage at /auth/login với AuthLayout (no shell)', async () => {
    renderAt('/auth/login');
    expect(await screen.findByLabelText('Username')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="topbar"]')).toBeNull();
    expect(document.querySelector('[data-slot="statusbar"]')).toBeNull();
  });

  it('renders NotFoundPage cho unknown route', async () => {
    renderAt('/this-does-not-exist');
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('AppLayout shell có TopBar + StatusBar slots tại /', async () => {
    renderAt('/');
    await screen.findByText(/no posts matching filter/i);
    expect(document.querySelector('[data-slot="topbar"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="statusbar"]')).not.toBeNull();
  });
});
