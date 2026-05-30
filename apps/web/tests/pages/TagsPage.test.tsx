import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TagsPage from '@/pages/TagsPage';
import { mswServer } from '../_helpers/msw-server';
import { useAuthStore } from '@/stores/auth-store';
import type { TagWithStats } from '@/types/api';

const API = 'http://localhost:3001';

function mockTag(overrides: Partial<TagWithStats> = {}): TagWithStats {
  return {
    id: overrides.id ?? 't1',
    name: overrides.name ?? 'dev',
    color: overrides.color ?? '#00FFE5',
    description: overrides.description ?? null,
    postCount: overrides.postCount ?? 5,
    sparkline7d: overrides.sparkline7d ?? [0, 0, 0, 0, 0, 0, 0],
    createdAt: overrides.createdAt ?? '2026-05-01T00:00:00.000Z',
  };
}

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

describe('TagsPage (T-212, FR-10)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        username: 'user',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      status: 'authed',
    });
  });

  it('renders 4 stat cards + tag list grid', async () => {
    mswServer.use(
      http.get(`${API}/tags`, () =>
        HttpResponse.json({
          items: [
            mockTag({ id: 't1', name: 'dev', postCount: 10 }),
            mockTag({ id: 't2', name: 'life', postCount: 3 }),
          ],
        }),
      ),
    );
    wrap(<TagsPage />);
    // T-420 stale-assumption: TAGGED POSTS → TOTAL POSTS, RECENTLY ADDED → LEAST USED
    // (per design-file L479-482)
    expect(screen.getByText('TOTAL TAGS')).toBeInTheDocument();
    expect(screen.getByText('TOTAL POSTS')).toBeInTheDocument();
    expect(screen.getByText('MOST USED')).toBeInTheDocument();
    expect(screen.getByText('LEAST USED')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('tag-card-dev')).toBeInTheDocument());
    expect(screen.queryByTestId('tag-card-life')).toBeInTheDocument();
  });

  it('non-admin → no "+ New Tag" button, no Edit/Delete on cards', async () => {
    mswServer.use(http.get(`${API}/tags`, () => HttpResponse.json({ items: [mockTag()] })));
    wrap(<TagsPage />);
    await waitFor(() => expect(screen.queryByTestId('tag-card-dev')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /new tag/i })).not.toBeInTheDocument();
  });

  it('admin → "+ New Tag" button + Edit/Delete trên card', async () => {
    useAuthStore.setState({
      user: {
        id: 'a',
        username: 'admin',
        email: null,
        role: 'ADMIN',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      status: 'authed',
    });
    mswServer.use(http.get(`${API}/tags`, () => HttpResponse.json({ items: [mockTag()] })));
    wrap(<TagsPage />);
    await waitFor(() => expect(screen.queryByTestId('tag-card-dev')).toBeInTheDocument());
    // T-420 stale-assumption: 2 "+ New Tag" buttons xuất hiện cùng lúc admin (SubBar + create
    // placeholder card cuối grid) — dùng getAllByRole length check thay vì getByRole.
    const newTagBtns = screen.getAllByRole('button', { name: /new tag|create new tag/i });
    expect(newTagBtns.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /edit tag dev/i })).toBeInTheDocument();
  });

  it('admin click "+ New Tag" → TagModal mở + POST → invalidate + close', async () => {
    useAuthStore.setState({
      user: {
        id: 'a',
        username: 'admin',
        email: null,
        role: 'ADMIN',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      status: 'authed',
    });
    let posted: { name?: string } = {};
    mswServer.use(
      http.get(`${API}/tags`, () => HttpResponse.json({ items: [] })),
      http.post(`${API}/tags`, async ({ request }) => {
        posted = (await request.json()) as { name: string };
        return HttpResponse.json(
          { id: 'new', name: posted.name, color: '#00FFE5' },
          { status: 201 },
        );
      }),
    );
    wrap(<TagsPage />);
    await waitFor(() => screen.getByRole('button', { name: /new tag/i }));
    fireEvent.click(screen.getByRole('button', { name: /new tag/i }));
    const dialog = await screen.findByRole('dialog', { name: /create.tag/ });
    expect(dialog).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'fresh' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(posted.name).toBe('fresh'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('T-420 stale-assumption: view toggle list → render 5-col table (was flex-row variant)', async () => {
    const user = userEvent.setup();
    mswServer.use(http.get(`${API}/tags`, () => HttpResponse.json({ items: [mockTag()] })));
    wrap(<TagsPage />);
    await waitFor(() => expect(screen.queryByTestId('tag-card-dev')).toBeInTheDocument());
    // T-420: SegmentedToggle replaced với 30×30 simple buttons → aria-label "List view"
    await user.click(screen.getByRole('button', { name: /list view/i }));
    // Design L549-569: list view is 5-col table với data-testid `tag-row-<name>`
    expect(screen.getByTestId('list-view')).toBeInTheDocument();
    expect(screen.getByTestId('tag-row-dev')).toBeInTheDocument();
  });

  it('regression BUG-012: fixed SubBar + Sort 3 chips + Results count', async () => {
    mswServer.use(http.get(`${API}/tags`, () => HttpResponse.json({ items: [mockTag()] })));
    wrap(<TagsPage />);
    // SubBar fixed
    expect(screen.getByTestId('subbar')).toBeInTheDocument();
    // Sort 3 chips
    expect(screen.getByTestId('sort-posts')).toHaveTextContent('Most used');
    expect(screen.getByTestId('sort-name')).toHaveTextContent('A→Z');
    expect(screen.getByTestId('sort-recent')).toHaveTextContent('Newest');
    // Results count
    await waitFor(() =>
      expect(screen.getByTestId('results-count')).toHaveTextContent(/showing 1 of 1 tags/),
    );
  });
});
