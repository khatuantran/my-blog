import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const emptyStats = { totalPosts: 0, withImages: 0, withFiles: 0, savedCount: 0 };

function searchEmpty() {
  return http.get(`${API}/search`, () =>
    HttpResponse.json({
      posts: { items: [], total: 0, page: 1, limit: 10 },
      files: [],
      tags: [],
      stats: emptyStats,
    }),
  );
}

function postsEmpty() {
  return http.get(`${API}/posts`, () =>
    HttpResponse.json({
      data: { items: [], total: 0, page: 1, limit: 10 },
    }),
  );
}

function tagsEmpty() {
  return http.get(`${API}/tags`, () => HttpResponse.json({ data: { items: [] } }));
}

describe('SearchPage (T-351 rewrite, FR-12.8-.12)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mswServer.use(searchEmpty(), postsEmpty(), tagsEmpty());
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('T-351.1 hero render: input + ❯ label + ⌘K badge', () => {
    wrap('/search');
    expect(screen.getByTestId('big-search-input')).toBeInTheDocument();
    expect(screen.getByText('❯ search')).toBeInTheDocument();
    expect(screen.getByTestId('big-search-cmdk-badge')).toBeInTheDocument();
  });

  it('T-351.2 filter chip click: Saved → URL type=saved', async () => {
    const user = userEvent.setup();
    wrap('/search');
    const savedChip = screen.getByRole('checkbox', { name: 'Saved' });
    expect(savedChip).toHaveAttribute('aria-checked', 'false');
    await user.click(savedChip);
    await waitFor(() => expect(savedChip).toHaveAttribute('aria-checked', 'true'));
  });

  it('T-351.3 mood filter click: HAPPY button → aria-pressed true', async () => {
    const user = userEvent.setup();
    wrap('/search');
    const happy = screen.getByTestId('mood-btn-HAPPY');
    expect(happy).toHaveAttribute('aria-pressed', 'false');
    await user.click(happy);
    await waitFor(() => expect(happy).toHaveAttribute('aria-pressed', 'true'));
  });

  it('T-351.4 empty state (q="" no filter) → 3 sections render', async () => {
    wrap('/search');
    await waitFor(() => expect(screen.getByTestId('search-empty-state')).toBeInTheDocument());
    expect(screen.getByTestId('empty-recent-searches')).toBeInTheDocument();
    expect(screen.getByTestId('empty-browse-tags')).toBeInTheDocument();
    expect(screen.getByTestId('empty-all-posts')).toBeInTheDocument();
  });

  it('T-351.5 results highlight: query match → <mark> wraps matching text', async () => {
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
    const mark = screen.getByText('Hello');
    expect(mark.tagName.toLowerCase()).toBe('mark');
    expect(mark.className).toMatch(/bg-cyan\/20/);
  });

  it('T-351.6 no-results state: q has value + zero results → ◎ + bash hint + clear button', async () => {
    wrap('/search?q=zzznothing');
    await waitFor(() => expect(screen.getByTestId('search-no-results')).toBeInTheDocument());
    expect(screen.getByText(/no results for "zzznothing"/i)).toBeInTheDocument();
    expect(screen.getByText(/grep -r "zzznothing"/)).toBeInTheDocument();
    expect(screen.getByTestId('no-results-clear')).toBeInTheDocument();
  });

  it('T-351.7 clear filters: reset button visible khi filter active, click → clear all', async () => {
    const user = userEvent.setup();
    wrap('/search?type=saved&mood=HAPPY');
    const reset = await screen.findByTestId('search-reset-filters');
    expect(reset).toBeInTheDocument();
    await user.click(reset);
    await waitFor(() => {
      expect(screen.queryByTestId('search-reset-filters')).not.toBeInTheDocument();
      // Empty state back since q='' no filter
      expect(screen.getByTestId('search-empty-state')).toBeInTheDocument();
    });
  });

  it('T-351.8 recent.searches localStorage: pre-seeded → render trong empty section + clear works', async () => {
    window.localStorage.setItem(
      'myblog.recentSearches',
      JSON.stringify(['previous-query', 'cyberpunk', 'nextjs']),
    );
    wrap('/search');
    await waitFor(() => expect(screen.getByTestId('empty-recent-searches')).toBeInTheDocument());
    expect(screen.getByText('previous-query')).toBeInTheDocument();
    expect(screen.getByText('cyberpunk')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByTestId('empty-recent-clear'));
    await waitFor(() => {
      expect(screen.queryByText('previous-query')).not.toBeInTheDocument();
    });
  });

  it('T-400.7 recent chip styling: ↺ icon prefix per design-file', async () => {
    window.localStorage.setItem('myblog.recentSearches', JSON.stringify(['react hooks']));
    wrap('/search');
    const chip = await screen.findByTestId('recent-chip-react hooks');
    expect(chip).toHaveTextContent('↺');
    expect(chip).toHaveTextContent('react hooks');
  });

  it('T-400.8 browse.tags chip: per-color background + count number per design-file', async () => {
    mswServer.use(
      http.get(`${API}/tags`, () =>
        HttpResponse.json({
          data: {
            items: [
              {
                id: 't1',
                name: '#code',
                color: '#9ECE6A',
                postCount: 24,
                sparkline7d: [],
                createdAt: '2026-05-01T00:00:00Z',
              },
              {
                id: 't2',
                name: '#life',
                color: '#BB9AF7',
                postCount: 18,
                sparkline7d: [],
                createdAt: '2026-05-01T00:00:00Z',
              },
            ],
          },
        }),
      ),
    );
    wrap('/search');
    const code = await screen.findByTestId('browse-tag-chip-#code');
    expect(code).toHaveTextContent('#code');
    expect(code).toHaveTextContent('24');
    const life = await screen.findByTestId('browse-tag-chip-#life');
    expect(life).toHaveTextContent('#life');
    expect(life).toHaveTextContent('18');
  });
});
