import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeatmapGrid } from '@/components/shared/HeatmapGrid';

const days = Array.from({ length: 28 }, (_, i) => ({
  date: `2026-05-${String(i + 1).padStart(2, '0')}`,
  count: i % 4,
}));

describe('HeatmapGrid', () => {
  it('renders 28 grid cells', () => {
    render(<HeatmapGrid cells={days} />);
    const grid = screen.getByRole('grid', { name: /28-day activity heatmap/i });
    expect(grid).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(28);
  });

  it('cell aria-label = "{date} · {count} posts"', () => {
    render(<HeatmapGrid cells={days} />);
    expect(screen.getByLabelText(/2026-05-04 · 3 posts/i)).toBeInTheDocument();
  });

  it('count=0 vs count=3 có background khác', () => {
    render(<HeatmapGrid cells={days} />);
    const zero = screen.getByLabelText(/2026-05-01 · 0 posts/i);
    const three = screen.getByLabelText(/2026-05-04 · 3 posts/i);
    expect(zero.style.background).not.toBe(three.style.background);
  });
});
