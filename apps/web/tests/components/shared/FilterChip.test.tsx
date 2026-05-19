import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterChip } from '@/components/shared/FilterChip';

describe('FilterChip', () => {
  it('renders inactive với aria-checked false', () => {
    render(<FilterChip>All</FilterChip>);
    const btn = screen.getByRole('checkbox', { name: /all/i });
    expect(btn).toHaveAttribute('aria-checked', 'false');
  });

  it('active=true → aria-checked true + cyan styles', () => {
    render(<FilterChip active>Saved</FilterChip>);
    const btn = screen.getByRole('checkbox', { name: /saved/i });
    expect(btn).toHaveAttribute('aria-checked', 'true');
    expect(btn.className).toMatch(/text-cyan/);
  });

  it('onClick fires khi click', () => {
    const onClick = vi.fn();
    render(<FilterChip onClick={onClick}>Files</FilterChip>);
    fireEvent.click(screen.getByRole('checkbox', { name: /files/i }));
    expect(onClick).toHaveBeenCalled();
  });
});
