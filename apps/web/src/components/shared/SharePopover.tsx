import { useEffect, useRef, useState } from 'react';
import { openShare, type SharePlatform } from '@/lib/share';
import { stripHtml } from '@/lib/strip-html';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
  /** class cho nút trigger để khớp action bar từng nơi (feed vs detail). */
  triggerClassName?: string;
};

const SHARE_TARGETS = [
  { platform: 'facebook', icon: '📘', label: 'Facebook', color: '#1877F2' },
  { platform: 'x', icon: '🐦', label: 'X (Twitter)', color: '#E6EDF3' },
  { platform: 'telegram', icon: '✈️', label: 'Telegram', color: '#2AABEE' },
] as const satisfies readonly {
  platform: SharePlatform;
  icon: string;
  label: string;
  color: string;
}[];

function buildPostUrl(postId: string): string {
  if (typeof window === 'undefined') return `/post/${postId}`;
  return `${window.location.origin}/post/${postId}`;
}

// Nút "↗ Share" + popover 4 lựa chọn (Facebook / X / Telegram / Copy link).
// Dùng share intent URL công khai — KHÔNG cần API key (FR-05.1). Reuse ở Feed PostCard
// + Post Detail action bar.
export function SharePopover({ post, triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const url = buildPostUrl(post.id);
  const text = stripHtml(post.content).slice(0, 120);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return; // trigger tự toggle (BUG-024 pattern)
      if (containerRef.current && !containerRef.current.contains(target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleShare(platform: SharePlatform) {
    openShare(platform, { url, text });
    setOpen(false);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 900);
    } catch {
      // Clipboard unavailable — silently skip
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Share post"
        aria-expanded={open}
        data-testid={`post-share-trigger-${post.id}`}
        className={triggerClassName}
      >
        <span>↗</span>
        <span>Share</span>
      </button>

      {open && (
        <div
          ref={containerRef}
          role="menu"
          aria-label="Share options"
          data-testid={`share-popover-${post.id}`}
          className="absolute bottom-full left-0 z-[60] mb-1.5 min-w-[200px] rounded-lg border border-cyan/25 bg-surf py-1 shadow-glow-cyan-md animate-fade-up-xs"
          style={{ boxShadow: '0 0 24px rgba(0,255,229,.08), 0 12px 40px rgba(0,0,0,.6)' }}
        >
          <div className="border-b border-b1 bg-bg px-3.5 py-2 font-mono text-mono-xs text-cyan">
            // share
          </div>
          {SHARE_TARGETS.map((s) => (
            <button
              key={s.platform}
              type="button"
              role="menuitem"
              onClick={() => handleShare(s.platform)}
              aria-label={`Share to ${s.label}`}
              data-testid={`share-${s.platform}-${post.id}`}
              style={{ color: s.color }}
              className="flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left font-mono text-mono-sm transition-colors hover:bg-cyan/10"
            >
              <span className="inline-flex w-5 shrink-0 items-center justify-center leading-none">
                {s.icon}
              </span>
              <span className="flex-1">{s.label}</span>
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={handleCopyLink}
            aria-label="Copy post link"
            data-testid={`share-copy-${post.id}`}
            className={`flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left font-mono text-mono-sm transition-colors hover:bg-blu/10 ${
              copied ? 'text-grn' : 'text-blu'
            }`}
          >
            <span className="inline-flex w-5 shrink-0 items-center justify-center leading-none">
              {copied ? '✓' : '🔗'}
            </span>
            <span className="flex-1">{copied ? '// link copied' : 'Copy link'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
