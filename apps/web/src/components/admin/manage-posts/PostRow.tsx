import { MOOD_CFG } from '@/lib/mood-config';
import { TagPill } from '@/components/shared/TagPill';
import { StatusBadge } from './StatusBadge';
import type { AdminPost } from '@/types/api';

type Props = {
  post: AdminPost;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (post: AdminPost) => void;
  onDelete: (post: AdminPost) => void;
};

export function PostRow({ post, selected, onSelect, onEdit, onDelete }: Props) {
  const snippet = post.content.replace(/<[^>]+>/g, '').slice(0, 80);
  const mood = MOOD_CFG[post.mood];

  return (
    <div
      className={`grid items-center border-b border-b1 px-3 py-2 font-mono text-mono-sm transition-colors hover:bg-elev ${selected ? 'bg-cyan/[0.04]' : ''}`}
      style={{ gridTemplateColumns: '28px 1fr 100px 36px 140px 130px 64px' }}
      data-testid="post-row"
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        aria-label={`Select post ${post.id}`}
        onChange={(e) => onSelect(post.id, e.target.checked)}
        className="cursor-pointer accent-cyan"
      />

      {/* Snippet */}
      <div className="min-w-0 truncate text-ts">{snippet || '// empty'}</div>

      {/* Status */}
      <div>
        <StatusBadge status={post.status} />
      </div>

      {/* Mood */}
      <div title={mood.label}>{mood.emoji}</div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 overflow-hidden">
        {post.tags.slice(0, 2).map((t) => (
          <TagPill key={t.id} name={t.name} color={t.color} />
        ))}
        {post.tags.length > 2 && <span className="text-td">+{post.tags.length - 2}</span>}
      </div>

      {/* Counts */}
      <div className="flex gap-2 text-td">
        <span>❤{post.counts.reactions}</span>
        <span>💬{post.counts.comments}</span>
        <span>👁{post.viewCount}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <button
          type="button"
          aria-label={`Edit post ${post.id}`}
          onClick={() => onEdit(post)}
          className="rounded-sm border border-b2 px-1.5 py-0.5 text-tm hover:border-cyan hover:text-cyan"
        >
          ✎
        </button>
        <button
          type="button"
          aria-label={`Delete post ${post.id}`}
          onClick={() => onDelete(post)}
          className="rounded-sm border border-b2 px-1.5 py-0.5 text-tm hover:border-red hover:text-red"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
