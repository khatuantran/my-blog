import { describe, expect, it, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostActionMenu } from '@/components/feed/PostActionMenu';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';
import { makePost } from '../../_helpers/post-factory';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = 'http://localhost:3001';

beforeEach(() => {
  // Reset auth to guest (avoid cross-test pollution from Zustand global store)
  useAuthStore.getState().clear();
  mswServer.use(
    http.post(`${API_URL}/posts/:id/save`, () => HttpResponse.json({ data: { saved: true } })),
    http.delete(`${API_URL}/posts/:id/save`, () => new HttpResponse(null, { status: 204 })),
  );
});

describe('PostActionMenu (T-356)', () => {
  it('1. authed: render header + 3 user actions (Open detail / Copy link / Save)', () => {
    useAuthStore.setState({
      status: 'authed',
      user: {
        id: 'viewer-1',
        username: 'viewer',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const post = makePost({ id: 'abc1234567' });
    render(
      <TestProviders>
        <PostActionMenu post={post} onClose={() => {}} />
      </TestProviders>,
    );
    expect(screen.getByTestId(`post-action-menu-${post.id}`)).toBeInTheDocument();
    expect(screen.getByText('// post.actions')).toBeInTheDocument();
    expect(screen.getByTestId('action-open-detail')).toBeInTheDocument();
    expect(screen.getByTestId('action-copy-link')).toBeInTheDocument();
    expect(screen.getByTestId('action-toggle-save')).toBeInTheDocument();
  });

  it('1b. anonymous: KHÔNG render Save post (FR-03.3 — save chỉ auth user)', () => {
    // beforeEach clear → guest
    const post = makePost({ id: 'p1' });
    render(
      <TestProviders>
        <PostActionMenu post={post} onClose={() => {}} />
      </TestProviders>,
    );
    expect(screen.getByTestId('action-open-detail')).toBeInTheDocument();
    expect(screen.getByTestId('action-copy-link')).toBeInTheDocument();
    expect(screen.queryByTestId('action-toggle-save')).toBeNull();
  });

  it('2. non-admin non-owner: KHÔNG render admin + danger sections', () => {
    // Default TestProviders user role + post author đều khác user.id
    const post = makePost({
      id: 'p1',
      author: { id: 'other-user', username: 'other', role: 'USER', avatarUrl: null },
    });
    render(
      <TestProviders>
        <PostActionMenu post={post} onClose={() => {}} />
      </TestProviders>,
    );
    expect(screen.queryByTestId('action-edit')).not.toBeInTheDocument();
    expect(screen.queryByTestId('action-delete')).not.toBeInTheDocument();
  });

  it('3. click outside → onClose called', () => {
    let closed = false;
    render(
      <TestProviders>
        <div data-testid="outside">outside element</div>
        <PostActionMenu post={makePost({ id: 'p1' })} onClose={() => (closed = true)} />
      </TestProviders>,
    );
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(closed).toBe(true);
  });

  it('4. click Open detail → onClose + navigate (button works)', async () => {
    let closed = false;
    const user = userEvent.setup();
    render(
      <TestProviders>
        <PostActionMenu post={makePost({ id: 'p1' })} onClose={() => (closed = true)} />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('action-open-detail'));
    expect(closed).toBe(true);
  });

  it('5. click Copy link → clipboard API called + feedback "Copied!" hiển thị', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText },
    });

    const post = makePost({ id: 'abc12345' });
    render(
      <TestProviders>
        <PostActionMenu post={post} onClose={() => {}} />
      </TestProviders>,
    );
    fireEvent.click(screen.getByTestId('action-copy-link'));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining(`/post/${post.id}`));
    });
    await waitFor(() => {
      expect(screen.getByTestId('action-copy-link')).toHaveTextContent('Copied!');
    });
  });

  it('6. click Save post → toggle save mutation called', async () => {
    useAuthStore.setState({
      status: 'authed',
      user: {
        id: 'viewer-1',
        username: 'viewer',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    let closed = false;
    const user = userEvent.setup();
    const post = makePost({ id: 'p1', saved: false });
    render(
      <TestProviders>
        <PostActionMenu post={post} onClose={() => (closed = true)} />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('action-toggle-save'));
    await waitFor(() => {
      expect(closed).toBe(true);
    });
  });
});
