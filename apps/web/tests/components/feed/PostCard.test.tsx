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
    http.post(`${API_URL}/posts/:id/reactions`, () =>
      HttpResponse.json({
        data: {
          type: 'LIKE',
          totalCounts: { LIKE: 1, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
          topThree: ['LIKE'],
        },
      }),
    ),
    http.post(`${API_URL}/posts/:id/save`, () => HttpResponse.json({ data: { saved: true } })),
  );
});

describe('PostCard', () => {
  it('renders author username + mood + content + counts', () => {
    const post = makePost({
      id: 'p1',
      content: 'hello world',
      counts: { reactions: 5, comments: 3 },
      topReactions: ['LIKE', 'LOVE'],
      tags: [{ id: 't1', name: 'code', color: '#00FFE5' }],
    });
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    expect(screen.getByText('~/admin')).toBeInTheDocument();
    expect(screen.getByText('hello world')).toBeInTheDocument();
    // T-358 polish (2026-05-26): reaction count merged into React button as `· N`.
    expect(screen.getByText('· 5')).toBeInTheDocument(); // reaction count
    expect(screen.getByText('3')).toBeInTheDocument(); // comment count
    expect(screen.getByText('#code')).toBeInTheDocument();
  });

  it('click react → optimistic LIKE applied + aria-pressed=true', async () => {
    const user = userEvent.setup();
    const post = makePost({ id: 'p1', counts: { reactions: 5, comments: 0 }, myReaction: null });
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    const reactBtn = screen.getByTestId('reaction-button-p1');
    expect(reactBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(reactBtn);
    await waitFor(() => {
      expect(screen.getByTestId('reaction-button-p1')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('regression T-354: SaveButton REMOVED từ action row (moved to PostActionMenu)', () => {
    const post = makePost({ id: 'p1', saved: false });
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    // SaveButton standalone đã được move sang PostActionMenu (T-354 refactor)
    expect(screen.queryByRole('button', { name: /save post/i })).not.toBeInTheDocument();
    // ⋯ More actions trigger present (opens PostActionMenu containing Save)
    expect(screen.getByTestId('post-action-trigger-p1')).toBeInTheDocument();
  });

  it('regression T-354: ⋯ button toggles PostActionMenu', async () => {
    const user = userEvent.setup();
    const post = makePost({ id: 'p1' });
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    expect(screen.queryByTestId('post-action-menu-p1')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('post-action-trigger-p1'));
    expect(screen.getByTestId('post-action-menu-p1')).toBeInTheDocument();
  });

  it('regression FR-04.7: comment button opens CommentsModal (NOT navigate to /post/:id)', async () => {
    const post = makePost({ id: 'abc123', counts: { reactions: 0, comments: 7 } });
    const user = userEvent.setup();
    render(
      <TestProviders>
        <PostCard post={post} />
      </TestProviders>,
    );
    const btn = screen.getByLabelText(/view 7 comments/i);
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).not.toHaveAttribute('href');
    // Modal not yet rendered
    expect(screen.queryByTestId('comments-modal')).not.toBeInTheDocument();
    await user.click(btn);
    // Modal opens after click
    await waitFor(() => {
      expect(screen.getByTestId('comments-modal')).toBeInTheDocument();
    });
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
