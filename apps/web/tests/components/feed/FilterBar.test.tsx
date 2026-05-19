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

  it('Sort dropdown disabled khi không có onSortChange', () => {
    render(<FilterBar activeMood={null} onMoodFilter={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /sort order/i });
    expect(btn).toBeDisabled();
  });

  it('Sort dropdown — click button mở listbox với 3 options', async () => {
    const user = userEvent.setup();
    render(<FilterBar activeMood={null} onMoodFilter={vi.fn()} onSortChange={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /sort order/i });
    expect(btn).toHaveTextContent(/latest/i);
    await user.click(btn);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /latest/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /oldest/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /most liked/i })).toBeInTheDocument();
  });

  it('Click option → onSortChange với value + dropdown close', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(<FilterBar activeMood={null} onMoodFilter={vi.fn()} onSortChange={onSort} />);
    await user.click(screen.getByRole('button', { name: /sort order/i }));
    await user.click(screen.getByRole('option', { name: /most liked/i }));
    expect(onSort).toHaveBeenCalledWith('likes');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('Sort prop=likes → label hiển thị "Most liked"', () => {
    render(
      <FilterBar activeMood={null} sort="likes" onMoodFilter={vi.fn()} onSortChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /sort order/i })).toHaveTextContent(/most liked/i);
  });
});
