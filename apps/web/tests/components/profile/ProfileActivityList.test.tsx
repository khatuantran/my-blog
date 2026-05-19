import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { ProfileActivityList } from '@/components/profile/ProfileActivityList';
import { mswServer } from '../../_helpers/msw-server';
import type { PaginatedActivity } from '@/types/api';

const API = 'http://localhost:3001';
const USER_ID = 'u-alice';

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockActivity(payload: PaginatedActivity) {
  mswServer.use(
    http.get(`${API}/users/${USER_ID}/activity`, () =>
      HttpResponse.json({ data: payload, meta: {} }),
    ),
  );
}

describe('ProfileActivityList (T-301, FR-13)', () => {
  it('empty state khi không có activity', async () => {
    mockActivity({ items: [], total: 0, page: 1, limit: 20 });
    wrap(<ProfileActivityList userId={USER_ID} />);
    await waitFor(() => expect(screen.getByText(/no activity yet/i)).toBeInTheDocument());
  });

  it('render 4 type icon + OUTGOING text', async () => {
    mockActivity({
      total: 4,
      page: 1,
      limit: 20,
      items: [
        {
          id: 'a1',
          type: 'POST_CREATED',
          direction: 'OUTGOING',
          actor: { id: USER_ID, username: 'alice', avatarUrl: null },
          target: { type: 'POST', id: 'p1', snippet: 'hello' },
          createdAt: '2026-05-19T00:00:00Z',
        },
        {
          id: 'a2',
          type: 'COMMENT_CREATED',
          direction: 'OUTGOING',
          actor: { id: USER_ID, username: 'alice', avatarUrl: null },
          target: { type: 'POST', id: 'p2', snippet: 'reply text' },
          createdAt: '2026-05-19T00:00:00Z',
        },
        {
          id: 'a3',
          type: 'LIKE_CREATED',
          direction: 'OUTGOING',
          actor: { id: USER_ID, username: 'alice', avatarUrl: null },
          target: { type: 'POST', id: 'p3', snippet: 'liked snippet' },
          createdAt: '2026-05-19T00:00:00Z',
        },
        {
          id: 'a4',
          type: 'SAVE_CREATED',
          direction: 'OUTGOING',
          actor: { id: USER_ID, username: 'alice', avatarUrl: null },
          target: { type: 'POST', id: 'p4', snippet: 'saved snippet' },
          createdAt: '2026-05-19T00:00:00Z',
        },
      ],
    });
    wrap(<ProfileActivityList userId={USER_ID} />);
    await waitFor(() => expect(screen.getByText('hello')).toBeInTheDocument());
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('🔖')).toBeInTheDocument();
    // OUTGOING text contains "You"
    expect(screen.getAllByText('You').length).toBe(4);
  });

  it('INCOMING text hiển thị actor.username', async () => {
    mockActivity({
      total: 1,
      page: 1,
      limit: 20,
      items: [
        {
          id: 'a1',
          type: 'LIKE_CREATED',
          direction: 'INCOMING',
          actor: { id: 'u-bob', username: 'bob', avatarUrl: null },
          target: { type: 'POST', id: 'p1', snippet: 'my post' },
          createdAt: '2026-05-19T00:00:00Z',
        },
      ],
    });
    wrap(<ProfileActivityList userId={USER_ID} />);
    await waitFor(() => expect(screen.getByText('bob')).toBeInTheDocument());
    expect(screen.getByText(/liked your post/i)).toBeInTheDocument();
  });

  it('snippet null → render [deleted post] không link', async () => {
    mockActivity({
      total: 1,
      page: 1,
      limit: 20,
      items: [
        {
          id: 'a1',
          type: 'LIKE_CREATED',
          direction: 'OUTGOING',
          actor: { id: USER_ID, username: 'alice', avatarUrl: null },
          target: { type: 'POST', id: 'p-gone', snippet: null },
          createdAt: '2026-05-19T00:00:00Z',
        },
      ],
    });
    wrap(<ProfileActivityList userId={USER_ID} />);
    await waitFor(() => expect(screen.getByText('[deleted post]')).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: '[deleted post]' })).toBeNull();
  });

  it('403 → render private hint', async () => {
    mswServer.use(
      http.get(`${API}/users/${USER_ID}/activity`, () =>
        HttpResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Activity is private' } },
          { status: 403 },
        ),
      ),
    );
    wrap(<ProfileActivityList userId={USER_ID} />);
    await waitFor(() => expect(screen.getByText(/activity is private/i)).toBeInTheDocument());
  });
});
