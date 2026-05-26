import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ToastProvider } from '@/components/shared/Toast';
import { useToast } from '@/hooks/use-toast';

function Trigger() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Saved', 'success')}>fire-success</button>
      <button onClick={() => showToast('Failed', 'error')}>fire-error</button>
      <button onClick={() => showToast('Info msg', 'info')}>fire-info</button>
    </div>
  );
}

describe('Toast (T-362)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. success variant — ✓ icon + grn classes + message', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText('fire-success').click();
    });
    const toast = screen.getByTestId('toast-success');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent('✓');
    expect(toast).toHaveTextContent('Saved');
    expect(toast.className).toContain('text-grn');
  });

  it('2. error variant — ✕ icon + red classes', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText('fire-error').click();
    });
    const toast = screen.getByTestId('toast-error');
    expect(toast).toHaveTextContent('✕');
    expect(toast).toHaveTextContent('Failed');
    expect(toast.className).toContain('text-red');
  });

  it('3. info variant — ℹ icon + cyan classes', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText('fire-info').click();
    });
    const toast = screen.getByTestId('toast-info');
    expect(toast).toHaveTextContent('ℹ');
    expect(toast).toHaveTextContent('Info msg');
    expect(toast.className).toContain('text-cyan');
  });

  it('4. auto-dismiss after 2500ms', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText('fire-success').click();
    });
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();

    // Advance fake timer
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByTestId('toast-success')).not.toBeInTheDocument();
  });
});
