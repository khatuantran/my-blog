import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '@/components/shared/Avatar';
import { AvatarPreviewModal } from '@/components/shared/AvatarPreviewModal';
import { MoodBadge } from '@/components/shared/MoodBadge';
import { formatRelative, formatTimestamp } from '@/lib/format-date';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
  avatarSize?: 'sm' | 'md' | 'lg';
};

// Header reuse giữa PostCard và PostDetail.
// Avatar (click → popup phóng to) + ~/username (click → profile) + [ ADMIN ] badge +
// [YYYY-MM-DD HH:MM] + pulse + relative + MoodBadge.
export function PostHeader({ post, avatarSize = 'md' }: Props) {
  const { author } = post;
  const ts = formatTimestamp(post.createdAt);
  const rel = formatRelative(post.createdAt);
  const isAdmin = author.role === 'ADMIN';
  const [showAvatar, setShowAvatar] = useState(false);
  return (
    <div className="mb-3 flex items-start gap-2.5">
      <button
        type="button"
        onClick={() => setShowAvatar(true)}
        aria-label={`View ${author.username} avatar`}
        data-testid="post-avatar-btn"
        className="shrink-0 rounded-full border-none bg-transparent p-0 leading-none cursor-pointer transition-transform hover:scale-105"
      >
        <Avatar username={author.username} avatarUrl={author.avatarUrl} size={avatarSize} />
      </button>
      {showAvatar && (
        <AvatarPreviewModal
          username={author.username}
          avatarUrl={author.avatarUrl}
          onClose={() => setShowAvatar(false)}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-px flex flex-wrap items-center gap-1.5">
          <Link
            to={`/profile/${author.username}`}
            data-testid="post-author-link"
            className="font-mono text-mono-lg font-semibold text-blu no-underline hover:underline"
          >
            ~/{author.username}
          </Link>
          {isAdmin && (
            <span
              className="inline-flex items-center rounded-xs border border-ora/50 bg-ora/[0.06] font-mono text-[10px] leading-none text-ora"
              style={{ padding: '1px 6px' }}
            >
              [ ADMIN ]
            </span>
          )}
          <span className="font-mono text-mono text-td">·</span>
          <span className="font-mono text-mono text-tm">{ts}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="animate-pulse-status text-[8px] text-grn">●</span>
          <span className="font-mono text-mono text-tm">{rel}</span>
        </div>
      </div>
      <MoodBadge mood={post.mood} />
    </div>
  );
}
