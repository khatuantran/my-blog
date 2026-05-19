import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MetaPanel } from '@/components/post/MetaPanel';
import { makePost } from '../../_helpers/post-factory';

const baseHref = 'http://localhost:3000';

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: new URL(baseHref),
    writable: true,
  });
});

describe('MetaPanel — Copy link (T-200, FR-05.2)', () => {
  it('clicks Copy link → writes post URL to clipboard + toast confirm', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const post = makePost({ id: 'p-abc-123' });
    render(<MetaPanel post={post} />);

    const btn = screen.getByRole('button', { name: /copy post link/i });
    expect(btn).toHaveTextContent(/copy link/i);

    fireEvent.click(btn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${baseHref}/post/p-abc-123`);
    });
    await waitFor(() => {
      expect(btn).toHaveTextContent(/link copied/i);
    });
  });

  it('clipboard rejected → does NOT throw + button label unchanged', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('insecure context'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const post = makePost({ id: 'p-fail' });
    render(<MetaPanel post={post} />);

    const btn = screen.getByRole('button', { name: /copy post link/i });
    fireEvent.click(btn);

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    // Wait one microtask cycle để promise rejection settle
    await Promise.resolve();
    expect(btn).toHaveTextContent(/copy link/i);
    expect(btn).not.toHaveTextContent(/link copied/i);
  });

  it('renders 3 social share buttons + Copy link button', () => {
    const post = makePost({ id: 'p1' });
    render(<MetaPanel post={post} />);

    expect(screen.getByRole('button', { name: /share to facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share to x/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share to telegram/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy post link/i })).toBeInTheDocument();
  });
});
