import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { PostStatus } from '@/lib/status-config';

describe('StatusBadge', () => {
  it('renders PUBLISHED với text `[ PUBLISHED ]` + color #9ECE6A', () => {
    render(<StatusBadge variant="post" status="PUBLISHED" />);
    const el = screen.getByText(/\[ PUBLISHED \]/);
    expect(el).toBeInTheDocument();
    expect(el).toHaveStyle({ color: '#9ECE6A' });
    expect(el).toHaveStyle({ opacity: '1' });
  });

  it('renders DRAFT với color #E0AF68', () => {
    render(<StatusBadge variant="post" status="DRAFT" />);
    const el = screen.getByText(/\[ DRAFT \]/);
    expect(el).toHaveStyle({ color: '#E0AF68' });
  });

  it('renders ARCHIVED với opacity 0.8 + color #566176', () => {
    render(<StatusBadge variant="post" status="ARCHIVED" />);
    const el = screen.getByText(/\[ ARCHIVED \]/);
    expect(el).toHaveStyle({ color: '#566176' });
    expect(el).toHaveStyle({ opacity: '0.8' });
  });

  it('returns null khi status không hợp lệ', () => {
    const { container } = render(<StatusBadge variant="post" status={'UNKNOWN' as PostStatus} />);
    expect(container).toBeEmptyDOMElement();
  });
});
