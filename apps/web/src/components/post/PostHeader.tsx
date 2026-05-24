import { Avatar } from '@/components/shared/Avatar';
import { MoodBadge } from '@/components/shared/MoodBadge';
import { formatRelative, formatTimestamp } from '@/lib/format-date';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
  avatarSize?: 'sm' | 'md' | 'lg';
};

// Header reuse giữa PostCard và PostDetail.
// Avatar + ~/username + [ ADMIN ] badge + [YYYY-MM-DD HH:MM] + pulse + relative + MoodBadge.
export function PostHeader({ post, avatarSize = 'md' }: Props) {
  const { author } = post;
  const ts = formatTimestamp(post.createdAt);
  const rel = formatRelative(post.createdAt);
  const isAdmin = author.role === 'ADMIN';
  return (
    <div className="mb-3 flex items-start gap-2.5">
      <Avatar username={author.username} avatarUrl={author.avatarUrl} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <div className="mb-px flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-mono-sm font-semibold text-blu">~/{author.username}</span>
          {isAdmin && (
            <span
              className="inline-flex items-center rounded-xs border border-ora/50 bg-ora/[0.06] font-mono text-mono-sm leading-none text-ora"
              style={{ padding: '1px 6px' }}
            >
              [ ADMIN ]
            </span>
          )}
          <span className="font-mono text-mono-sm text-td">·</span>
          <span className="font-mono text-mono-sm text-tm">{ts}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="animate-pulse-status text-[8px] text-grn">●</span>
          <span className="font-mono text-mono-sm text-tm">{rel}</span>
        </div>
      </div>
      <MoodBadge mood={post.mood} />
    </div>
  );
}
