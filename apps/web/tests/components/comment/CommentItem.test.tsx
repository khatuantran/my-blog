import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentItem } from '@/components/comment/CommentItem';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';
import type { Comment } from '@/types/api';

const API_URL = 'http://localhost:3001';

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'c1',
    postId: 'p1',
    content: 'hello world',
    status: 'APPROVED',
    author: { id: 'u1', username: 'user1', role: 'USER', avatarUrl: null },
    anonymousName: null,
    likeCount: 3,
    liked: false,
    createdAt: new Date('2026-05-18T11:55:00.000Z').toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  mswServer.use(
    http.post(`${API_URL}/comments/:id/like`, () =>
      HttpResponse.json({ data: { liked: true, count: 4 } }),
    ),
  );
});

describe('CommentItem', () => {
  it('renders authed author @username + content + like count', () => {
    render(
      <TestProviders>
        <CommentItem comment={makeComment()} />
      </TestProviders>,
    );
    expect(screen.getByText('@user1')).toBeInTheDocument();
    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('anonymous comment hiển thị "Anon · {name}"', () => {
    render(
      <TestProviders>
        <CommentItem comment={makeComment({ author: null, anonymousName: 'Bob' })} />
      </TestProviders>,
    );
    expect(screen.getByText('Anon · Bob')).toBeInTheDocument();
  });

  it('click like → optimistic flip + count++', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CommentItem comment={makeComment({ liked: false, likeCount: 3 })} />
      </TestProviders>,
    );
    const btn = screen.getByRole('button', { name: /like comment/i });
    await user.click(btn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /unlike comment/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('Reply button disabled (defer)', () => {
    render(
      <TestProviders>
        <CommentItem comment={makeComment()} />
      </TestProviders>,
    );
    expect(screen.getByRole('button', { name: /reply/i })).toBeDisabled();
  });
});
