import { describe, expect, it, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { routes } from '@/routes';
import { mswServer } from '../_helpers/msw-server';
import { createTestQueryClient } from '../_helpers/query-client';
import { makePost, makePaginatedPosts } from '../_helpers/post-factory';

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
  );
});

describe('CreatePostPage', () => {
  it('render editor sections (mood/content/images/files/tags) + preview + sub-toolbar', async () => {
    renderAt('/admin/create');
    expect(await screen.findByText('// mood')).toBeInTheDocument();
    expect(screen.getByText('// content')).toBeInTheDocument();
    expect(screen.getByText(/\/\/ images \(0\/10\)/)).toBeInTheDocument();
    expect(screen.getByText(/\/\/ files \(0\/20\)/)).toBeInTheDocument();
    expect(screen.getByText(/\/\/ tags \(0 selected\)/)).toBeInTheDocument();
    expect(screen.getByText('// live.preview')).toBeInTheDocument();
    // ~/admin/create-post xuất hiện ở cả sub-toolbar và StatusBar
    expect(screen.getAllByText('~/admin/create-post').length).toBeGreaterThan(0);
  });

  it('AI suggest button (FR-17 UI shell) mở modal placeholder + đóng được', async () => {
    const user = userEvent.setup();
    renderAt('/admin/create');
    const aiBtn = await screen.findByTestId('ai-suggest-btn');
    expect(aiBtn).toHaveTextContent('AI suggest');
    expect(screen.queryByTestId('ai-suggest-modal')).not.toBeInTheDocument();
    await user.click(aiBtn);
    const modal = screen.getByTestId('ai-suggest-modal');
    expect(within(modal).getByText(/sắp ra mắt/)).toBeInTheDocument();
    await user.click(within(modal).getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('ai-suggest-modal')).not.toBeInTheDocument();
  });

  it('Publish disabled khi content empty', async () => {
    renderAt('/admin/create');
    const btn = await screen.findByRole('button', { name: /publish/i });
    expect(btn).toBeDisabled();
  });

  it('submit Publish → POST /posts với body shape correct', async () => {
    const user = userEvent.setup();
    const received: unknown[] = [];
    mswServer.use(
      http.post(`${API_URL}/posts`, async ({ request }) => {
        received.push(await request.json());
        return HttpResponse.json({ data: makePost({ id: 'new-post' }) });
      }),
    );

    renderAt('/admin/create');
    await user.type(await screen.findByLabelText(/post content/i), 'hello world');
    await user.click(screen.getByRole('button', { name: /publish/i }));

    await waitFor(() => {
      expect(received).toEqual([
        expect.objectContaining({
          content: 'hello world',
          mood: 'HAPPY',
          tags: [],
          images: [],
          files: [],
        }),
      ]);
    });
  });

  it('click Save → status flip về `draft · saved`', async () => {
    const user = userEvent.setup();
    renderAt('/admin/create');
    await user.click(await screen.findByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/draft · saved/)).toBeInTheDocument();
    });
  });
});
