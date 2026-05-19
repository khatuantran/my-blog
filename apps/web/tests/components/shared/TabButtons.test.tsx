import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabButtons } from '@/components/shared/TabButtons';

const TABS = [
  { value: 'posts' as const, label: 'Posts' },
  { value: 'saved' as const, label: 'Saved' },
  { value: 'activity' as const, label: 'Activity' },
];

describe('TabButtons', () => {
  it('renders tabs với aria-selected', () => {
    render(<TabButtons value="posts" tabs={TABS} onChange={vi.fn()} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Posts' })).toHaveAttribute('aria-selected', 'true');
  });

  it('hidden tab → omitted', () => {
    render(
      <TabButtons
        value="posts"
        tabs={[...TABS, { value: 'about' as const, label: 'About', hidden: true }]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole('tab', { name: 'About' })).not.toBeInTheDocument();
  });

  it('click → onChange với value', () => {
    const onChange = vi.fn();
    render(<TabButtons value="posts" tabs={TABS} onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(onChange).toHaveBeenCalledWith('activity');
  });
});
