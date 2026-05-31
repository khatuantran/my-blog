import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    likesCount: 0,
    liked: false,
    createdAt: new Date().toISOString(),
  };
}

function mockComments(items: ReturnType<typeof makeComment>[]) {
  mswServer.use(
    http.get(`${API_URL}/posts/p1/comments`, () =>
      HttpResponse.json({ data: { items, total: items.length, page: 1, limit: 50 } }),
    ),
  );
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

  it('render comment theo đúng thứ tự BE trả (FR-03.7: BE desc = mới→cũ)', async () => {
    // BE trả mới→cũ; CommentList render trực tiếp (không reverse). c-new trước c-old.
    mockComments([makeComment('c2', 'newer'), makeComment('c1', 'older')]);
    render(
      <TestProviders>
        <CommentList postId="p1" />
      </TestProviders>,
    );
    const newer = await screen.findByText('newer');
    const older = screen.getByText('older');
    expect(newer.compareDocumentPosition(older) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('collapseAfter giới hạn N + nút show more / collapse toggle — FR-03.7', async () => {
    const items = Array.from({ length: 7 }, (_, i) => makeComment(`c${i}`, `comment-${i}`));
    mockComments(items);
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CommentList postId="p1" collapseAfter={5} />
      </TestProviders>,
    );
    // Mặc định chỉ 5 đầu hiện, 2 cuối ẩn
    expect(await screen.findByText('comment-4')).toBeInTheDocument();
    expect(screen.queryByText('comment-5')).toBeNull();
    expect(screen.queryByText('comment-6')).toBeNull();
    const toggle = screen.getByTestId('comments-toggle');
    expect(toggle).toHaveTextContent('show 2 more comments');
    // Expand → hiện hết + đổi label collapse
    await user.click(toggle);
    expect(screen.getByText('comment-5')).toBeInTheDocument();
    expect(screen.getByText('comment-6')).toBeInTheDocument();
    expect(toggle).toHaveTextContent('collapse comments');
    // Collapse lại → ẩn 2 cuối
    await user.click(toggle);
    expect(screen.queryByText('comment-6')).toBeNull();
  });

  it('collapseAfter không hiện toggle khi số comment ≤ N', async () => {
    mockComments([makeComment('c1', 'only-one')]);
    render(
      <TestProviders>
        <CommentList postId="p1" collapseAfter={5} />
      </TestProviders>,
    );
    expect(await screen.findByText('only-one')).toBeInTheDocument();
    expect(screen.queryByTestId('comments-toggle')).toBeNull();
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
