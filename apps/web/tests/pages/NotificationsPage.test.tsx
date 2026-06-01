import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import { mswServer } from '../_helpers/msw-server';
import { useAuthStore } from '@/stores/auth-store';
import type { NotificationItem } from '@/types/api';
import { ToastProvider } from '@/components/shared/Toast';

const API = 'http://localhost:3001';

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/notifications']}>
          <Routes>
            <Route
              path="/notifications"
              element={
                <Suspense fallback={<div>loading…</div>}>
                  <NotificationsPage />
                </Suspense>
              }
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

function makeNotif(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: `n-${Math.random().toString(36).slice(2)}`,
    type: 'REACTION',
    actor: { id: 'u-bob', username: 'bob', avatarUrl: null },
    targetType: 'POST',
    targetId: 'post-abc',
    postId: 'post-abc',
    read: false,
    metadata: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makePageResponse(items: NotificationItem[]) {
  return {
    data: {
      items,
      total: items.length,
      page: 1,
      limit: 20,
      unreadCount: items.filter((n) => !n.read).length,
    },
  };
}

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 'u-alice',
      username: 'alice',
      role: 'USER',
      avatarUrl: null,
      email: 'alice@test.com',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    status: 'authed',
  });
});

describe('NotificationsPage (T-352, FR-14.7-.13)', () => {
  it('T-352: renders subbar + 6 type tabs', async () => {
    mswServer.use(http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse([]))));
    wrap();
    await waitFor(() => expect(screen.getByTestId('notifications-subbar')).toBeInTheDocument());
    expect(screen.getByTestId('notifications-tabs')).toBeInTheDocument();
    for (const key of ['all', 'unread', 'reaction', 'comment', 'reply', 'share']) {
      expect(screen.getByTestId(`tab-${key}`)).toBeInTheDocument();
    }
  });

  it('T-352: tab switch changes active tab', async () => {
    mswServer.use(http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse([]))));
    wrap();
    await waitFor(() => screen.getByTestId('tab-reaction'));
    fireEvent.click(screen.getByTestId('tab-reaction'));
    expect(screen.getByTestId('tab-reaction')).toHaveStyle({ color: 'var(--cyan)' });
    fireEvent.click(screen.getByTestId('tab-comment'));
    expect(screen.getByTestId('tab-comment')).toHaveStyle({ color: 'var(--cyan)' });
  });

  it('T-352: search filter hides non-matching rows', async () => {
    const items = [
      makeNotif({ actor: { id: 'u-bob', username: 'bob', avatarUrl: null } }),
      makeNotif({ actor: { id: 'u-carol', username: 'carol', avatarUrl: null } }),
    ];
    mswServer.use(
      http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse(items))),
    );
    wrap();
    await waitFor(() => expect(screen.getAllByTestId('notif-row-page')).toHaveLength(2));

    const input = screen.getByTestId('notifications-search');
    fireEvent.change(input, { target: { value: 'carol' } });
    // wait for debounce 150ms
    await waitFor(() => expect(screen.getAllByTestId('notif-row-page')).toHaveLength(1), {
      timeout: 500,
    });
  });

  it('T-352: checkbox select shows bulk action bar', async () => {
    const items = [makeNotif(), makeNotif()];
    mswServer.use(
      http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse(items))),
    );
    wrap();
    await waitFor(() => screen.getAllByTestId('notif-row-checkbox'));
    expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByTestId('notif-row-checkbox')[0]);
    expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-action-bar')).toHaveTextContent('1 selected');
  });

  it('T-352: bulk mark read calls PATCH /notifications/bulk-read', async () => {
    const items = [makeNotif({ id: 'n-1' }), makeNotif({ id: 'n-2' })];
    let bulkReadCalled = false;
    mswServer.use(
      http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse(items))),
      http.patch(`${API}/notifications/bulk-read`, async ({ request }) => {
        const body = (await request.json()) as { ids: string[] };
        bulkReadCalled = true;
        return HttpResponse.json({ data: { updated: body.ids.length } });
      }),
    );
    wrap();
    await waitFor(() => screen.getAllByTestId('notif-row-checkbox'));

    fireEvent.click(screen.getAllByTestId('notif-row-checkbox')[0]);
    await waitFor(() => screen.getByTestId('bulk-mark-read-btn'));
    fireEvent.click(screen.getByTestId('bulk-mark-read-btn'));
    await waitFor(() => expect(bulkReadCalled).toBe(true));
  });

  it('T-352: bulk delete calls DELETE /notifications/bulk', async () => {
    const items = [makeNotif({ id: 'n-1' })];
    let bulkDeleteCalled = false;
    mswServer.use(
      http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse(items))),
      http.delete(`${API}/notifications/bulk`, async () => {
        bulkDeleteCalled = true;
        return HttpResponse.json({ data: { deleted: 1 } });
      }),
    );
    wrap();
    await waitFor(() => screen.getAllByTestId('notif-row-checkbox'));

    fireEvent.click(screen.getAllByTestId('notif-row-checkbox')[0]);
    await waitFor(() => screen.getByTestId('bulk-delete-btn'));
    fireEvent.click(screen.getByTestId('bulk-delete-btn'));
    await waitFor(() => expect(bulkDeleteCalled).toBe(true));
  });

  it('T-352: clear all btn opens confirm dialog + confirms calls DELETE /notifications/all', async () => {
    const items = [makeNotif()];
    let deleteAllCalled = false;
    mswServer.use(
      http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse(items))),
      http.delete(`${API}/notifications/all`, () => {
        deleteAllCalled = true;
        return HttpResponse.json({ data: { deleted: 1 } });
      }),
    );
    wrap();
    await waitFor(() => screen.getByTestId('clear-all-btn'));

    fireEvent.click(screen.getByTestId('clear-all-btn'));
    expect(screen.getByTestId('confirm-clear-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-clear-btn'));
    await waitFor(() => expect(deleteAllCalled).toBe(true));
  });

  it('T-352: sticky group label renders for today items', async () => {
    const items = [makeNotif({ createdAt: new Date().toISOString() })];
    mswServer.use(
      http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse(items))),
    );
    wrap();
    await waitFor(() => screen.getByTestId('group-label-today'));
    expect(screen.getByTestId('group-label-today')).toHaveTextContent('today');
  });

  it('T-352: empty state (all) shows inbox zero message', async () => {
    mswServer.use(http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse([]))));
    wrap();
    await waitFor(() => screen.getByTestId('empty-state-all'));
    expect(screen.getByTestId('empty-state-all')).toHaveTextContent('inbox zero');
  });

  it('T-352: empty state (filtered) shows no-match message when items exist but filter hides them', async () => {
    const items = [makeNotif({ type: 'REACTION' })];
    mswServer.use(
      http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse(items))),
    );
    wrap();
    await waitFor(() => screen.getAllByTestId('notif-row-page'));

    // switch to REPLY tab — no REPLY items → filtered empty
    fireEvent.click(screen.getByTestId('tab-reply'));
    await waitFor(() => screen.getByTestId('empty-state-filtered'));
    expect(screen.getByTestId('empty-state-filtered')).toHaveTextContent(
      'no notifications matching',
    );
  });

  it('T-352: reply notification renders replyTo username', async () => {
    const items = [
      makeNotif({
        type: 'REPLY',
        metadata: { replyTo: { username: 'alice' } },
      }),
    ];
    mswServer.use(
      http.get(`${API}/notifications`, () => HttpResponse.json(makePageResponse(items))),
    );
    wrap();
    await waitFor(() => screen.getAllByTestId('notif-row-page'));
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });
});
