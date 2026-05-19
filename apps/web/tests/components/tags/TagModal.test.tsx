import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagModal } from '@/components/tags/TagModal';
import { TAG_COLORS } from '@/lib/tag-colors';

describe('TagModal', () => {
  it('open=false → renders null', () => {
    const { container } = render(
      <TagModal open={false} variant="create" onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('create variant — empty form + Cancel/Create buttons', () => {
    render(<TagModal open variant="create" onSubmit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: /create.tag/ })).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled(); // empty name
  });

  it('submit form → onSubmit với normalized body', () => {
    const onSubmit = vi.fn();
    render(<TagModal open variant="create" onSubmit={onSubmit} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'newtag' } });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'about it' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'newtag',
      color: TAG_COLORS[0],
      description: 'about it',
    });
  });

  it('edit variant — pre-fills + Save label', () => {
    render(
      <TagModal
        open
        variant="edit"
        initial={{ id: 't1', name: '#dev', color: TAG_COLORS[2], description: 'prog' }}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/name/i)).toHaveValue('dev');
    expect(screen.getByLabelText(/description/i)).toHaveValue('prog');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('Esc → onClose fired', () => {
    const onClose = vi.fn();
    render(<TagModal open variant="create" onSubmit={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('error prop → renders alert banner', () => {
    render(
      <TagModal open variant="create" error="tag exists" onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/tag exists/i);
  });
});
