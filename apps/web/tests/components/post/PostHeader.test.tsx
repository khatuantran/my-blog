import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostHeader } from '@/components/post/PostHeader';
import { TestProviders } from '../../_helpers/test-providers';
import { makePost } from '../../_helpers/post-factory';

describe('PostHeader (T-453)', () => {
  it('tên author là Link → /profile/:username; chưa có name → username làm tên + ~/handle row', () => {
    render(
      <TestProviders>
        <PostHeader post={makePost({ id: 'p1' })} />
      </TestProviders>,
    );
    const link = screen.getByTestId('post-author-link');
    // Author chưa đặt name → username làm tên (line 1, KHÔNG ~/ prefix)
    expect(link).toHaveTextContent('admin');
    expect(link).toHaveAttribute('href', '/profile/admin');
    // Handle row riêng (cyan) + role badge — mirror profile hero
    expect(screen.getByText('~/admin')).toHaveClass('text-cyan');
    expect(screen.getByText('[ ADMIN ]')).toBeInTheDocument();
  });

  it('hiển thị name (tên) + ~/username + [ ROLE ] giống profile hero — FR-11.8', () => {
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
    // Line 1: tên = display name (KHÔNG kèm handle), link → profile
    expect(link).toHaveTextContent('Trần Tuấn Kha');
    expect(link).not.toHaveTextContent('~/admin');
    expect(link).toHaveAttribute('href', '/profile/admin');
    // Line 1: role badge; Line 2: ~/handle cyan
    expect(screen.getByText('[ ADMIN ]')).toBeInTheDocument();
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
