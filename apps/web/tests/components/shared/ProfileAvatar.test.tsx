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
});
