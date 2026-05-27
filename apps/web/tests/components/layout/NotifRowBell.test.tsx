import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotifRowBell } from '@/components/layout/NotifRowBell';
import type { NotificationItem, NotificationType } from '@/types/api';

function makeNotif(over: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'n1',
    type: 'REACTION',
    actor: { id: 'u2', username: 'bob', avatarUrl: null },
    targetType: 'POST',
    targetId: 'post-target-001',
    postId: 'post-001',
    read: false,
    metadata: { reactionType: 'LOVE' },
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe('NotifRowBell (T-353)', () => {
  it('variant size: avatar 34×34, padding 10/16, gap 10', () => {
    render(<NotifRowBell notif={makeNotif()} onClickItem={vi.fn()} />);
    const row = screen.getByTestId('notification-item-n1');
    expect(row.className).toMatch(/px-4/);
    expect(row.className).toMatch(/py-\[10px\]/);
    expect(row.className).toMatch(/gap-\[10px\]/);
    const avatar = row.querySelector('.relative > div');
    expect(avatar?.className).toMatch(/h-\[34px\]/);
    expect(avatar?.className).toMatch(/w-\[34px\]/);
  });

  it('badge size 18×18 + fontSize 9', () => {
    render(<NotifRowBell notif={makeNotif()} onClickItem={vi.fn()} />);
    const badge = screen.getByTestId('notif-row-bell-badge');
    expect(badge.className).toMatch(/h-\[18px\]/);
    expect(badge.className).toMatch(/w-\[18px\]/);
    expect(badge.className).toMatch(/text-\[9px\]/);
  });

  it('border-left 2px reflects unread state (cfg.color when unread, transparent when read)', () => {
    const { rerender } = render(
      <NotifRowBell notif={makeNotif({ read: false, type: 'COMMENT' })} onClickItem={vi.fn()} />,
    );
    const rowUnread = screen.getByTestId('notification-item-n1');
    expect(rowUnread.style.borderLeft).toMatch(/2px solid rgb\(125, 207, 255\)/);

    rerender(<NotifRowBell notif={makeNotif({ read: true })} onClickItem={vi.fn()} />);
    const rowRead = screen.getByTestId('notification-item-n1');
    expect(rowRead.style.borderLeft).toMatch(/2px solid transparent/);
  });

  it('type config: 4 types REACTION/COMMENT/REPLY/SHARE render đúng icon', () => {
    const types: { t: NotificationType; icon: string }[] = [
      { t: 'REACTION', icon: '❤' },
      { t: 'COMMENT', icon: '💬' },
      { t: 'REPLY', icon: '↩' },
      { t: 'SHARE', icon: '↗' },
    ];
    for (const { t, icon } of types) {
      const { unmount } = render(
        <NotifRowBell notif={makeNotif({ type: t, id: `n-${t}` })} onClickItem={vi.fn()} />,
      );
      const badge = screen.getByTestId('notif-row-bell-badge');
      expect(badge.textContent).toBe(icon);
      unmount();
    }
  });

  it('anon variant: actor=null hiển thị [anon] + ? placeholder', () => {
    render(<NotifRowBell notif={makeNotif({ actor: null })} onClickItem={vi.fn()} />);
    expect(screen.getByText('[anon]')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('hover/click: click row triggers onClickItem callback', () => {
    const onClickItem = vi.fn();
    render(<NotifRowBell notif={makeNotif()} onClickItem={onClickItem} />);
    fireEvent.click(screen.getByTestId('notification-item-n1'));
    expect(onClickItem).toHaveBeenCalledTimes(1);
    expect(onClickItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }));
    // hover utility class present (Tailwind hover:bg-elev)
    const row = screen.getByTestId('notification-item-n1');
    expect(row.className).toMatch(/hover:bg-elev/);
  });
});
