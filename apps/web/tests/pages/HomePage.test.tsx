import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/pages/HomePage';
import { TestProviders } from '../_helpers/test-providers';
import { mswServer } from '../_helpers/msw-server';
import { makePaginatedPosts, makePost } from '../_helpers/post-factory';

const API_URL = 'http://localhost:3001';

describe('HomePage / FeedPage', () => {
  it('render loading skeleton rồi posts từ API', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts`, () =>
        HttpResponse.json({
          data: makePaginatedPosts([
            makePost({ id: 'p1', content: 'hello one' }),
            makePost({ id: 'p2', content: 'hello two', mood: 'EXCITED' }),
          ]),
        }),
      ),
    );

    render(
      <TestProviders>
        <HomePage />
      </TestProviders>,
    );

    expect(await screen.findByText('hello one')).toBeInTheDocument();
    expect(screen.getByText('hello two')).toBeInTheDocument();
    expect(screen.getByText(/2 total/)).toBeInTheDocument();
  });

  it('empty state khi BE trả 0 posts', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts`, () => HttpResponse.json({ data: makePaginatedPosts([]) })),
    );

    render(
      <TestProviders>
        <HomePage />
      </TestProviders>,
    );

    expect(await screen.findByText(/no posts matching filter/i)).toBeInTheDocument();
  });

  it('mood filter re-fetch với param mood=HAPPY', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    mswServer.use(
      http.get(`${API_URL}/posts`, ({ request }) => {
        const url = new URL(request.url);
        seen.push(url.searchParams.get('mood') ?? '');
        return HttpResponse.json({ data: makePaginatedPosts([makePost({ id: 'p1' })]) });
      }),
    );

    render(
      <TestProviders>
        <HomePage />
      </TestProviders>,
    );

    await screen.findByTestId('post-card-p1');
    await user.click(screen.getByRole('button', { name: /happy/i }));

    await waitFor(() => {
      expect(seen).toContain('HAPPY');
    });
  });

  it('error state khi GET /posts fail', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts`, () =>
        HttpResponse.json({ error: { code: 'X' } }, { status: 500 }),
      ),
    );

    render(
      <TestProviders>
        <HomePage />
      </TestProviders>,
    );

    expect(await screen.findByText(/connection lost/i)).toBeInTheDocument();
  });
});
