import type { NotificationItem } from '@/types/api';
import { formatRelative } from '@/lib/format-date';
import { NOTIF_TYPE_CFG } from '@/lib/notification-format';

interface Props {
  notif: NotificationItem;
  onClickItem: (notif: NotificationItem) => void;
}

export function NotifRowBell({ notif, onClickItem }: Props) {
  const cfg = NOTIF_TYPE_CFG[notif.type] ?? NOTIF_TYPE_CFG.REACTION;
  const replyTo = notif.metadata?.replyTo?.username;

  const borderColor = notif.read ? 'transparent' : cfg.color;
  const bgTint = notif.read ? 'transparent' : `${cfg.color}10`;
  const timeAgo = formatRelative(notif.createdAt);
  const postIdShort = notif.postId?.slice(0, 6) ?? '——';

  return (
    <button
      type="button"
      data-testid={`notification-item-${notif.id}`}
      onClick={() => onClickItem(notif)}
      className="group flex w-full items-start gap-[10px] px-4 py-[10px] text-left transition-colors hover:bg-elev"
      style={{
        borderLeft: `2px solid ${borderColor}`,
        background: bgTint,
      }}
    >
      {/* Avatar + type badge */}
      <div className="relative shrink-0">
        {notif.actor ? (
          <div
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full font-mono text-sm font-bold"
            style={{
              border: '1.5px solid var(--b2)',
              background: 'linear-gradient(135deg, rgba(125,207,255,0.2), rgba(187,154,247,0.2))',
              color: 'var(--tc)',
            }}
          >
            {notif.actor.username[0]?.toUpperCase()}
          </div>
        ) : (
          <div
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full font-mono text-sm"
            style={{
              border: '1.5px solid var(--b2)',
              background: 'var(--elev)',
              color: 'var(--td)',
            }}
          >
            ?
          </div>
        )}
        <div
          data-testid="notif-row-bell-badge"
          className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold"
          style={{
            background: cfg.color,
            border: '2px solid var(--surf)',
            color: 'var(--bg)',
            boxShadow: `0 0 4px ${cfg.color}80`,
          }}
        >
          {cfg.icon}
        </div>
      </div>

      {/* Content (3 lines) */}
      <div className="min-w-0 flex-1">
        <div className="text-small leading-snug">
          <span className="font-mono text-blu">{notif.actor?.username ?? '[anon]'}</span>
          <span className="text-td"> {cfg.verb} </span>
          {notif.type === 'REPLY' && replyTo ? (
            <span className="text-td">
              from <span className="text-blu">@{replyTo}</span>
            </span>
          ) : (
            <span className="text-td">your post</span>
          )}
        </div>
        {notif.targetId && (
          <div className="mt-0.5 truncate font-mono text-[12px] italic text-td">
            #{notif.targetId.slice(0, 8)}…
          </div>
        )}
        <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-td">
          <span>#{postIdShort}</span>
          <span>·</span>
          <span>{timeAgo}</span>
          {!notif.read && (
            <>
              <span>·</span>
              <span style={{ color: cfg.color }}>● new</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
