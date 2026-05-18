import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { CommentList } from '@/components/comment/CommentList';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';

const API_URL = 'http://localhost:3001';

function makeComment(id: string, content: string) {
  return {
    id,
    postId: 'p1',
    content,
    status: 'APPROVED',
    author: { id: 'u1', username: 'user1', role: 'USER', avatarUrl: null },
    anonymousName: null,
    likeCount: 0,
    liked: false,
    createdAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  mswServer.resetHandlers();
});

describe('CommentList', () => {
  it('empty state khi GET trả 0 items', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/p1/comments`, () =>
        HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 10 } }),
      ),
    );

    render(
      <TestProviders>
        <CommentList postId="p1" />
      </TestProviders>,
    );

    expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('renders 2 CommentItem từ API', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/p1/comments`, () =>
        HttpResponse.json({
          data: {
            items: [makeComment('c1', 'first'), makeComment('c2', 'second')],
            total: 2,
            page: 1,
            limit: 10,
          },
        }),
      ),
    );

    render(
      <TestProviders>
        <CommentList postId="p1" />
      </TestProviders>,
    );

    expect(await screen.findByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('error state khi GET fail', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/p1/comments`, () =>
        HttpResponse.json({ error: { code: 'X' } }, { status: 500 }),
      ),
    );

    render(
      <TestProviders>
        <CommentList postId="p1" />
      </TestProviders>,
    );

    expect(await screen.findByText(/failed to load comments/i)).toBeInTheDocument();
  });
});
