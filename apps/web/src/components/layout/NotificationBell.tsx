import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useUnreadCount } from '@/hooks/queries/use-unread-count';
import { useNotifications } from '@/hooks/queries/use-notifications';
import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/mutations/use-notification-mutations';
import { formatRelative } from '@/lib/format-date';
import type { NotificationItem, NotificationType } from '@/types/api';

type TabFilter = 'all' | 'unread';

function notificationVerb(item: NotificationItem): string {
  const actor = item.actor?.username ?? 'Someone';
  switch (item.type as NotificationType) {
    case 'REACTION': {
      const emoji = item.metadata?.reactionType ? reactionEmoji(item.metadata.reactionType) : '👍';
      return `${actor} reacted ${emoji} to your post`;
    }
    case 'COMMENT':
      return `${actor} commented on your post`;
    case 'REPLY':
      return `${actor} replied to your comment`;
    case 'SHARE':
      return `${actor} shared your post`;
    default:
      return `${actor} interacted with your post`;
  }
}

function reactionEmoji(type: string): string {
  const map: Record<string, string> = {
    LIKE: '👍',
    LOVE: '❤️',
    HAHA: '😆',
    WOW: '😮',
    SAD: '😢',
    ANGRY: '😡',
  };
  return map[type] ?? '👍';
}

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

function getTargetPath(item: NotificationItem): string {
  const id = item.postId ?? (item.targetType === 'POST' ? item.targetId : null);
  return id ? `/post/${id}` : '/';
}

function AvatarSm({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  const initial = username[0]?.toUpperCase() ?? '?';
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={username} className="w-7 h-7 rounded-full shrink-0 object-cover" />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full shrink-0 bg-cyan/20 border border-cyan/40 flex items-center justify-center font-brand font-bold text-[11px] text-cyan">
      {initial}
    </div>
  );
}

function GroupLabel({ group }: { group: 'today' | 'yesterday' | 'older' }) {
  const label =
    group === 'today' ? '// today' : group === 'yesterday' ? '// yesterday' : '// older';
  return (
    <div className="px-3 py-1.5 font-mono text-mono-xs text-tm border-b border-b1 bg-bg/50">
      {label}
    </div>
  );
}

function NotificationRow({
  item,
  onClickItem,
}: {
  item: NotificationItem;
  onClickItem: (item: NotificationItem) => void;
}) {
  const verb = notificationVerb(item);
  const truncated = verb.length > 60 ? verb.slice(0, 57) + '...' : verb;
  return (
    <button
      type="button"
      data-testid={`notification-item-${item.id}`}
      onClick={() => onClickItem(item)}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-cyan/5 ${
        !item.read ? 'bg-cyan/[0.03]' : ''
      }`}
    >
      {item.actor ? (
        <AvatarSm username={item.actor.username} avatarUrl={item.actor.avatarUrl} />
      ) : (
        <div className="w-7 h-7 rounded-full shrink-0 bg-b2 flex items-center justify-center text-tm text-[11px]">
          ?
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[12px] text-ts leading-snug break-words">{truncated}</p>
        <span className="font-mono text-mono-xs text-tm mt-0.5 block">
          {formatRelative(item.createdAt)}
        </span>
      </div>
      {!item.read && (
        <span aria-hidden="true" className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blu shrink-0" />
      )}
    </button>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabFilter>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

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
    navigate(getTargetPath(item));
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
      {/* Bell button */}
      <button
        type="button"
        data-testid="notification-bell"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
          open ? 'text-cyan' : 'text-tm hover:text-cyan'
        }`}
      >
        <span className="text-[18px] leading-none select-none">🔔</span>
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-mag flex items-center justify-center font-mono font-bold text-white animate-pulse-status"
            style={{ fontSize: 9 }}
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
          className="absolute top-[42px] right-0 w-[360px] max-h-[480px] flex flex-col bg-surf border border-b2 rounded-lg shadow-xl z-[200] animate-fade-up overflow-hidden"
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
                className="font-mono text-mono-xs text-grn hover:text-tp transition-colors disabled:opacity-50"
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
              className={`flex-1 py-1.5 font-mono text-mono-xs transition-colors ${
                tab === 'all' ? 'text-cyan border-b-2 border-cyan -mb-px' : 'text-tm hover:text-ts'
              }`}
            >
              All ({totalAll})
            </button>
            <button
              type="button"
              data-testid="notification-tab-unread"
              onClick={() => setTab('unread')}
              className={`flex-1 py-1.5 font-mono text-mono-xs transition-colors ${
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
                    <NotificationRow key={item.id} item={item} onClickItem={handleClickItem} />
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
