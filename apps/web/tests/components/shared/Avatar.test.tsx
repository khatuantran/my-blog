import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '@/components/shared/Avatar';

describe('Avatar', () => {
  it('renders initial uppercase từ username', () => {
    render(<Avatar username="khan" />);
    expect(screen.getByLabelText('khan avatar')).toHaveTextContent('K');
  });

  it('fallback "?" khi không có username', () => {
    render(<Avatar />);
    expect(screen.getByLabelText('Avatar')).toHaveTextContent('?');
  });

  it('renders <img> khi avatarUrl provided', () => {
    const { container } = render(<Avatar username="x" avatarUrl="https://cdn/me.jpg" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://cdn/me.jpg');
  });

  it('online dot xuất hiện khi prop online=true', () => {
    const { container, rerender } = render(<Avatar username="a" />);
    expect(container.querySelectorAll('span[aria-hidden]').length).toBe(0);

    rerender(<Avatar username="a" online />);
    expect(container.querySelectorAll('span[aria-hidden]').length).toBe(1);
  });
});
