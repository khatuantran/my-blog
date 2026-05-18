import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentForm } from '@/components/comment/CommentForm';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';

const API_URL = 'http://localhost:3001';

function makeComment(content: string, anonymousName?: string) {
  return {
    id: 'c1',
    postId: 'p1',
    content,
    status: 'APPROVED',
    author: null,
    anonymousName: anonymousName ?? null,
    likeCount: 0,
    liked: false,
    createdAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  mswServer.resetHandlers();
});

describe('CommentForm', () => {
  it('renders textarea + send button + as: ~/admin (authed default)', () => {
    render(
      <TestProviders>
        <CommentForm postId="p1" />
      </TestProviders>,
    );
    expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    expect(screen.getByText('~/admin')).toBeInTheDocument();
  });

  it('Send disabled khi content empty', () => {
    render(
      <TestProviders>
        <CommentForm postId="p1" />
      </TestProviders>,
    );
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('toggle [as anon] hiển thị anonName input + Send disabled khi anonName empty', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CommentForm postId="p1" />
      </TestProviders>,
    );
    await user.click(screen.getByRole('button', { name: /as anon/i }));
    expect(screen.getByPlaceholderText(/anon#/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/comment text/i), 'hello');
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/anonymous name/i), 'Bob');
    expect(screen.getByRole('button', { name: /send/i })).toBeEnabled();
  });

  it('submit → POST /posts/:id/comments với body + clear content', async () => {
    const user = userEvent.setup();
    const received: unknown[] = [];
    mswServer.use(
      http.post(`${API_URL}/posts/p1/comments`, async ({ request }) => {
        received.push(await request.json());
        return HttpResponse.json({ data: makeComment('hello') });
      }),
    );

    render(
      <TestProviders>
        <CommentForm postId="p1" />
      </TestProviders>,
    );
    await user.type(screen.getByLabelText(/comment text/i), 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(received).toEqual([{ content: 'hello' }]);
    });
    await waitFor(() => {
      expect((screen.getByLabelText(/comment text/i) as HTMLTextAreaElement).value).toBe('');
    });
  });

  it('submit với as-anon: body kèm anonymousName', async () => {
    const user = userEvent.setup();
    const received: unknown[] = [];
    mswServer.use(
      http.post(`${API_URL}/posts/p1/comments`, async ({ request }) => {
        received.push(await request.json());
        return HttpResponse.json({ data: makeComment('hi', 'Bob') });
      }),
    );

    render(
      <TestProviders>
        <CommentForm postId="p1" />
      </TestProviders>,
    );
    await user.click(screen.getByRole('button', { name: /as anon/i }));
    await user.type(screen.getByLabelText(/comment text/i), 'hi');
    await user.type(screen.getByLabelText(/anonymous name/i), 'Bob');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(received).toEqual([{ content: 'hi', anonymousName: 'Bob' }]);
    });
  });

  it('error response → hiển thị error message', async () => {
    const user = userEvent.setup();
    mswServer.use(
      http.post(`${API_URL}/posts/p1/comments`, () =>
        HttpResponse.json({ error: { code: 'X' } }, { status: 400 }),
      ),
    );

    render(
      <TestProviders>
        <CommentForm postId="p1" />
      </TestProviders>,
    );
    await user.type(screen.getByLabelText(/comment text/i), 'oops');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to post comment/i)).toBeInTheDocument();
    });
  });
});
