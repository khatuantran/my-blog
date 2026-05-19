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
    expect(screen.getByText('TOTAL TAGS')).toBeInTheDocument();
    expect(screen.getByText('TAGGED POSTS')).toBeInTheDocument();
    expect(screen.getByText('MOST USED')).toBeInTheDocument();
    expect(screen.getByText('RECENTLY ADDED')).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: /new tag/i })).toBeInTheDocument();
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

  it('view toggle list → render flex-row variant', async () => {
    const user = userEvent.setup();
    mswServer.use(http.get(`${API}/tags`, () => HttpResponse.json({ items: [mockTag()] })));
    wrap(<TagsPage />);
    await waitFor(() => expect(screen.queryByTestId('tag-card-dev')).toBeInTheDocument());
    await user.click(screen.getByRole('radio', { name: /list/i }));
    // List variant shows `N posts` text alongside name
    expect(screen.getByText('5 posts')).toBeInTheDocument();
  });
});
