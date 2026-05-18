import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline } from '@/components/shared/Sparkline';

describe('Sparkline', () => {
  it('returns null khi data empty', () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders SVG với polyline + circle endpoint', () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 5, 8]} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(container.querySelector('polyline')).not.toBeNull();
    expect(container.querySelector('circle')).not.toBeNull();
  });

  it('aria-label "Sparkline"', () => {
    render(<Sparkline data={[1, 2]} />);
    expect(screen.getByRole('img', { name: /sparkline/i })).toBeInTheDocument();
  });
});
