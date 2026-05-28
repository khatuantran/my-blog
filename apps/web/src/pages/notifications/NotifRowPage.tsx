import type { NotificationItem } from '@/types/api';
import { formatRelative } from '@/lib/format-date';
import { NOTIF_TYPE_CFG } from '@/lib/notification-format';
import { Link } from 'react-router';

interface Props {
  notif: NotificationItem;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onMarkRead: (id: string, read: boolean) => void;
  onDelete: (id: string) => void;
}

export function NotifRowPage({ notif, selected, onToggleSelect, onMarkRead, onDelete }: Props) {
  const cfg = NOTIF_TYPE_CFG[notif.type] ?? NOTIF_TYPE_CFG.REACTION;
  const replyTo = notif.metadata?.replyTo?.username;

  const borderColor = selected ? 'var(--cyan)' : notif.read ? 'transparent' : cfg.color;
  const bgTint = selected ? 'rgba(0,255,229,0.05)' : notif.read ? 'transparent' : `${cfg.color}0f`;

  const timeAgo = formatRelative(notif.createdAt);
  const postLink = notif.postId ? `/post/${notif.postId}` : '#';

  return (
    <div
      data-testid="notif-row-page"
      className="group flex gap-3 px-[18px] py-[14px] hover:bg-elev"
      style={{ borderLeft: `3px solid ${borderColor}`, background: bgTint }}
    >
      {/* Checkbox */}
      <button
        data-testid="notif-row-checkbox"
        onClick={() => onToggleSelect(notif.id)}
        className="mt-[10px] h-4 w-4 shrink-0 rounded-sm border border-[#3D4A63] transition-colors"
        style={selected ? { background: 'var(--cyan)', borderColor: 'var(--cyan)' } : {}}
        aria-label="Select notification"
      >
        {selected && (
          <span
            className="flex items-center justify-center text-[10px] leading-none"
            style={{ color: 'var(--bg)' }}
          >
            ✓
          </span>
        )}
      </button>

      {/* Avatar + badge */}
      <div className="relative shrink-0">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border border-b2 font-mono text-sm font-bold"
          style={{ background: 'var(--elev)', color: 'var(--tc)' }}
        >
          {notif.actor ? notif.actor.username[0]?.toUpperCase() : '?'}
        </div>
        <div
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold"
          style={{
            background: cfg.color,
            borderColor: 'var(--surf)',
            color: 'var(--bg)',
            boxShadow: `0 0 5px ${cfg.color}80`,
          }}
        >
          {cfg.icon}
        </div>
      </div>

      {/* Content */}
      <Link
        to={postLink}
        className="min-w-0 flex-1"
        onClick={() => !notif.read && onMarkRead(notif.id, true)}
      >
        <div className="text-small leading-snug">
          <span className="font-mono text-blu">{notif.actor?.username ?? '[anon]'}</span>
          <span className="text-td"> {cfg.verb} </span>
          {notif.type === 'REPLY' && replyTo && (
            <span className="text-td">
              from <span className="text-blu">@{replyTo}</span>{' '}
            </span>
          )}
          {notif.type !== 'REPLY' && <span className="text-td">your post</span>}
        </div>
        {notif.targetId && (
          <div className="mt-0.5 max-w-[520px] truncate font-mono text-[12px] italic text-td">
            #{notif.targetId.slice(0, 8)}…
          </div>
        )}
        <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-td">
          <span>#{notif.postId?.slice(0, 6) ?? '——'}</span>
          <span>·</span>
          <span>{timeAgo}</span>
          {!notif.read && (
            <>
              <span>·</span>
              <span style={{ color: cfg.color }}>● new</span>
            </>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          data-testid="notif-row-mark-toggle"
          onClick={() => onMarkRead(notif.id, !notif.read)}
          className="act-btn text-[13px]"
          style={{ color: notif.read ? 'var(--td)' : 'var(--cyan)' }}
          title={notif.read ? 'Mark unread' : 'Mark read'}
        >
          {notif.read ? '○' : '●'}
        </button>
        <button
          data-testid="notif-row-delete"
          onClick={() => onDelete(notif.id)}
          className="act-btn border border-red/30 text-[11px] text-red"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
