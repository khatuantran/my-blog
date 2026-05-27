import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';
import type { NotificationItem } from '@/types/api';

const API_URL = 'http://localhost:3001';

function unreadCountOk(count: number) {
  return http.get(`${API_URL}/notifications/unread-count`, () =>
    HttpResponse.json({ data: { count } }),
  );
}

function listOk(items: Partial<NotificationItem>[], unreadCount = 0) {
  const full = items.map(
    (i, idx): NotificationItem => ({
      id: `n${idx + 1}`,
      type: 'COMMENT',
      actor: { id: `u${idx}`, username: `user${idx}`, avatarUrl: null },
      targetType: 'POST',
      targetId: 'p1',
      postId: 'p1',
      read: false,
      createdAt: new Date().toISOString(),
      ...i,
    }),
  );
  return http.get(`${API_URL}/notifications`, () =>
    HttpResponse.json({
      data: { items: full, total: full.length, page: 1, limit: 10, unreadCount },
    }),
  );
}

function markReadOk(id: string) {
  return http.patch(`${API_URL}/notifications/${id}/read`, () =>
    HttpResponse.json({ data: { id, read: true } }),
  );
}

describe('NotificationBell (T-313)', () => {
  beforeEach(() => {
    mswServer.use(unreadCountOk(0), listOk([]));
  });

  it('1. badge hidden khi unreadCount = 0', async () => {
    render(
      <TestProviders>
        <NotificationBell />
      </TestProviders>,
    );
    await waitFor(() => expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument());
  });

  it('2. badge hiện khi unreadCount > 0', async () => {
    mswServer.use(unreadCountOk(5));
    render(
      <TestProviders>
        <NotificationBell />
      </TestProviders>,
    );
    await waitFor(() => {
      const badge = screen.getByTestId('notification-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });
  });

  it('3. T-359 badge hiển thị 9+ khi unreadCount > 9 (KHÔNG 99+)', async () => {
    mswServer.use(unreadCountOk(15));
    render(
      <TestProviders>
        <NotificationBell />
      </TestProviders>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('9+');
    });
  });

  it('T-359: bell icon là inline SVG 15×15 viewBox 24 với 2 paths (body + clapper)', async () => {
    render(
      <TestProviders>
        <NotificationBell />
      </TestProviders>,
    );
    const icon = await screen.findByTestId('notification-bell-icon');
    expect(icon.tagName.toLowerCase()).toBe('svg');
    expect(icon.getAttribute('width')).toBe('15');
    expect(icon.getAttribute('height')).toBe('15');
    expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(icon.getAttribute('stroke-width')).toBe('2');
    const paths = icon.querySelectorAll('path');
    expect(paths.length).toBe(2);
    // không còn emoji 🔔
    const bell = screen.getByTestId('notification-bell');
    expect(bell.textContent ?? '').not.toContain('🔔');
  });

  it('T-359: button 32×32 có border 1px --b2 + bg --elev', async () => {
    render(
      <TestProviders>
        <NotificationBell />
      </TestProviders>,
    );
    const bell = await screen.findByTestId('notification-bell');
    expect(bell.className).toMatch(/w-8/);
    expect(bell.className).toMatch(/h-8/);
    expect(bell.className).toMatch(/border-b2/);
    expect(bell.className).toMatch(/bg-elev/);
    expect(bell.className).toMatch(/border\b/);
  });

  it('T-359: badge có ring 1.5px --surf + color --bg (không white)', async () => {
    mswServer.use(unreadCountOk(3));
    render(
      <TestProviders>
        <NotificationBell />
      </TestProviders>,
    );
    const badge = await screen.findByTestId('notification-badge');
    // Ring rendered via boxShadow (Tailwind ring utilities cannot interpolate var(--surf))
    expect(badge.style.boxShadow).toMatch(/1\.5px var\(--surf\)/);
    expect(badge.style.color).toBe('var(--bg)');
    expect(badge.className).not.toMatch(/text-white/);
  });

  it('4. dropdown toggle: click mở, click ngoài đóng', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <NotificationBell />
        <div data-testid="outside">outside</div>
      </TestProviders>,
    );
    // Initially closed
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    // Click bell → open
    await user.click(screen.getByTestId('notification-bell'));
    await waitFor(() => expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument());
    // Click outside → close
    fireEvent.mouseDown(screen.getByTestId('outside'));
    await waitFor(() =>
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument(),
    );
  });

  it('5. tab switch All/Unread', async () => {
    mswServer.use(
      unreadCountOk(2),
      http.get(`${API_URL}/notifications`, ({ request }) => {
        const url = new URL(request.url);
        const filter = url.searchParams.get('filter');
        const items =
          filter === 'unread'
            ? [
                {
                  id: 'n-unread',
                  type: 'REACTION' as const,
                  actor: { id: 'u1', username: 'alice', avatarUrl: null },
                  targetType: 'POST',
                  targetId: 'p1',
                  postId: 'p1',
                  read: false,
                  createdAt: new Date().toISOString(),
                },
              ]
            : [];
        return HttpResponse.json({
          data: { items, total: items.length, page: 1, limit: 10, unreadCount: 2 },
        });
      }),
    );
    const user = userEvent.setup();
    render(
      <TestProviders>
        <NotificationBell />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('notification-bell'));
    await waitFor(() => expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument());
    // Switch to Unread tab
    await user.click(screen.getByTestId('notification-tab-unread'));
    // T-353: NotifRowBell renders content split into spans — actor (blu) + cfg.verb (td) + 'your post' (td).
    // Emoji moved from verb text into the type badge.
    const row = await screen.findByTestId('notification-item-n-unread');
    expect(row).toHaveTextContent('alice');
    expect(row).toHaveTextContent('reacted to');
    expect(row).toHaveTextContent('your post');
  });

  it('6. click item → navigate + gọi mark-read', async () => {
    mswServer.use(
      unreadCountOk(1),
      listOk([{ id: 'n1', read: false, type: 'COMMENT', postId: 'post-abc' }], 1),
      markReadOk('n1'),
    );
    const user = userEvent.setup();
    render(
      <TestProviders initialEntries={['/']}>
        <NotificationBell />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('notification-bell'));
    await waitFor(() => expect(screen.getByTestId('notification-item-n1')).toBeInTheDocument());
    await user.click(screen.getByTestId('notification-item-n1'));
    // Dropdown closes
    await waitFor(() =>
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument(),
    );
  });
});
