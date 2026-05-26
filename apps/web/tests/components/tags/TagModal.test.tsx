import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagModal } from '@/components/tags/TagModal';
import { NEON_COLORS } from '@/lib/tag-colors';

describe('TagModal', () => {
  it('open=false → renders null', () => {
    const { container } = render(
      <TagModal open={false} variant="create" onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('T-373: renders 8 NEON_COLORS swatches', () => {
    render(<TagModal open variant="create" onSubmit={vi.fn()} onClose={vi.fn()} />);
    const swatches = NEON_COLORS.map((c) => screen.getByRole('button', { name: `Color ${c}` }));
    expect(swatches).toHaveLength(8);
  });

  it('T-373: live preview shows #<name> in selected color', () => {
    render(<TagModal open variant="create" onSubmit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('#preview')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'typescript' } });
    expect(screen.getByText('#typescript')).toBeInTheDocument();
  });

  it('T-373: name input shows # prefix element', () => {
    render(<TagModal open variant="create" onSubmit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('#')).toBeInTheDocument();
  });

  it('T-373: native color picker rendered + synced with color state', () => {
    render(<TagModal open variant="create" onSubmit={vi.fn()} onClose={vi.fn()} />);
    const picker = screen.getByLabelText('Custom color') as HTMLInputElement;
    expect(picker).toHaveAttribute('type', 'color');
    expect(picker.value).toBe(NEON_COLORS[0].toLowerCase());
  });

  it('T-373: Enter/submit → onSubmit called with correct body', () => {
    const onSubmit = vi.fn();
    render(<TagModal open variant="create" onSubmit={onSubmit} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'newtag' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'about it' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'newtag',
      color: NEON_COLORS[0],
      description: 'about it',
    });
  });

  it('T-373: Esc → onClose fired', () => {
    const onClose = vi.fn();
    render(<TagModal open variant="create" onSubmit={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('T-373: error prop → renders alert banner (red mono 12)', () => {
    render(
      <TagModal open variant="create" error="tag exists" onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/tag exists/i);
    expect(alert).toHaveClass('text-red');
  });

  it('edit variant — pre-fills + Save label', () => {
    render(
      <TagModal
        open
        variant="edit"
        initial={{ id: 't1', name: '#dev', color: NEON_COLORS[2], description: 'prog' }}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/name/i)).toHaveValue('dev');
    expect(screen.getByLabelText(/description/i)).toHaveValue('prog');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
