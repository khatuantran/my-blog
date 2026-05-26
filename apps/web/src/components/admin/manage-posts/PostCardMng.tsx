import { MOOD_CFG } from '@/lib/mood-config';
import { TagPill } from '@/components/shared/TagPill';
import { StatusBadge } from './StatusBadge';
import type { AdminPost } from '@/types/api';

type Props = {
  post: AdminPost;
  onEdit: (post: AdminPost) => void;
  onDelete: (post: AdminPost) => void;
};

export function PostCardMng({ post, onEdit, onDelete }: Props) {
  const snippet = post.content.replace(/<[^>]+>/g, '').slice(0, 160);
  const mood = MOOD_CFG[post.mood];

  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-b2 bg-surf p-3 transition-colors hover:border-b3"
      data-testid="post-card-mng"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <StatusBadge status={post.status} />
        <span title={mood.label}>{mood.emoji}</span>
        <span className="ml-auto font-mono text-[10px] text-td">#{post.id.slice(-6)}</span>
      </div>

      {/* Snippet */}
      <div className="line-clamp-3 text-sm text-ts">{snippet || '// empty'}</div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.tags.slice(0, 4).map((t) => (
            <TagPill key={t.id} name={t.name} color={t.color} />
          ))}
        </div>
      )}

      {/* Stats + actions */}
      <div className="flex items-center justify-between border-t border-b1 pt-2">
        <div className="flex gap-2 font-mono text-[10px] text-td">
          <span>❤{post.counts.reactions}</span>
          <span>💬{post.counts.comments}</span>
          <span>👁{post.viewCount}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label={`Edit post ${post.id}`}
            onClick={() => onEdit(post)}
            className="rounded-sm border border-b2 px-2 py-0.5 font-mono text-mono-sm text-tm hover:border-cyan hover:text-cyan"
          >
            ✎ Edit
          </button>
          <button
            type="button"
            aria-label={`Delete post ${post.id}`}
            onClick={() => onDelete(post)}
            className="rounded-sm border border-b2 px-2 py-0.5 font-mono text-mono-sm text-tm hover:border-red hover:text-red"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
