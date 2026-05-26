import { Suspense } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { routes } from '@/routes';
import { mswServer } from '../_helpers/msw-server';
import { createTestQueryClient } from '../_helpers/query-client';
import { makePost } from '../_helpers/post-factory';
import { useAuthStore } from '@/stores/auth-store';
import type { AdminPost, PaginatedAdminPosts } from '@/types/api';

const API = 'http://localhost:3001';

function makeAdminPost(overrides: Partial<AdminPost> = {}): AdminPost {
  return {
    ...makePost(overrides),
    status: 'PUBLISHED',
    ...overrides,
  };
}

function makePaginatedAdminPosts(
  items: AdminPost[],
  overrides: Partial<PaginatedAdminPosts> = {},
): PaginatedAdminPosts {
  return { items, total: items.length, page: 1, limit: 20, ...overrides };
}

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

const TWO_POSTS = [
  makeAdminPost({ id: 'p-001', content: 'First post content here', status: 'PUBLISHED' }),
  makeAdminPost({ id: 'p-002', content: 'Second post in draft', status: 'DRAFT' }),
];

beforeEach(() => {
  mswServer.use(
    http.get(`${API}/admin/posts`, () =>
      HttpResponse.json(makePaginatedAdminPosts(TWO_POSTS, { total: 2 })),
    ),
  );
});

describe('ManagePostsPage (T-372, FR-15)', () => {
  it('non-admin viewer → redirected away from /admin/posts', async () => {
    useAuthStore.setState({
      status: 'authed',
      user: {
        id: 'u-user',
        username: 'user',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    renderAt('/admin/posts');
    // ProtectedRoute redirects non-ADMIN to /
    await waitFor(() => expect(screen.queryByTestId('subbar')).not.toBeInTheDocument());
  });

  it('T-372: loading → shows loading indicator', () => {
    mswServer.use(http.get(`${API}/admin/posts`, () => new Promise(() => {})));
    renderAt('/admin/posts');
    // Suspense fallback or loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('T-372: empty results → shows // no posts match filter', async () => {
    mswServer.use(
      http.get(`${API}/admin/posts`, () => HttpResponse.json(makePaginatedAdminPosts([]))),
    );
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());
    expect(screen.getByTestId('empty')).toHaveTextContent('no posts match filter');
  });

  it('T-372: list view (default) → renders PostRow per item', async () => {
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getAllByTestId('post-row')).toHaveLength(2));
    expect(screen.getByText(/First post content here/)).toBeInTheDocument();
    expect(screen.getByText(/Second post in draft/)).toBeInTheDocument();
  });

  it('T-372: card view toggle → renders PostCardMng per item', async () => {
    renderAt('/admin/posts');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /card view/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /card view/i }));
    await waitFor(() => expect(screen.getAllByTestId('post-card-mng')).toHaveLength(2));
  });

  it('T-372: subbar shows path ~/admin/posts + New Post link', async () => {
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getByTestId('subbar')).toBeInTheDocument());
    expect(within(screen.getByTestId('subbar')).getByText('~/admin/posts')).toBeInTheDocument();
    const newPostLink = screen.getByRole('link', { name: /new post/i });
    expect(newPostLink).toHaveAttribute('href', '/admin/create');
  });

  it('T-372: status filter DRAFT click → query includes status=DRAFT', async () => {
    let capturedUrl = '';
    mswServer.use(
      http.get(`${API}/admin/posts`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(makePaginatedAdminPosts([]));
      }),
    );
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getByTestId('status-filter-DRAFT')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('status-filter-DRAFT'));
    await waitFor(() => expect(capturedUrl).toContain('status=DRAFT'));
  });

  it('T-372: mood filter click → query includes mood param', async () => {
    let capturedUrl = '';
    mswServer.use(
      http.get(`${API}/admin/posts`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(makePaginatedAdminPosts([]));
      }),
    );
    renderAt('/admin/posts');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /filter by happy/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /filter by happy/i }));
    await waitFor(() => expect(capturedUrl).toContain('mood=HAPPY'));
  });

  it('T-372: click Edit → QuickEditModal opens with post content', async () => {
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getAllByTestId('post-row')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: /edit post p-001/i }));
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: /edit post p-001/i })).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('First post content here')).toBeInTheDocument();
  });

  it('T-372: QuickEditModal status dropdown has PUBLISHED/DRAFT/ARCHIVED options', async () => {
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getAllByTestId('post-row')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: /edit post p-001/i }));
    await waitFor(() => expect(screen.getByLabelText('Post status')).toBeInTheDocument());
    const select = screen.getByLabelText('Post status') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('PUBLISHED');
    expect(options).toContain('DRAFT');
    expect(options).toContain('ARCHIVED');
  });

  it('T-372: QuickEditModal save → PATCH /admin/posts/:id called', async () => {
    let patchedId = '';
    mswServer.use(
      http.patch(`${API}/admin/posts/:id`, ({ params }) => {
        patchedId = params.id as string;
        return HttpResponse.json(makeAdminPost({ id: 'p-001' }));
      }),
    );
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getAllByTestId('post-row')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: /edit post p-001/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /✓ save/i }));
    await waitFor(() => expect(patchedId).toBe('p-001'));
  });

  it('T-372: QuickEditModal Esc → closes', async () => {
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getAllByTestId('post-row')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: /edit post p-001/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('T-372: click Delete → ConfirmDialog opens with snippet', async () => {
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getAllByTestId('post-row')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: /delete post p-001/i }));
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: /confirm.delete/i })).toBeInTheDocument(),
    );
    expect(
      within(screen.getByRole('dialog', { name: /confirm.delete/i })).getByText(
        /First post content here/,
      ),
    ).toBeInTheDocument();
  });

  it('T-372: delete confirm → DELETE /admin/posts/:id called', async () => {
    let deletedId = '';
    mswServer.use(
      http.delete(`${API}/admin/posts/:id`, ({ params }) => {
        deletedId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getAllByTestId('post-row')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: /delete post p-001/i }));
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: /confirm.delete/i })).toBeInTheDocument(),
    );
    const dialog = screen.getByRole('dialog', { name: /confirm.delete/i });
    const confirmBtn = within(dialog).getByRole('button', { name: /delete/i });
    fireEvent.click(confirmBtn);
    await waitFor(() => expect(deletedId).toBe('p-001'));
  });

  it('T-372: bulk select checkbox toggles selection + bulk bar appears', async () => {
    const user = userEvent.setup();
    renderAt('/admin/posts');
    await waitFor(() => expect(screen.getAllByTestId('post-row')).toHaveLength(2));
    const checkboxes = screen.getAllByRole('checkbox', { name: /select post/i });
    await user.click(checkboxes[0]);
    await waitFor(() => expect(screen.getByTestId('bulk-bar')).toBeInTheDocument());
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });
});
