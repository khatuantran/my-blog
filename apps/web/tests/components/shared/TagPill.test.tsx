import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagPill } from '@/components/shared/TagPill';

describe('TagPill', () => {
  it('renders với # prefix khi name không có', () => {
    render(<TagPill name="code" />);
    expect(screen.getByText('#code')).toBeInTheDocument();
  });

  it('giữ nguyên # khi name đã có', () => {
    render(<TagPill name="#dev" />);
    expect(screen.getByText('#dev')).toBeInTheDocument();
  });

  it('non-interactive: không có role=button', () => {
    render(<TagPill name="x" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('onClick prop → role=button + invoke khi click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TagPill name="ai" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
