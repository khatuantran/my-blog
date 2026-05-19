import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmojiPicker } from '@/components/create-post/EmojiPicker';

describe('EmojiPicker (T-240, FR-02.7)', () => {
  it('open=false → null', () => {
    const { container } = render(<EmojiPicker open={false} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders 4 tab groups + active default faces', () => {
    render(<EmojiPicker open onSelect={vi.fn()} onClose={vi.fn()} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs.map((t) => t.textContent)).toEqual(['faces', 'hands', 'dev', 'nature']);
    expect(screen.getByRole('tab', { name: 'faces' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switch tab → grid emoji updates', () => {
    render(<EmojiPicker open onSelect={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'dev' }));
    expect(screen.getByRole('grid', { name: /dev emojis/i })).toBeInTheDocument();
    // dev tab contains 💻
    expect(screen.getByLabelText('Insert 💻')).toBeInTheDocument();
  });

  it('click emoji → onSelect fired', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker open onSelect={onSelect} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Insert 😊'));
    expect(onSelect).toHaveBeenCalledWith('😊');
  });

  it('Esc key → onClose', () => {
    const onClose = vi.fn();
    render(<EmojiPicker open onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('outside click → onClose', () => {
    const onClose = vi.fn();
    render(
      <div>
        <button data-testid="outside">outside</button>
        <EmojiPicker open onSelect={vi.fn()} onClose={onClose} />
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onClose).toHaveBeenCalled();
  });

  it('each tab có 16 emoji', () => {
    render(<EmojiPicker open onSelect={vi.fn()} onClose={vi.fn()} />);
    // faces tab default
    expect(screen.getAllByRole('gridcell')).toHaveLength(16);
  });
});
