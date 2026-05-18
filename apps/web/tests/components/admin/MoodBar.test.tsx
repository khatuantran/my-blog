import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoodBar } from '@/components/admin/MoodBar';

describe('MoodBar', () => {
  it('renders emoji + label + count + percent', () => {
    render(<MoodBar mood="HAPPY" count={12} total={42} />);
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('12', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/29%/)).toBeInTheDocument(); // 12/42 ≈ 29%
  });

  it('progressbar aria-valuenow phản ánh percent', () => {
    render(<MoodBar mood="EXCITED" count={5} total={10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('total = 0 → 0% (no division by zero)', () => {
    render(<MoodBar mood="CALM" count={0} total={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
