import type { NotificationItem, NotificationType } from '@/types/api';

export type NotifTypeCfg = {
  icon: string;
  color: string;
  verb: string;
};

export const NOTIF_TYPE_CFG: Record<NotificationType, NotifTypeCfg> = {
  REACTION: { icon: '❤', color: '#FF6E96', verb: 'reacted to' },
  COMMENT: { icon: '💬', color: '#7DCFFF', verb: 'commented on' },
  REPLY: { icon: '↩', color: '#9ECE6A', verb: 'replied to your comment on' },
  SHARE: { icon: '↗', color: '#BB9AF7', verb: 'shared' },
};

const REACTION_EMOJI: Record<string, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😆',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡',
};

export function reactionEmoji(type: string): string {
  return REACTION_EMOJI[type] ?? '👍';
}

export function notificationVerb(item: NotificationItem): string {
  const actor = item.actor?.username ?? 'Someone';
  switch (item.type) {
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

export function notifTargetPath(item: NotificationItem): string {
  const id = item.postId ?? (item.targetType === 'POST' ? item.targetId : null);
  return id ? `/post/${id}` : '/';
}
