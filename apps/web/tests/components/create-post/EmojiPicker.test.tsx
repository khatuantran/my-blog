import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmojiPicker } from '@/components/create-post/EmojiPicker';

describe('EmojiPicker (T-366 inline refactor)', () => {
  it('open=false → null', () => {
    const { container } = render(<EmojiPicker open={false} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('T-366: renders 4 groups simultaneously (faces/hands/dev/nature) — no tabs', () => {
    // T-366 test-stale-assumption: was tabbed popup, now inline stack — all 4 groups visible at once.
    render(<EmojiPicker open onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryAllByRole('tab')).toHaveLength(0); // no tabs anymore
    expect(screen.getByTestId('emoji-picker-group-faces')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-picker-group-hands')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-picker-group-dev')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-picker-group-nature')).toBeInTheDocument();
  });

  it('T-366: 16 emojis per group (64 total gridcells across 4 groups)', () => {
    render(<EmojiPicker open onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getAllByRole('gridcell')).toHaveLength(64);
    // Spot-check one emoji per group
    expect(screen.getByLabelText('Insert 😊')).toBeInTheDocument(); // faces
    expect(screen.getByLabelText('Insert 👋')).toBeInTheDocument(); // hands
    expect(screen.getByLabelText('Insert 💻')).toBeInTheDocument(); // dev
    expect(screen.getByLabelText('Insert ☕')).toBeInTheDocument(); // nature
  });

  it('T-366: click emoji → onSelect fired with correct char', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker open onSelect={onSelect} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Insert 💻'));
    expect(onSelect).toHaveBeenCalledWith('💻');
  });

  it('T-366: × close button fires onClose', () => {
    const onClose = vi.fn();
    render(<EmojiPicker open onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('emoji-picker-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Esc key → onClose', () => {
    const onClose = vi.fn();
    render(<EmojiPicker open onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
