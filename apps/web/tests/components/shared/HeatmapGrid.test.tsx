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

  it('T-414: compact variant renders day labels M/T/W/T/F/S/S + KHÔNG less/more legend (design L702-711)', () => {
    render(<HeatmapGrid cells={days} />);
    // 7 day labels render
    const compact = screen.getByTestId('heatmap-compact');
    expect(compact).toBeInTheDocument();
    // Less/more legend KHÔNG render trong compact variant
    expect(screen.queryByText('less')).toBeNull();
    expect(screen.queryByText('more')).toBeNull();
  });

  it('T-413: large variant renders day labels + less/more legend', () => {
    render(<HeatmapGrid cells={days} variant="large" />);
    expect(screen.getByTestId('heatmap-large')).toBeInTheDocument();
    expect(screen.getByText('less')).toBeInTheDocument();
    expect(screen.getByText('more')).toBeInTheDocument();
  });
});
