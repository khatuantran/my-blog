import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostHeader } from '@/components/post/PostHeader';
import { TestProviders } from '../../_helpers/test-providers';
import { makePost } from '../../_helpers/post-factory';

describe('PostHeader (T-453)', () => {
  it('tên author là Link → /profile/:username', () => {
    render(
      <TestProviders>
        <PostHeader post={makePost({ id: 'p1' })} />
      </TestProviders>,
    );
    const link = screen.getByTestId('post-author-link');
    expect(link).toHaveTextContent('~/admin');
    expect(link).toHaveAttribute('href', '/profile/admin');
  });

  it('hiển thị CẢ full name + ~/username (highlight) khi author có name — FR-11.8', () => {
    render(
      <TestProviders>
        <PostHeader
          post={makePost({
            author: {
              id: 'u1',
              username: 'admin',
              name: 'Trần Tuấn Kha',
              role: 'ADMIN',
              avatarUrl: null,
            },
          })}
        />
      </TestProviders>,
    );
    const link = screen.getByTestId('post-author-link');
    expect(link).toHaveTextContent('Trần Tuấn Kha');
    expect(link).toHaveTextContent('~/admin');
    expect(link).toHaveAttribute('href', '/profile/admin');
    // ~/username được highlight (cyan) khi đã có name
    expect(screen.getByText('~/admin')).toHaveClass('text-cyan');
  });

  it('click avatar → mở popup phóng to; × đóng', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <PostHeader post={makePost({ id: 'p1' })} />
      </TestProviders>,
    );
    expect(screen.queryByTestId('avatar-preview')).toBeNull();
    await user.click(screen.getByTestId('post-avatar-btn'));
    expect(screen.getByTestId('avatar-preview')).toBeInTheDocument();
    await user.click(screen.getByTestId('avatar-preview-close'));
    expect(screen.queryByTestId('avatar-preview')).toBeNull();
  });
});
