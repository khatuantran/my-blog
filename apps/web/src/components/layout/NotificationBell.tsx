import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useUnreadCount } from '@/hooks/queries/use-unread-count';
import { useNotifications } from '@/hooks/queries/use-notifications';
import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/mutations/use-notification-mutations';
import { notifTargetPath } from '@/lib/notification-format';
import { NotifRowBell } from '@/components/layout/NotifRowBell';
import type { NotificationItem } from '@/types/api';

type TabFilter = 'all' | 'unread';

function getTimeGroup(iso: string): 'today' | 'yesterday' | 'older' {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (itemDay.getTime() === today.getTime()) return 'today';
  if (itemDay.getTime() === yesterday.getTime()) return 'yesterday';
  return 'older';
}

function GroupLabel({ group }: { group: 'today' | 'yesterday' | 'older' }) {
  const label =
    group === 'today' ? '// today' : group === 'yesterday' ? '// yesterday' : '// older';
  return (
    <div className="px-3 py-1.5 font-mono text-mono-sm text-tm border-b border-b1 bg-bg/50">
      {label}
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabFilter>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  const { data: notifData, isLoading } = useNotifications({ filter: tab, limit: 10 });
  const items = notifData?.items ?? [];
  const totalAll = notifData?.total ?? 0;
  const totalUnread = notifData?.unreadCount ?? unreadCount;

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Esc
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function handleClickItem(item: NotificationItem) {
    setOpen(false);
    if (!item.read) {
      markRead.mutate({ id: item.id, read: true });
    }
    navigate(notifTargetPath(item));
  }

  // Group items by time
  const groups: { group: 'today' | 'yesterday' | 'older'; items: NotificationItem[] }[] = [];
  for (const item of items) {
    const g = getTimeGroup(item.createdAt);
    const existing = groups.find((gr) => gr.group === g);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ group: g, items: [item] });
    }
  }

  return (
    <div ref={containerRef} data-testid="notification-bell-container" className="relative">
      {/* Bell button — design-file 2026-05-24: bordered container + SVG bell */}
      <button
        type="button"
        data-testid="notification-bell"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`relative w-8 h-8 flex items-center justify-center rounded-md border border-b2 bg-elev transition-colors cursor-pointer ${
          open
            ? 'text-cyan bg-cyan/[0.08] shadow-[0_0_12px_rgba(0,255,229,0.2)]'
            : 'text-ts hover:text-cyan hover:bg-cyan/[0.08]'
        }`}
      >
        <svg
          data-testid="notification-bell-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            aria-hidden="true"
            className="absolute -top-[3px] -right-[3px] min-w-4 h-4 px-1 rounded-lg bg-mag flex items-center justify-center font-mono font-bold animate-pulse-status"
            style={{
              fontSize: 10,
              color: 'var(--bg)',
              boxShadow: '0 0 0 1.5px var(--surf), 0 0 6px rgba(255,110,150,0.8)',
            }}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          data-testid="notification-dropdown"
          role="dialog"
          aria-label="Notifications"
          className="absolute top-[42px] right-0 w-[360px] max-h-[480px] flex flex-col bg-surf border border-cyan/25 rounded-lg shadow-glow-cyan-panel z-[200] animate-fade-up overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-b2 shrink-0">
            <span className="font-mono text-mono-sm text-cyan">
              // notifications{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                data-testid="notification-mark-all-read"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="font-mono text-mono-sm text-grn hover:text-tp transition-colors disabled:opacity-50"
              >
                ✓ mark all read
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-b2 shrink-0">
            <button
              type="button"
              data-testid="notification-tab-all"
              onClick={() => setTab('all')}
              className={`flex-1 py-1.5 font-mono text-mono-sm transition-colors ${
                tab === 'all' ? 'text-cyan border-b-2 border-cyan -mb-px' : 'text-tm hover:text-ts'
              }`}
            >
              All ({totalAll})
            </button>
            <button
              type="button"
              data-testid="notification-tab-unread"
              onClick={() => setTab('unread')}
              className={`flex-1 py-1.5 font-mono text-mono-sm transition-colors ${
                tab === 'unread'
                  ? 'text-cyan border-b-2 border-cyan -mb-px'
                  : 'text-tm hover:text-ts'
              }`}
            >
              Unread ({totalUnread})
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {isLoading && (
              <div className="px-3 py-6 text-center font-mono text-mono-sm text-tm">
                // loading...
              </div>
            )}
            {!isLoading && items.length === 0 && (
              <div
                data-testid="notification-empty"
                className="px-3 py-8 text-center font-mono text-mono-sm text-tm"
              >
                // no notifications yet
              </div>
            )}
            {!isLoading &&
              groups.map(({ group, items: groupItems }) => (
                <div key={group}>
                  <GroupLabel group={group} />
                  {groupItems.map((item) => (
                    <NotifRowBell key={item.id} notif={item} onClickItem={handleClickItem} />
                  ))}
                </div>
              ))}
          </div>

          {/* Footer */}
          <div className="border-t border-b1 shrink-0">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              data-testid="notification-view-all"
              className="block px-3 py-2 font-mono text-mono-sm text-cyan hover:text-tp transition-colors no-underline"
            >
              // view all → /notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
