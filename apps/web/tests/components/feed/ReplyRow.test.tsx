import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReplyRow } from '@/components/feed/ReplyRow';
import { TestProviders } from '../../_helpers/test-providers';
import type { Comment } from '@/types/api';

function makeReply(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'r1',
    postId: 'p1',
    content: 'this is a reply',
    status: 'APPROVED',
    author: { id: 'u2', username: 'bob', role: 'USER', avatarUrl: null },
    anonymousName: null,
    likeCount: 3,
    parentId: 'c1',
    replyTo: { username: 'alice', isAnon: false },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ReplyRow (T-350)', () => {
  it('1. render reply content + author + replyTo @parent + like button', () => {
    const reply = makeReply();
    render(
      <TestProviders>
        <ReplyRow reply={reply} />
      </TestProviders>,
    );
    expect(screen.getByTestId('reply-r1')).toBeInTheDocument();
    expect(screen.getByText('this is a reply')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    // replyTo display
    expect(screen.getByText('@alice')).toBeInTheDocument();
    // Like button
    expect(screen.getByLabelText(/like reply/i)).toBeInTheDocument();
  });

  it('2. anonymous reply → render "Anon · <name>" + KHÔNG show replyTo nếu null', () => {
    const reply = makeReply({
      author: null,
      anonymousName: 'Guest',
      replyTo: null,
    });
    render(
      <TestProviders>
        <ReplyRow reply={reply} />
      </TestProviders>,
    );
    expect(screen.getByText(/Anon · Guest/i)).toBeInTheDocument();
    expect(screen.queryByText(/replying|↩/)).not.toBeInTheDocument();
  });
});
