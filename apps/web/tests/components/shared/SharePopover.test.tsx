import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SharePopover } from '@/components/shared/SharePopover';
import { makePost } from '../../_helpers/post-factory';

const baseHref = 'http://localhost:3000';

beforeEach(() => {
  Object.defineProperty(window, 'location', { value: new URL(baseHref), writable: true });
});
afterEach(() => vi.restoreAllMocks());

describe('SharePopover (FR-05.1, regression BUG-034)', () => {
  it('trigger ẩn popover ban đầu; click mở 4 lựa chọn share', () => {
    render(<SharePopover post={makePost({ id: 'p1' })} />);
    expect(screen.queryByRole('menu', { name: /share options/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /share post/i }));

    expect(screen.getByRole('menuitem', { name: /share to facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /share to x/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /share to telegram/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /copy post link/i })).toBeInTheDocument();
  });

  it('click Facebook → mở facebook sharer với post URL', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<SharePopover post={makePost({ id: 'p-fb' })} />);

    fireEvent.click(screen.getByRole('button', { name: /share post/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /share to facebook/i }));

    const target = open.mock.calls[0][0] as string;
    expect(target).toContain('https://www.facebook.com/sharer/sharer.php?u=');
    expect(target).toContain(encodeURIComponent(`${baseHref}/post/p-fb`));
  });

  it('click Telegram → mở t.me share intent', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<SharePopover post={makePost({ id: 'p-tg' })} />);

    fireEvent.click(screen.getByRole('button', { name: /share post/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /share to telegram/i }));

    expect(open.mock.calls[0][0] as string).toContain('https://t.me/share/url?url=');
  });

  it('click Copy link → ghi URL vào clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<SharePopover post={makePost({ id: 'p-cp' })} />);

    fireEvent.click(screen.getByRole('button', { name: /share post/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /copy post link/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${baseHref}/post/p-cp`));
    await waitFor(() => expect(screen.getByText(/link copied/i)).toBeInTheDocument());
  });
});
