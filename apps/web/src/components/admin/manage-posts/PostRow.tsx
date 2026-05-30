import { Link } from 'react-router';
import { MOOD_CFG } from '@/lib/mood-config';
import { StatusBadge } from './StatusBadge';
import type { AdminPost } from '@/types/api';

type Props = {
  post: AdminPost;
  onEdit: (post: AdminPost) => void;
  onDelete: (post: AdminPost) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// T-417 design L362-409 — PostRow 6-col fr grid (NO checkbox column per design strict).
// Stats 2-line (counts + date below), actions 3-button (👁 View blu / ✎ Edit cyan / ✕ red).
export function PostRow({ post, onEdit, onDelete }: Props) {
  const snippet = post.content
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`]/g, '')
    .slice(0, 90);
  const mood = MOOD_CFG[post.mood];

  return (
    <div
      className="grid items-center border-b border-b1 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-bg/50"
      style={{ gridTemplateColumns: '3fr 1fr 1.2fr 1.4fr 1fr 1.5fr', gap: '12px' }}
      data-testid="post-row"
      role="listitem"
    >
      {/* Post — id + content preview */}
      <div className="min-w-0">
        <div className="mb-1 font-mono text-[11px] text-td">#{post.id.slice(-6)}</div>
        <p className="truncate text-[13px] leading-snug text-ts">{snippet || '// empty'}</p>
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={post.status} />
      </div>

      {/* Mood — pill with bg+border per design L385-387 */}
      <div>
        <span
          className="inline-flex items-center gap-1 rounded border px-1.5 py-px font-mono text-[11px]"
          style={{
            color: mood.color,
            background: `${mood.color}26`,
            borderColor: `${mood.color}66`,
          }}
        >
          {mood.emoji} {mood.label}
        </span>
      </div>

      {/* Tags — max 2 + overflow count, pill chip style design L391-394 */}
      <div className="flex flex-wrap gap-1 overflow-hidden">
        {post.tags.slice(0, 2).map((t) => {
          const color = t.color ?? '#00FFE5';
          return (
            <span
              key={t.id}
              className="rounded-[3px] border px-1.5 py-px font-mono text-[10px]"
              style={{
                color,
                background: `${color}26`,
                borderColor: `${color}66`,
              }}
            >
              {t.name}
            </span>
          );
        })}
        {post.tags.length > 2 && (
          <span className="font-mono text-[10px] text-td">+{post.tags.length - 2}</span>
        )}
      </div>

      {/* Stats 2-line — counts row + date row per design L397-400 */}
      <div className="flex flex-col gap-0.5 font-mono text-[11px] text-tm">
        <span>
          ♡ {post.counts.reactions} · 💬 {post.counts.comments}
        </span>
        <span className="text-td">{formatDate(post.createdAt)}</span>
      </div>

      {/* Actions 3-button — View blu / Edit cyan / ✕ red per design L402-406 */}
      <div className="flex justify-end gap-1.5">
        <Link
          to={`/post/${post.id}`}
          aria-label={`View post ${post.id}`}
          className="rounded border px-2 py-1 font-mono text-[11px] text-blu hover:bg-blu/10"
          style={{ borderColor: 'rgba(125,207,255,0.25)' }}
        >
          👁 View
        </Link>
        <button
          type="button"
          aria-label={`Edit post ${post.id}`}
          onClick={() => onEdit(post)}
          className="rounded border border-cyan/40 px-2 py-1 font-mono text-[11px] text-cyan hover:bg-cyan/10"
        >
          ✎ Edit
        </button>
        <button
          type="button"
          aria-label={`Delete post ${post.id}`}
          onClick={() => onDelete(post)}
          className="rounded border px-2 py-1 font-mono text-[11px] text-red hover:bg-red/10"
          style={{ borderColor: 'rgba(247,118,142,0.25)' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
