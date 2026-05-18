import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '@/components/feed/FilterBar';

describe('FilterBar', () => {
  it('renders All + 5 mood buttons + Latest sort', () => {
    render(<FilterBar activeMood={null} total={42} onMoodFilter={vi.fn()} />);
    expect(screen.getByText('// feed.posts · 42 total')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /happy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sad/i })).toBeInTheDocument();
  });

  it('click mood button → onMoodFilter với mood key', async () => {
    const user = userEvent.setup();
    const onFilter = vi.fn();
    render(<FilterBar activeMood={null} onMoodFilter={onFilter} />);
    await user.click(screen.getByRole('button', { name: /happy/i }));
    expect(onFilter).toHaveBeenCalledWith('HAPPY');
  });

  it('click active mood → onMoodFilter(null) toggle off', async () => {
    const user = userEvent.setup();
    const onFilter = vi.fn();
    render(<FilterBar activeMood="HAPPY" onMoodFilter={onFilter} />);
    await user.click(screen.getByRole('button', { name: /happy/i }));
    expect(onFilter).toHaveBeenCalledWith(null);
  });

  it('hiển thị badge filter active trong header', () => {
    render(<FilterBar activeMood="EXCITED" total={10} onMoodFilter={vi.fn()} />);
    expect(screen.getByText(/filtered:.*excited/i)).toBeInTheDocument();
  });
});
