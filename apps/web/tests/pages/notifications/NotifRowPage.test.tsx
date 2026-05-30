import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NotifRowPage } from '@/pages/notifications/NotifRowPage';
import type { NotificationItem, NotificationType } from '@/types/api';

function makeNotif(over: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'p1',
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

function renderRow(notif: NotificationItem, selected = false) {
  return render(
    <MemoryRouter>
      <NotifRowPage
        notif={notif}
        selected={selected}
        onToggleSelect={vi.fn()}
        onMarkRead={vi.fn()}
        onDelete={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('NotifRowPage (T-353)', () => {
  it('variant size: avatar 40×40, padding 14/18, gap 12', () => {
    renderRow(makeNotif());
    const row = screen.getByTestId('notif-row-page');
    expect(row.className).toMatch(/px-\[18px\]/);
    expect(row.className).toMatch(/py-\[14px\]/);
    expect(row.className).toMatch(/gap-3/);
    const avatar = row.querySelector('.relative > div');
    expect(avatar?.className).toMatch(/h-10/);
    expect(avatar?.className).toMatch(/w-10/);
  });

  it('badge size 20×20 + fontSize 10', () => {
    renderRow(makeNotif());
    const row = screen.getByTestId('notif-row-page');
    const badge = row.querySelector('.relative > div.absolute');
    expect(badge?.className).toMatch(/h-5/);
    expect(badge?.className).toMatch(/w-5/);
    expect(badge?.className).toMatch(/text-\[10px\]/);
    expect(badge?.className).toMatch(/font-bold/);
  });

  it('border-left 3px: selected=cyan, unread=cfg.color, read=transparent', () => {
    const { rerender } = renderRow(makeNotif({ read: false, type: 'COMMENT' }));
    const rowUnread = screen.getByTestId('notif-row-page');
    expect(rowUnread.style.borderLeft).toMatch(/3px solid rgb\(125, 207, 255\)/);

    rerender(
      <MemoryRouter>
        <NotifRowPage
          notif={makeNotif({ read: true })}
          selected={false}
          onToggleSelect={vi.fn()}
          onMarkRead={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>,
    );
    const rowRead = screen.getByTestId('notif-row-page');
    expect(rowRead.style.borderLeft).toMatch(/3px solid transparent/);

    rerender(
      <MemoryRouter>
        <NotifRowPage
          notif={makeNotif({ read: true })}
          selected={true}
          onToggleSelect={vi.fn()}
          onMarkRead={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>,
    );
    const rowSelected = screen.getByTestId('notif-row-page');
    expect(rowSelected.style.borderLeft).toMatch(/3px solid var\(--cyan\)/);
  });

  it('type config: 4 types REACTION/COMMENT/REPLY/SHARE render đúng icon + verb', () => {
    const expected: { t: NotificationType; icon: string; verbSnippet: string }[] = [
      { t: 'REACTION', icon: '❤', verbSnippet: 'reacted to' },
      { t: 'COMMENT', icon: '💬', verbSnippet: 'commented on' },
      { t: 'REPLY', icon: '↩', verbSnippet: 'replied to your comment on' },
      { t: 'SHARE', icon: '↗', verbSnippet: 'shared' },
    ];
    for (const { t, icon, verbSnippet } of expected) {
      const { unmount } = renderRow(makeNotif({ type: t, id: `p-${t}` }));
      const row = screen.getByTestId('notif-row-page');
      const badge = row.querySelector('.relative > div.absolute');
      expect(badge?.textContent).toBe(icon);
      // verb snippet appears in line 1
      expect(row.textContent).toContain(verbSnippet);
      unmount();
    }
  });

  it('anon variant: actor=null hiển thị [anon] + ? avatar fallback', () => {
    renderRow(makeNotif({ actor: null }));
    expect(screen.getByText('[anon]')).toBeInTheDocument();
    const row = screen.getByTestId('notif-row-page');
    expect(row.textContent).toContain('?');
  });

  it('hover state: action buttons present (opacity-0 → group-hover:opacity-100); checkbox + mark + delete buttons clickable', () => {
    const onToggleSelect = vi.fn();
    const onMarkRead = vi.fn();
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <NotifRowPage
          notif={makeNotif()}
          selected={false}
          onToggleSelect={onToggleSelect}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      </MemoryRouter>,
    );
    const actionsWrap = screen.getByTestId('notif-row-mark-toggle').parentElement!;
    expect(actionsWrap.className).toMatch(/opacity-0/);
    expect(actionsWrap.className).toMatch(/group-hover:opacity-100/);

    fireEvent.click(screen.getByTestId('notif-row-checkbox'));
    expect(onToggleSelect).toHaveBeenCalledWith('p1');

    fireEvent.click(screen.getByTestId('notif-row-mark-toggle'));
    expect(onMarkRead).toHaveBeenCalledWith('p1', true);

    fireEvent.click(screen.getByTestId('notif-row-delete'));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });

  it('T-403 snippet: render quoted snippet khi metadata.snippet có; fallback targetId hash khi absent', () => {
    const { rerender } = renderRow(
      makeNotif({ metadata: { reactionType: 'LIKE', snippet: 'Đọc xong A Philosophy of…' } }),
    );
    const snippet = screen.getByTestId('notif-row-page-snippet');
    expect(snippet).toBeInTheDocument();
    expect(snippet.textContent).toBe('“Đọc xong A Philosophy of…”');

    rerender(
      <MemoryRouter>
        <NotifRowPage
          notif={makeNotif({ metadata: undefined })}
          selected={false}
          onToggleSelect={vi.fn()}
          onMarkRead={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('notif-row-page-snippet')).not.toBeInTheDocument();
    // Fallback line: targetId hash visible (8 chars + …)
    expect(screen.getByText(/^#post-tar/)).toBeInTheDocument();
  });
});
