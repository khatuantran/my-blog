import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('open=false → renders null', () => {
    const { container } = render(
      <ConfirmDialog open={false} message="x" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('open=true → renders title/message + Cancel/Confirm buttons', () => {
    render(
      <ConfirmDialog
        open
        title="// delete.tag"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('destructive=true → red styled confirm button + ⚠️ prefix', () => {
    render(
      <ConfirmDialog
        open
        destructive
        message="bye"
        confirmLabel="Force Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const btn = screen.getByRole('button', { name: /force delete/i });
    expect(btn.className).toMatch(/text-red/);
    expect(screen.getByText(/⚠️/)).toBeInTheDocument();
  });

  it('click Confirm → onConfirm fired', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open message="x" onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('Esc key → onCancel fired', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open message="x" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });
});
