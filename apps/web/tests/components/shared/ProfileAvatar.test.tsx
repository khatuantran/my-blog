import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileAvatar } from '@/components/shared/ProfileAvatar';

describe('ProfileAvatar', () => {
  it('renders initial uppercase letter khi không có avatarUrl', () => {
    render(<ProfileAvatar username="kha" size={88} />);
    expect(screen.getByTestId('profile-avatar')).toHaveTextContent('K');
  });

  it('renders img khi có avatarUrl', () => {
    render(<ProfileAvatar username="kha" avatarUrl="https://e/x.jpg" size={88} />);
    const img = screen.getByRole('img', { name: /avatar of kha/i });
    expect(img).toHaveAttribute('src', 'https://e/x.jpg');
  });

  it('regression BUG-002: gradient ring + correct dasharray + border-rotate animation', () => {
    const { container } = render(<ProfileAvatar username="kha" size={88} />);
    expect(container.querySelector('linearGradient#avatarGrad')).toBeInTheDocument();
    expect(container.querySelector('circle')).toHaveAttribute('stroke-dasharray', '6 4');
    expect(container.querySelector('circle')).toHaveAttribute('stroke', 'url(#avatarGrad)');
    expect(container.querySelector('svg')).toHaveClass('animate-border-rotate');
  });

  it('regression BUG-002: online dot visible + animate-pulse khi online=true', () => {
    render(<ProfileAvatar username="kha" online={true} />);
    const dot = screen.getByTestId('profile-avatar-online-dot');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('animate-pulse');
  });

  it('regression BUG-002: online dot absent khi online=false (default)', () => {
    render(<ProfileAvatar username="kha" />);
    expect(screen.queryByTestId('profile-avatar-online-dot')).not.toBeInTheDocument();
  });
});
