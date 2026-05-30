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

// T-417 design L412-454 — PostCardMng:
// Header: #id + status + mood inline + date right-aligned
// Snippet: 2-line clamp
// Tags + stats row: tags left + stats inline với 📷/📎 conditional right
// Actions footer: View blu + Edit cyan + Delete red 3-button
export function PostCardMng({ post, onEdit, onDelete }: Props) {
  const snippet = post.content
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`]/g, '');
  const mood = MOOD_CFG[post.mood];
  const imagesCount = post.images?.length ?? 0;
  const filesCount = post.files?.length ?? 0;

  return (
    <div
      className="rounded-md border border-b2 bg-elev p-3.5 transition-all hover:border-cyan/40 hover:shadow-[0_0_18px_rgba(0,255,229,0.08)]"
      data-testid="post-card-mng"
    >
      {/* Top row — id + status + mood + date right */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-td">#{post.id.slice(-6)}</span>
        <StatusBadge status={post.status} />
        <span
          className="inline-flex items-center gap-1 rounded border px-1.5 py-px font-mono text-[10px]"
          style={{
            color: mood.color,
            background: `${mood.color}26`,
            borderColor: `${mood.color}66`,
          }}
        >
          {mood.emoji} {mood.label}
        </span>
        <span className="ml-auto font-mono text-[10px] text-td">{formatDate(post.createdAt)}</span>
      </div>

      {/* Content 2-line clamp */}
      <p className="mb-2.5 line-clamp-2 text-[13px] leading-relaxed text-ts">
        {snippet || '// empty'}
      </p>

      {/* Tags + stats row */}
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        {post.tags.slice(0, 4).map((t) => {
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
        <span className="ml-auto flex gap-2.5 font-mono text-[10px] text-td">
          <span>♡ {post.counts.reactions}</span>
          <span>💬 {post.counts.comments}</span>
          {imagesCount > 0 && <span>📷 {imagesCount}</span>}
          {filesCount > 0 && <span>📎 {filesCount}</span>}
        </span>
      </div>

      {/* Actions footer — 3 button per design L447-451 */}
      <div className="flex gap-1.5 border-t border-b1 pt-2.5">
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
          ✕ Delete
        </button>
      </div>
    </div>
  );
}
