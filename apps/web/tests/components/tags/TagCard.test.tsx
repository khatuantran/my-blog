import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TagCard } from '@/components/tags/TagCard';
import type { TagWithStats } from '@/types/api';

const TAG: TagWithStats = {
  id: 't1',
  name: 'code',
  color: '#00FFE5',
  description: 'Lập trình, debug',
  postCount: 12,
  sparkline7d: [0, 1, 2, 1, 3, 2, 4],
  createdAt: '2026-05-01T00:00:00.000Z',
};

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('TagCard', () => {
  it('grid variant — render name + count + description + progress bar', () => {
    wrap(<TagCard tag={TAG} maxCount={20} />);
    expect(screen.getByText('code')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/Lập trình, debug/)).toBeInTheDocument();
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '60');
  });

  it('click card → navigate /?tag={name without #}', () => {
    wrap(<TagCard tag={{ ...TAG, name: '#code' }} maxCount={20} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/?tag=code');
  });

  it('non-admin → no Edit/Delete buttons rendered', () => {
    wrap(<TagCard tag={TAG} maxCount={20} />);
    expect(screen.queryByRole('button', { name: /edit tag/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete tag/i })).not.toBeInTheDocument();
  });

  it('admin variant → Edit + Delete buttons fire callbacks', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    wrap(<TagCard tag={TAG} maxCount={20} isAdmin onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /edit tag code/i }));
    expect(onEdit).toHaveBeenCalledWith(TAG);
    fireEvent.click(screen.getByRole('button', { name: /delete tag code/i }));
    expect(onDelete).toHaveBeenCalledWith(TAG);
  });

  it('list variant — flex-row layout với sparkline + count', () => {
    wrap(<TagCard tag={TAG} maxCount={20} variant="list" />);
    expect(screen.getByText('code')).toBeInTheDocument();
    expect(screen.getByText('12 posts')).toBeInTheDocument();
  });
});
