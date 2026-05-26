import { describe, expect, it, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
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
  mswServer.use(
    http.get(`${API_URL}/posts`, () => HttpResponse.json({ data: makePaginatedPosts([]) })),
    http.get(`${API_URL}/posts/:id/comments`, () =>
      HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 10 } }),
    ),
    http.get(`${API_URL}/admin/stats`, () =>
      HttpResponse.json({
        data: {
          posts: { total: 42, sparkline: [1, 2, 3, 5, 8], deltaToday: 5 },
          reactions: { total: 287, sparkline: [10, 20, 35], deltaToday: 24 },
          comments: { total: 64, sparkline: [2, 4, 8], deltaToday: 3 },
          views: { total: 1234, sparkline: [100, 200, 500], deltaToday: 89 },
        },
      }),
    ),
    http.get(`${API_URL}/admin/moods`, () =>
      HttpResponse.json({
        data: {
          items: [
            { mood: 'HAPPY', count: 12 },
            { mood: 'EXCITED', count: 8 },
            { mood: 'CALM', count: 7 },
          ],
        },
      }),
    ),
    http.get(`${API_URL}/users`, () =>
      HttpResponse.json({
        data: {
          items: [
            {
              id: 'a1',
              username: 'admin',
              email: 'a@x.com',
              role: 'ADMIN',
              avatarUrl: null,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'u1',
              username: 'user1',
              email: 'u1@x.com',
              role: 'USER',
              avatarUrl: null,
              createdAt: '2026-01-15T00:00:00.000Z',
            },
          ],
          total: 2,
          page: 1,
          limit: 20,
        },
      }),
    ),
    http.get(`${API_URL}/admin/comments`, () =>
      HttpResponse.json({
        data: {
          items: [
            {
              id: 'c1',
              postId: 'p1',
              content: 'pending comment content',
              status: 'PENDING',
              createdAt: '2026-05-26T00:00:00.000Z',
              anonymousName: 'Anon#1',
              anonymousId: 'anon1',
              userId: null,
              author: null,
              post: { id: 'p1', content: 'some post' },
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        },
      }),
    ),
  );
});

describe('AdminPage', () => {
  it('renders sub-bar + 4 StatCards từ GET /admin/stats', async () => {
    renderAt('/admin');
    expect((await screen.findAllByText('~/admin/dashboard')).length).toBeGreaterThan(0);
    expect(await screen.findByText('42')).toBeInTheDocument(); // posts
    expect(screen.getByText('287')).toBeInTheDocument(); // reactions
    expect(screen.getByText('64')).toBeInTheDocument(); // comments
    expect(screen.getByText('1.2k')).toBeInTheDocument(); // views formatted
  });

  it('regression BUG-006: reads stats.reactions (not stats.likes) — BE renamed field in M11.7 multi-reaction migration', async () => {
    // BE returns `reactions` field (per StatsResponseDto + openapi.yaml). FE used to
    // read `stats.likes.total` → undefined crash. This test ensures the FE/BE contract
    // alignment is enforced — REACTIONS label visible + value rendered + no exception.
    renderAt('/admin');
    expect(await screen.findByText('REACTIONS')).toBeInTheDocument();
    expect(screen.getByText('287')).toBeInTheDocument();
  });

  it('renders mood.distribution với 7 mood bars (zero-fill missing moods)', async () => {
    renderAt('/admin');
    await screen.findByText('// mood.distribution', { exact: false });
    await waitFor(() => {
      expect(screen.getAllByRole('progressbar').length).toBe(7);
    });
  });

  it('renders activity.log mock 6 entries', async () => {
    renderAt('/admin');
    await waitFor(() => {
      expect(screen.getByText(/@user1 liked post #abc123/i)).toBeInTheDocument();
    });
  });

  it('renders UsersTable + comments.moderation section header', async () => {
    renderAt('/admin');
    expect(await screen.findByText('~/admin')).toBeInTheDocument();
    expect(screen.getByText('// comments.moderation')).toBeInTheDocument();
  });

  it('T-371: SubBar has ✏️ New Post → /admin/create + 🏷 Tags → /tags links', async () => {
    renderAt('/admin');
    const newPostLink = await screen.findByTestId('subbar-new-post');
    expect(newPostLink).toHaveAttribute('href', '/admin/create');
    const tagsLink = screen.getByTestId('subbar-tags');
    expect(tagsLink).toHaveAttribute('href', '/tags');
  });

  it('T-371: UsersTable actions — Ban button for non-admin + View button for all users', async () => {
    renderAt('/admin');
    // Ban button only for non-admin
    expect(await screen.findByRole('button', { name: /ban user1/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ban admin/i })).toBeNull();
    // View button for both
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    expect(viewButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('T-371: comments.moderation pending badge shows when PENDING comments exist', async () => {
    renderAt('/admin');
    await screen.findByText('// comments.moderation');
    await waitFor(() => {
      expect(screen.getByTestId('pending-badge')).toHaveTextContent('1 pending');
    });
  });
});
