import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentsModal } from '@/components/feed/CommentsModal';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';

const API_URL = 'http://localhost:3001';

function listOk(items: Array<{ id: string; content: string; anonymousName?: string | null }>) {
  return http.get(`${API_URL}/posts/:id/comments`, () =>
    HttpResponse.json({
      data: {
        items: items.map((c) => ({
          id: c.id,
          postId: 'p1',
          content: c.content,
          status: 'APPROVED',
          author:
            c.anonymousName === undefined
              ? { id: 'u1', username: 'alice', role: 'USER', avatarUrl: null }
              : null,
          anonymousName: c.anonymousName ?? null,
          likesCount: 0,
          parentId: null,
          replyTo: null,
          createdAt: new Date().toISOString(),
        })),
      },
    }),
  );
}

describe('CommentsModal (T-348)', () => {
  beforeEach(() => {
    mswServer.use(listOk([]));
  });

  it('1. open render header + close button + post excerpt', () => {
    render(
      <TestProviders>
        <CommentsModal postId="p1" postExcerpt="Bài viết test" onClose={() => {}} />
      </TestProviders>,
    );
    expect(screen.getByTestId('comments-modal')).toBeInTheDocument();
    expect(screen.getByText('// comments')).toBeInTheDocument();
    expect(screen.getByText('Bài viết test')).toBeInTheDocument();
    expect(screen.getByTestId('comments-modal-close')).toBeInTheDocument();
  });

  it('2. click close button → onClose called', async () => {
    let closed = false;
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CommentsModal postId="p1" onClose={() => (closed = true)} />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('comments-modal-close'));
    expect(closed).toBe(true);
  });

  it('3. click backdrop → onClose called (KHÔNG đóng khi click panel)', async () => {
    let closed = false;
    render(
      <TestProviders>
        <CommentsModal postId="p1" onClose={() => (closed = true)} />
      </TestProviders>,
    );
    // Click backdrop
    fireEvent.click(screen.getByTestId('comments-modal'));
    expect(closed).toBe(true);
  });

  it('4. Esc key → onClose called', () => {
    let closed = false;
    render(
      <TestProviders>
        <CommentsModal postId="p1" onClose={() => (closed = true)} />
      </TestProviders>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);
  });

  it('5. empty state + render list khi có items + CommentForm footer', async () => {
    mswServer.use(
      listOk([
        { id: 'c1', content: 'first comment' },
        { id: 'c2', content: 'second comment' },
      ]),
    );
    render(
      <TestProviders>
        <CommentsModal postId="p1" onClose={() => {}} />
      </TestProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText('first comment')).toBeInTheDocument();
    });
    expect(screen.getByText('second comment')).toBeInTheDocument();
    // CommentForm footer rendered
    expect(screen.getByLabelText('Add comment')).toBeInTheDocument();
  });
});
