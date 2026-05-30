import { useState } from 'react';
import { TagPill } from '@/components/shared/TagPill';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
};

// design L474: per-brand color
const SHARE_TARGETS = [
  { icon: '📘', label: 'Facebook', color: '#1877F2' },
  { icon: '🐦', label: 'X (Twitter)', color: '#E6EDF3' },
  { icon: '✈️', label: 'Telegram', color: '#2AABEE' },
] as const;

function buildPostUrl(postId: string): string {
  if (typeof window === 'undefined') return `/post/${postId}`;
  return `${window.location.origin}/post/${postId}`;
}

export function MetaPanel({ post }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    const url = buildPostUrl(post.id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / permission) — silently skip toast
    }
  }

  return (
    <aside
      className="meta-panel sticky top-[52px] hidden h-[calc(100vh-80px)] w-[260px] shrink-0 space-y-5 overflow-y-auto border-l border-b1 bg-elev px-4 py-5 lg:block"
      aria-label="Post metadata"
    >
      <div>
        <div className="sb-lbl">// post.meta</div>
        <dl className="font-mono text-mono-sm">
          {/* design L455: mỗi row có borderBottom + padding */}
          <div className="flex justify-between border-b border-b1 py-1.5">
            <dt className="text-tm">ID</dt>
            <dd className="text-tp">{post.id.slice(-6)}</dd>
          </div>
          <div className="flex justify-between border-b border-b1 py-1.5">
            <dt className="text-tm">Views</dt>
            <dd className="text-tp">{post.viewCount}</dd>
          </div>
          <div className="flex justify-between border-b border-b1 py-1.5">
            <dt className="text-tm">Reactions</dt>
            <dd className="text-tp">{post.counts.reactions}</dd>
          </div>
          <div className="flex justify-between border-b border-b1 py-1.5">
            <dt className="text-tm">Comments</dt>
            <dd className="text-tp">{post.counts.comments}</dd>
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
              style={{ color: s.color }}
              className="flex items-center gap-1.5 rounded-sm border border-b2 bg-elev px-3 py-1.5 font-mono text-mono transition-colors hover:border-b3"
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy post link"
            aria-live="polite"
            className={`flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-mono transition-colors ${
              copied
                ? 'border-grn/50 bg-grn/10 text-grn'
                : 'border-b2 bg-elev text-ts hover:border-cyan/50 hover:text-cyan'
            }`}
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span>{copied ? '// link copied' : 'Copy link'}</span>
          </button>
        </div>
      </div>

      <div>
        <div className="sb-lbl">// related</div>
        <div className="font-mono text-mono-sm text-td">// coming soon · M11</div>
      </div>
    </aside>
  );
}
