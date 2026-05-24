import { useState } from 'react';
import { TagPill } from '@/components/shared/TagPill';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
};

const SHARE_TARGETS = [
  { icon: '📘', label: 'Facebook' },
  { icon: '🐦', label: 'X' },
  { icon: '✈️', label: 'Telegram' },
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
            <dt className="text-tm">Reactions</dt>
            <dd className="text-ts">{post.counts.reactions}</dd>
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
        <div className="font-mono text-mono-xs text-td">// coming soon · M11</div>
      </div>
    </aside>
  );
}
