import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchPage from '@/pages/SearchPage';
import { mswServer } from '../_helpers/msw-server';
import { makePost } from '../_helpers/post-factory';

const API = 'http://localhost:3001';

function wrap(initial: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const emptyStats = {
  totalPosts: 0,
  withImages: 0,
  withFiles: 0,
  savedCount: 0,
};

describe('SearchPage (T-231, FR-12)', () => {
  it('renders BigSearchInput + type chips + mood chips + 4 stat cards', async () => {
    mswServer.use(
      http.get(`${API}/search`, () =>
        HttpResponse.json({
          posts: { items: [], total: 0, page: 1, limit: 10 },
          files: [],
          tags: [],
          stats: { totalPosts: 5, withImages: 2, withFiles: 1, savedCount: 0 },
        }),
      ),
    );
    wrap('/search');
    expect(screen.getByLabelText(/search query/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'All' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    expect(screen.getByText('Total posts')).toBeInTheDocument();
    expect(screen.getByText('With images')).toBeInTheDocument();
  });

  it('q match → ResultCard rendered + highlight match', async () => {
    mswServer.use(
      http.get(`${API}/search`, () =>
        HttpResponse.json({
          posts: {
            items: [makePost({ id: 'p1', content: 'Hello cyberpunk world' })],
            total: 1,
            page: 1,
            limit: 10,
          },
          files: [],
          tags: [],
          stats: emptyStats,
        }),
      ),
    );
    wrap('/search?q=hello');
    await waitFor(() => expect(screen.getByTestId('result-card-p1')).toBeInTheDocument());
    // Highlighted span — mark element with 'Hello'
    const mark = screen.getByText('Hello');
    expect(mark.tagName.toLowerCase()).toBe('mark');
  });

  it('Empty result với q → renders "no results" hint', async () => {
    mswServer.use(
      http.get(`${API}/search`, () =>
        HttpResponse.json({
          posts: { items: [], total: 0, page: 1, limit: 10 },
          files: [],
          tags: [],
          stats: emptyStats,
        }),
      ),
    );
    wrap('/search?q=zzznothing');
    await waitFor(() =>
      expect(screen.getByText(/no results for "zzznothing"/i)).toBeInTheDocument(),
    );
  });

  it('Click type=posts chip → URL update', async () => {
    mswServer.use(
      http.get(`${API}/search`, () =>
        HttpResponse.json({
          posts: { items: [], total: 0, page: 1, limit: 10 },
          files: [],
          tags: [],
          stats: emptyStats,
        }),
      ),
    );
    wrap('/search?q=x');
    const postsChip = screen.getByRole('checkbox', { name: 'Posts' });
    fireEvent.click(postsChip);
    await waitFor(() => expect(postsChip).toHaveAttribute('aria-checked', 'true'));
  });
});
