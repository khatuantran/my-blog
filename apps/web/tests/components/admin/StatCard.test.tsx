import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/admin/StatCard';

describe('StatCard', () => {
  it('renders label + value', () => {
    render(<StatCard label="POSTS" value={42} color="#00FFE5" />);
    expect(screen.getByText('POSTS')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('positive delta hiển thị "+N today"', () => {
    render(<StatCard label="LIKES" value="287" delta={24} color="#FF6E96" />);
    expect(screen.getByText('+24 today')).toBeInTheDocument();
  });

  it('zero delta hiển thị "±0 today"', () => {
    render(<StatCard label="X" value={0} delta={0} color="#fff" />);
    expect(screen.getByText('±0 today')).toBeInTheDocument();
  });

  it('renders Sparkline khi data provided', () => {
    const { container } = render(
      <StatCard label="VIEWS" value="1.2k" color="#9ECE6A" sparkline={[1, 3, 2, 5, 8]} />,
    );
    expect(container.querySelector('svg polyline')).not.toBeNull();
  });
});
