import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoodPicker } from '@/components/create-post/MoodPicker';

describe('MoodPicker', () => {
  it('renders 7 mood radio buttons', () => {
    render(<MoodPicker value="HAPPY" onChange={vi.fn()} />);
    expect(screen.getAllByRole('radio').length).toBe(7);
  });

  it('active mood có aria-checked=true', () => {
    render(<MoodPicker value="EXCITED" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /excited/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /happy/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('click mood → onChange(mood)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoodPicker value="HAPPY" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /thoughtful/i }));
    expect(onChange).toHaveBeenCalledWith('THOUGHTFUL');
  });
});
