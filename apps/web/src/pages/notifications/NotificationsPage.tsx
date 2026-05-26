import { useState, useMemo } from 'react';
import { useInfiniteNotifications } from '@/hooks/queries/use-infinite-notifications';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useDeleteNotification,
  useBulkMarkRead,
  useBulkDeleteNotifications,
  useDeleteAllNotifications,
} from '@/hooks/mutations/use-notification-mutations';
import { useToast } from '@/hooks/use-toast';
import { NotifRowPage } from './NotifRowPage';
import type { NotificationItem, NotificationType } from '@/types/api';

type TabKey = 'ALL' | 'UNREAD' | NotificationType;

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'ALL', label: 'All', icon: '◉' },
  { key: 'UNREAD', label: 'Unread', icon: '●' },
  { key: 'REACTION', label: 'Reactions', icon: '❤' },
  { key: 'COMMENT', label: 'Comments', icon: '💬' },
  { key: 'REPLY', label: 'Replies', icon: '↩' },
  { key: 'SHARE', label: 'Shares', icon: '↗' },
];

function getTimeGroup(iso: string): 'today' | 'yesterday' | 'older' {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0 && d.getDate() === now.getDate()) return 'today';
  if (diffDays <= 1 && d.getDate() === now.getDate() - 1) return 'yesterday';
  return diffDays < 1 ? 'today' : diffDays < 2 ? 'yesterday' : 'older';
}

function groupByDate(items: NotificationItem[]): { label: string; items: NotificationItem[] }[] {
  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const older: NotificationItem[] = [];
  for (const n of items) {
    const g = getTimeGroup(n.createdAt);
    if (g === 'today') today.push(n);
    else if (g === 'yesterday') yesterday.push(n);
    else older.push(n);
  }
  return [
    ...(today.length ? [{ label: 'today', items: today }] : []),
    ...(yesterday.length ? [{ label: 'yesterday', items: yesterday }] : []),
    ...(older.length ? [{ label: 'older', items: older }] : []),
  ];
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<TabKey>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const { showToast } = useToast();

  // debounce 150ms
  let debounceTimer: ReturnType<typeof setTimeout>;
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => setDebouncedSearch(val), 150);
  };

  const filterParam = tab === 'UNREAD' ? 'unread' : undefined;
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteNotifications({
    filter: filterParam,
  });

  const allItems = useMemo<NotificationItem[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  const filtered = useMemo(() => {
    let items = allItems;
    // tab filter (skip ALL and UNREAD — handled server-side)
    if (tab !== 'ALL' && tab !== 'UNREAD') {
      items = items.filter((n) => n.type === tab);
    }
    // search filter (client-side)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(
        (n) =>
          n.actor?.username.toLowerCase().includes(q) ||
          n.postId?.toLowerCase().includes(q) ||
          n.targetId?.toLowerCase().includes(q),
      );
    }
    return items;
  }, [allItems, tab, debouncedSearch]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of TABS) {
      if (t.key === 'ALL') counts.ALL = allItems.length;
      else if (t.key === 'UNREAD') counts.UNREAD = allItems.filter((n) => !n.read).length;
      else counts[t.key] = allItems.filter((n) => n.type === t.key).length;
    }
    return counts;
  }, [allItems]);

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const bulkMarkRead = useBulkMarkRead();
  const bulkDelete = useBulkDeleteNotifications();
  const deleteAll = useDeleteAllNotifications();

  const handleMarkRead = (id: string, read: boolean) => {
    markRead.mutate(
      { id, read },
      { onSuccess: () => showToast(read ? 'Marked as read' : 'Marked as unread') },
    );
  };

  const handleDeleteOne = (id: string) => {
    deleteOne.mutate(id, { onSuccess: () => showToast('Notification deleted', 'error') });
    setSelected((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });
  };

  const handleSelectAll = () => {
    setSelected(new Set(filtered.map((n) => n.id)));
  };

  const handleBulkMarkRead = () => {
    const ids = Array.from(selected);
    bulkMarkRead.mutate(ids, {
      onSuccess: (res) => {
        showToast(`Marked ${res.updated} as read`);
        setSelected(new Set());
      },
    });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selected);
    bulkDelete.mutate(ids, {
      onSuccess: (res) => {
        showToast(`Deleted ${res.deleted} notifications`, 'error');
        setSelected(new Set());
      },
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: (res) => showToast(`All ${res.updated} marked as read`),
    });
  };

  const handleClearAll = () => {
    setShowConfirmClear(true);
  };

  const confirmClearAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: (res) => {
        showToast(`Deleted all ${res.deleted} notifications`, 'error');
        setShowConfirmClear(false);
        setSelected(new Set());
      },
    });
  };

  const groups = groupByDate(filtered);

  return (
    <div className="min-h-screen" data-testid="notifications-page">
      {/* SubBar */}
      <div
        data-testid="notifications-subbar"
        className="fixed left-0 right-0 top-[52px] z-subbar flex h-11 items-center gap-3 border-b border-b1 bg-surf px-5 font-mono text-mono-sm"
      >
        <span className="text-td">~/notifications</span>
        <span className="text-td">·</span>
        <span className="text-tc">{total} total</span>
        {unreadCount > 0 && (
          <>
            <span className="text-td">·</span>
            <span style={{ color: 'var(--cyan)' }}>{unreadCount} unread</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              data-testid="mark-all-read-btn"
              onClick={handleMarkAllRead}
              className="act-btn border border-b2 px-2 py-0.5 text-mono-xs text-grn"
            >
              ✓ mark all read
            </button>
          )}
          {total > 0 && (
            <button
              data-testid="clear-all-btn"
              onClick={handleClearAll}
              className="act-btn border border-b2 px-2 py-0.5 text-mono-xs text-red"
            >
              ✕ clear all
            </button>
          )}
        </div>
      </div>

      <div className="pt-[96px]">
        {/* 6 Type Tabs */}
        <div
          data-testid="notifications-tabs"
          className="flex flex-wrap gap-1 border-b border-b1 px-5 pb-2 pt-3"
        >
          {TABS.map((t) => {
            const count = tabCounts[t.key] ?? 0;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                data-testid={`tab-${t.key.toLowerCase()}`}
                onClick={() => {
                  setTab(t.key);
                  setSelected(new Set());
                }}
                className="flex items-center gap-1 rounded px-3 py-1 font-mono text-mono-sm transition-colors"
                style={{
                  background: active ? 'rgba(125,207,255,0.1)' : 'transparent',
                  color: active ? 'var(--cyan)' : 'var(--td)',
                  border: active ? '1px solid rgba(125,207,255,0.3)' : '1px solid transparent',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {count > 0 && (
                  <span
                    className="ml-1 rounded px-1 text-[10px]"
                    style={{
                      background: active ? 'rgba(125,207,255,0.2)' : 'var(--b1)',
                      color: active ? 'var(--cyan)' : 'var(--td)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + select-all row */}
        <div className="flex items-center gap-3 border-b border-b1 px-5 py-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-td">⌕</span>
            <input
              data-testid="notifications-search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="search by user, content, post id..."
              className="w-full rounded border border-b2 bg-surf py-1.5 pl-8 pr-8 font-mono text-mono-sm text-tc placeholder-td focus:border-cyan/50 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-td hover:text-tc"
              >
                ×
              </button>
            )}
          </div>
          {selected.size === 0 && filtered.length > 0 && (
            <button
              data-testid="select-all-btn"
              onClick={handleSelectAll}
              className="shrink-0 font-mono text-mono-xs text-td hover:text-tc"
            >
              ☐ select all visible
            </button>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div
            data-testid="bulk-action-bar"
            className="flex items-center gap-3 border-b border-b1 bg-cyan/5 px-5 py-2"
          >
            <span className="font-mono text-mono-sm" style={{ color: 'var(--cyan)' }}>
              {selected.size} selected
            </span>
            <button
              data-testid="bulk-mark-read-btn"
              onClick={handleBulkMarkRead}
              className="act-btn border border-grn/30 px-2 py-0.5 text-mono-xs text-grn"
            >
              ✓ mark read
            </button>
            <button
              data-testid="bulk-delete-btn"
              onClick={handleBulkDelete}
              className="act-btn border border-red/30 px-2 py-0.5 text-mono-xs text-red"
            >
              ✕ delete
            </button>
            <button onClick={() => setSelected(new Set())} className="act-btn text-mono-xs text-td">
              clear
            </button>
          </div>
        )}

        {/* List */}
        <div className="mx-auto max-w-3xl pb-20">
          {isLoading && (
            <div
              data-testid="notifications-loading"
              className="px-5 py-10 text-center font-mono text-mono-sm text-td"
            >
              ⠋ loading...
            </div>
          )}

          {!isLoading && filtered.length === 0 && allItems.length === 0 && (
            <div data-testid="empty-state-all" className="px-5 py-16 text-center">
              <div className="mb-2 text-4xl opacity-30">◎</div>
              <div className="font-mono text-mono-sm text-td">
                // no notifications yet · inbox zero achieved
              </div>
            </div>
          )}

          {!isLoading && filtered.length === 0 && allItems.length > 0 && (
            <div data-testid="empty-state-filtered" className="px-5 py-16 text-center">
              <div className="mb-2 text-4xl opacity-30">◎</div>
              <div className="font-mono text-mono-sm text-td">
                // no notifications matching filters
              </div>
              <button
                onClick={() => {
                  setTab('ALL');
                  setSearch('');
                  setDebouncedSearch('');
                }}
                className="mt-3 font-mono text-mono-xs text-blu hover:underline"
              >
                ← clear
              </button>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label}>
              <div
                data-testid={`group-label-${group.label}`}
                className="sticky top-[96px] z-10 border-b border-b1 bg-surf/80 px-5 py-1.5 font-mono text-mono-xs text-td backdrop-blur-sm"
              >
                // {group.label} · {group.items.length}
              </div>
              {group.items.map((notif) => (
                <NotifRowPage
                  key={notif.id}
                  notif={notif}
                  selected={selected.has(notif.id)}
                  onToggleSelect={handleToggleSelect}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDeleteOne}
                />
              ))}
            </div>
          ))}

          {hasNextPage && (
            <div className="px-5 py-4 text-center">
              <button
                onClick={() => fetchNextPage()}
                className="font-mono text-mono-xs text-td hover:text-tc"
              >
                ⠋ load more...
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm clear all */}
      {showConfirmClear && (
        <div
          data-testid="confirm-clear-dialog"
          className="fixed inset-0 z-modal flex items-center justify-center bg-black/50"
        >
          <div className="w-[360px] rounded-lg border border-b2 bg-surf p-6 shadow-drop-lg">
            <div className="mb-1 font-mono text-mono-sm text-tc">// confirm clear all</div>
            <p className="mb-6 text-small text-td">
              Delete all {total} notifications? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="act-btn border border-b2 px-3 py-1.5 text-mono-xs text-td"
              >
                Cancel
              </button>
              <button
                data-testid="confirm-clear-btn"
                onClick={confirmClearAll}
                className="act-btn border border-red/30 bg-red/10 px-3 py-1.5 text-mono-xs text-red"
              >
                ✕ Delete all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
