import { TagPill } from '@/components/shared/TagPill';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
};

const SHARE_TARGETS = [
  { icon: '📘', label: 'Facebook' },
  { icon: '🐦', label: 'X' },
  { icon: '✈️', label: 'Telegram' },
  { icon: '🔗', label: 'Copy link' },
];

// Right column aside cho PostDetail. Sections: post.meta / tags / share / related (placeholder).
// Match design-file/MyBlog Post Detail.html L213-291.
export function MetaPanel({ post }: Props) {
  return (
    <aside
      className="meta-panel hidden w-[280px] shrink-0 space-y-5 lg:block"
      aria-label="Post metadata"
    >
      <div>
        <div className="sb-lbl">// post.meta</div>
        <dl className="space-y-1 font-mono text-mono-sm">
          <div className="flex justify-between">
            <dt className="text-tm">ID</dt>
            <dd className="text-ts">{post.id.slice(-6)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tm">Views</dt>
            <dd className="text-ts">{post.viewCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tm">Likes</dt>
            <dd className="text-ts">{post.counts.likes}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tm">Comments</dt>
            <dd className="text-ts">{post.counts.comments}</dd>
          </div>
        </dl>
      </div>

      {post.tags.length > 0 && (
        <div>
          <div className="sb-lbl">// tags</div>
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <TagPill key={t.id} name={t.name} color={t.color} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="sb-lbl">// share</div>
        <div className="flex flex-col gap-1.5">
          {SHARE_TARGETS.map((s) => (
            <button
              key={s.label}
              type="button"
              aria-label={`Share to ${s.label}`}
              className="flex items-center gap-1.5 rounded-sm border border-b2 bg-elev px-3 py-1.5 font-mono text-mono text-ts transition-colors hover:border-b3 hover:text-tp"
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="sb-lbl">// related</div>
        <div className="font-mono text-mono-xs text-td">// coming soon · M11</div>
      </div>
    </aside>
  );
}
