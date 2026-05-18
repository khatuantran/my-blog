import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostCard } from '@/components/feed/PostCard';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';
import { makePost } from '../../_helpers/post-factory';

const API_URL = 'http://localhost:3001';

beforeEach(() => {
  mswServer.use(
    http.post(`${API_URL}/posts/:id/like`, () =>
      HttpResponse.json({ data: { liked: true, count: 1 } }),
    ),
    http.post(`${API_URL}/posts/:id/save`, () => HttpResponse.json({ data: { saved: true } })),
  );
});

describe('PostCard', () => {
  it('renders author username + mood + content + counts', () => {
    const post = makePost({
      id: 'p1',
      content: 'hello world',
      counts: { likes: 5, comments: 3 },
      tags: [{ id: 't1', name: 'code', color: '#00FFE5' }],
    });
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    expect(screen.getByText('~/admin')).toBeInTheDocument();
    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // like count
    expect(screen.getByText('3')).toBeInTheDocument(); // comment count
    expect(screen.getByText('#code')).toBeInTheDocument();
  });

  it('click like → optimistic update count++', async () => {
    const user = userEvent.setup();
    const post = makePost({ id: 'p1', counts: { likes: 5, comments: 0 }, liked: false });
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    const likeBtn = screen.getByRole('button', { name: /like post/i });
    expect(likeBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(likeBtn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /unlike post/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  it('click save → toggle saved state', async () => {
    const user = userEvent.setup();
    const post = makePost({ id: 'p1', saved: false });
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    const saveBtn = screen.getByRole('button', { name: /save post/i });
    await user.click(saveBtn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /unsave post/i })).toBeInTheDocument();
    });
  });

  it('comment link navigates to /post/:id', () => {
    const post = makePost({ id: 'abc123', counts: { likes: 0, comments: 7 } });
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    const link = screen.getByLabelText(/view 7 comments/i);
    expect(link).toHaveAttribute('href', '/post/abc123');
  });

  it('hiển thị ImageGrid + FileAttachments khi post có media', () => {
    const post = makePost({
      id: 'p1',
      images: [
        { id: 'i1', url: 'https://cdn/1.jpg', publicId: '1', width: 1, height: 1, order: 0 },
      ],
      files: [
        {
          id: 'f1',
          name: 'doc.pdf',
          type: 'PDF',
          size: 1024,
          url: 'https://cdn/1.pdf',
          publicId: '1',
        },
      ],
    });
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    expect(screen.getByText('// attachments')).toBeInTheDocument();
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
  });
});
