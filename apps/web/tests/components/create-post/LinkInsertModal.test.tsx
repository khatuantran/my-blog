import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkInsertModal } from '@/components/create-post/LinkInsertModal';

describe('LinkInsertModal (T-369)', () => {
  it('renders when open, hidden when closed', () => {
    const { rerender } = render(
      <LinkInsertModal open={false} initialText="" onApply={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.queryByTestId('link-insert-modal')).toBeNull();
    rerender(<LinkInsertModal open initialText="" onApply={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('link-insert-modal')).toBeInTheDocument();
  });

  it('Cancel button calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LinkInsertModal open initialText="" onApply={vi.fn()} onClose={onClose} />);
    await user.click(screen.getByTestId('link-modal-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('insert with selection — pre-fills label, onApply called with url + label', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<LinkInsertModal open initialText="click here" onApply={onApply} onClose={onClose} />);
    expect((screen.getByTestId('link-modal-label') as HTMLInputElement).value).toBe('click here');
    await user.type(screen.getByTestId('link-modal-url'), 'https://example.com');
    await user.click(screen.getByTestId('link-modal-insert'));
    expect(onApply).toHaveBeenCalledWith('https://example.com', 'click here');
    expect(onClose).toHaveBeenCalled();
  });

  it('insert without selection — empty label, onApply called with url + empty label', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<LinkInsertModal open initialText="" onApply={onApply} onClose={onClose} />);
    expect((screen.getByTestId('link-modal-label') as HTMLInputElement).value).toBe('');
    await user.type(screen.getByTestId('link-modal-url'), 'https://example.com');
    await user.click(screen.getByTestId('link-modal-insert'));
    expect(onApply).toHaveBeenCalledWith('https://example.com', '');
    expect(onClose).toHaveBeenCalled();
  });
});
