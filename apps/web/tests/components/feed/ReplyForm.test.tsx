import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReplyForm } from '@/components/feed/ReplyForm';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';

const API_URL = 'http://localhost:3001';

function createOk() {
  return http.post(`${API_URL}/posts/:postId/comments`, async ({ request }) => {
    const body = (await request.json()) as { content: string; parentId?: string };
    return HttpResponse.json(
      {
        data: {
          id: 'new-reply',
          postId: 'p1',
          content: body.content,
          status: 'APPROVED',
          author: { id: 'u1', username: 'alice', role: 'USER', avatarUrl: null },
          anonymousName: null,
          likesCount: 0,
          parentId: body.parentId ?? null,
          replyTo: body.parentId ? { username: 'parentuser', isAnon: false } : null,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  });
}

describe('ReplyForm (T-350)', () => {
  beforeEach(() => {
    mswServer.use(createOk());
  });

  it('1. render header "↩ replying to @parentuser" + textarea focus', () => {
    render(
      <TestProviders>
        <ReplyForm postId="p1" parentId="c1" parentUsername="parentuser" onClose={() => {}} />
      </TestProviders>,
    );
    expect(screen.getByTestId('reply-form-c1')).toBeInTheDocument();
    expect(screen.getByText(/replying to/i)).toBeInTheDocument();
    expect(screen.getByText('@parentuser')).toBeInTheDocument();
    // Textarea auto-focused
    expect(screen.getByTestId('reply-textarea-c1')).toHaveFocus();
  });

  it('2. submit via Cmd+Enter shortcut → createComment with parentId', async () => {
    const user = userEvent.setup();
    let closed = false;
    render(
      <TestProviders>
        <ReplyForm
          postId="p1"
          parentId="c1"
          parentUsername="parentuser"
          onClose={() => (closed = true)}
        />
      </TestProviders>,
    );
    const textarea = screen.getByTestId('reply-textarea-c1');
    await user.type(textarea, 'My reply');
    // Cmd+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
    await waitFor(() => {
      expect(closed).toBe(true);
    });
  });

  it('3. Esc key → onClose called', () => {
    let closed = false;
    render(
      <TestProviders>
        <ReplyForm
          postId="p1"
          parentId="c1"
          parentUsername="parentuser"
          onClose={() => (closed = true)}
        />
      </TestProviders>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);
  });

  it('4. Cancel button → onClose called (KHÔNG submit)', async () => {
    let closed = false;
    const user = userEvent.setup();
    render(
      <TestProviders>
        <ReplyForm
          postId="p1"
          parentId="c1"
          parentUsername="parentuser"
          onClose={() => (closed = true)}
        />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('reply-cancel-c1'));
    expect(closed).toBe(true);
  });
});
