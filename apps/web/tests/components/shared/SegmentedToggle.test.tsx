import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedToggle } from '@/components/shared/SegmentedToggle';

const OPTS = [
  { value: 'grid' as const, label: 'Grid', icon: '▦' },
  { value: 'list' as const, label: 'List', icon: '☰' },
];

describe('SegmentedToggle', () => {
  it('renders both options + active radio checked', () => {
    render(<SegmentedToggle value="grid" options={OPTS} onChange={vi.fn()} ariaLabel="View" />);
    const group = screen.getByRole('radiogroup', { name: /view/i });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /grid/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /list/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('click inactive option → onChange với value', () => {
    const onChange = vi.fn();
    render(<SegmentedToggle value="grid" options={OPTS} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /list/i }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});
