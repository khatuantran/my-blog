import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SavedPage from '@/pages/SavedPage';
import { mswServer } from '../_helpers/msw-server';
import { makePost } from '../_helpers/post-factory';

const API = 'http://localhost:3001';

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SavedPage (T-203, FR-03.3)', () => {
  it('empty saved → renders hint với Link "feed"', async () => {
    mswServer.use(
      http.get(`${API}/me/saved`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, limit: 10 }),
      ),
    );
    wrap(<SavedPage />);
    await waitFor(() => expect(screen.getByText(/no saved posts yet/i)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /feed/i })).toHaveAttribute('href', '/');
  });

  it('renders saved PostCards + total in header', async () => {
    mswServer.use(
      http.get(`${API}/me/saved`, () =>
        HttpResponse.json({
          items: [makePost({ id: 'p-saved-1', content: 'saved one' })],
          total: 1,
          page: 1,
          limit: 10,
        }),
      ),
    );
    wrap(<SavedPage />);
    await waitFor(() => expect(screen.getByText('saved one')).toBeInTheDocument());
    expect(screen.getByText(/saved\.posts.*1 items/)).toBeInTheDocument();
  });

  it('500 error → renders failure hint', async () => {
    mswServer.use(
      http.get(`${API}/me/saved`, () => HttpResponse.json({ message: 'oops' }, { status: 500 })),
    );
    wrap(<SavedPage />);
    await waitFor(() =>
      expect(screen.getByText(/failed to load saved posts/i)).toBeInTheDocument(),
    );
  });
});
