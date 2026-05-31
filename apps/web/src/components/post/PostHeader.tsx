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
  const authorName = author.name?.trim();
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
        {/* Name row: tên (đậm) + [ ROLE ] badge — mirror profile hero (FR-11.8). Click tên → profile. */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/profile/${author.username}`}
            data-testid="post-author-link"
            className="font-mono text-mono-lg font-semibold text-tp no-underline hover:underline"
          >
            {authorName || author.username}
          </Link>
          <span
            className={`inline-flex items-center rounded-sm border font-mono text-mono-sm leading-none ${
              author.role === 'ADMIN'
                ? 'border-ora/50 bg-ora/[0.06] text-ora'
                : author.role === 'BANNED'
                  ? 'border-red/50 bg-red/[0.06] text-red'
                  : 'border-b2 text-tm'
            }`}
            style={{ padding: '1px 6px' }}
          >
            [ {author.role} ]
          </span>
        </div>
        {/* Handle row: ~/username (cyan) · status · time — mirror hero handle row. */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-mono">
          <span className="text-cyan">~/{author.username}</span>
          <span className="text-td">·</span>
          <span className="animate-pulse-status text-[8px] text-grn">●</span>
          <span className="text-tm">{rel}</span>
          <span className="text-td">·</span>
          <span className="text-tm">{ts}</span>
        </div>
      </div>
      <MoodBadge mood={post.mood} />
    </div>
  );
}
