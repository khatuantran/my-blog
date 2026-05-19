import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModerationQueue } from '@/components/admin/ModerationQueue';
import { mswServer } from '../../_helpers/msw-server';

const API = 'http://localhost:3001';

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('ModerationQueue (T-202, FR-07.4)', () => {
  it('empty queue → renders empty hint', async () => {
    mswServer.use(
      http.get(`${API}/admin/comments`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, limit: 20 }),
      ),
    );
    wrap(<ModerationQueue />);
    await waitFor(() => expect(screen.getByText(/queue empty/i)).toBeInTheDocument());
  });

  it('renders pending items với post.content truncated + Approve/Delete buttons', async () => {
    mswServer.use(
      http.get(`${API}/admin/comments`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'c1',
              postId: 'p1',
              content: 'spam comment',
              status: 'PENDING',
              author: null,
              anonymousName: 'Anon#1',
              likesCount: 0,
              createdAt: new Date().toISOString(),
              post: { id: 'p1', content: 'host post title truncated' },
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        }),
      ),
    );
    wrap(<ModerationQueue />);
    await waitFor(() => expect(screen.getByText('spam comment')).toBeInTheDocument());
    expect(screen.getByText(/1 pending/i)).toBeInTheDocument();
    expect(screen.getByText(/host post title truncated/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approve comment c1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete comment c1/i })).toBeInTheDocument();
  });

  it('click Approve → PATCH /comments/:id/status APPROVED', async () => {
    let patched: { id?: string; body?: unknown } = {};
    mswServer.use(
      http.get(`${API}/admin/comments`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'c2',
              postId: 'p1',
              content: 'ok',
              status: 'PENDING',
              author: null,
              anonymousName: 'A',
              likesCount: 0,
              createdAt: new Date().toISOString(),
              post: { id: 'p1', content: 'p' },
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        }),
      ),
      http.patch(`${API}/comments/:id/status`, async ({ request, params }) => {
        patched = { id: params.id as string, body: await request.json() };
        return HttpResponse.json({ id: params.id, status: 'APPROVED' });
      }),
    );
    wrap(<ModerationQueue />);
    await waitFor(() => screen.getByRole('button', { name: /approve comment c2/i }));
    fireEvent.click(screen.getByRole('button', { name: /approve comment c2/i }));
    await waitFor(() => expect(patched.id).toBe('c2'));
    expect(patched.body).toEqual({ status: 'APPROVED' });
  });

  it('click Delete → DELETE /comments/:id', async () => {
    let deleted: string | null = null;
    mswServer.use(
      http.get(`${API}/admin/comments`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'c3',
              postId: 'p1',
              content: 'bad',
              status: 'PENDING',
              author: null,
              anonymousName: 'B',
              likesCount: 0,
              createdAt: new Date().toISOString(),
              post: { id: 'p1', content: 'p' },
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        }),
      ),
      http.delete(`${API}/comments/:id`, ({ params }) => {
        deleted = params.id as string;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    wrap(<ModerationQueue />);
    await waitFor(() => screen.getByRole('button', { name: /delete comment c3/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete comment c3/i }));
    await waitFor(() => expect(deleted).toBe('c3'));
  });
});
