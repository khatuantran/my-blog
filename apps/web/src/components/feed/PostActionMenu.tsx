import { useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { useTogglePostSave } from '@/hooks/mutations/use-save';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
  onClose: () => void;
  /** Nút trigger (⋯) — click vào trigger KHÔNG tính outside-close, để onClick của nó tự
   *  toggle đóng (tránh mousedown đóng rồi click mở lại — BUG-024). */
  triggerRef?: RefObject<HTMLElement | null>;
};

// PostActionMenu — context menu cho `⋯` button trên PostCard.
// Spec: docs/DESIGN_SYSTEM.md > PostActionMenu (M11.9 Gap 2/8).
export function PostActionMenu({ post, onClose, triggerRef }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const saveMutation = useTogglePostSave();
  const [copied, setCopied] = useState(false);

  // Click outside → close
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      // Click trên trigger (⋯) → bỏ qua, để onClick của trigger tự toggle đóng (BUG-024:
      // tránh mousedown đóng → click toggle mở lại).
      if (triggerRef?.current?.contains(target)) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, triggerRef]);

  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.id === post.author.id;
  const showAdminSection = isAdmin || isOwner;

  function handleOpenDetail() {
    onClose();
    navigate(`/post/${post.id}`);
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 900);
    } catch {
      // Clipboard API not available — fallback no-op
    }
  }

  function handleToggleSave() {
    saveMutation.mutate(
      { postId: post.id, currentlySaved: !!post.saved },
      { onSuccess: () => onClose() },
    );
  }

  function handleDelete() {
    // TODO: integrate ConfirmDialog (defer to T-372 ManagePostsPage)
    onClose();
  }

  return (
    <div
      ref={containerRef}
      role="menu"
      aria-label="Post actions"
      data-testid={`post-action-menu-${post.id}`}
      className="absolute bottom-full right-0 z-[60] mb-1.5 min-w-[250px] rounded-lg border border-cyan/25 bg-surf shadow-glow-cyan-md animate-fade-up-xs"
      style={{ boxShadow: '0 0 24px rgba(0,255,229,.08), 0 12px 40px rgba(0,0,0,.6)' }}
    >
      {/* Header */}
      <div className="border-b border-b1 bg-bg px-3.5 py-2.5">
        <div className="flex items-center gap-2 font-mono text-mono-xs">
          <span className="text-cyan">// post.actions</span>
          <span className="text-td">#{post.id.slice(-6)}</span>
        </div>
      </div>

      <div className="py-1">
        {/* User actions */}
        <button
          type="button"
          role="menuitem"
          onClick={handleOpenDetail}
          data-testid="action-open-detail"
          className="flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left font-mono text-mono-sm text-cyan transition-colors hover:bg-cyan/10"
        >
          <span className="inline-flex w-5 shrink-0 items-center justify-center text-base leading-none">
            ↗
          </span>
          <span className="flex-1">Open detail</span>
          <span className="text-mono-xs text-td">#{post.id.slice(-6)}</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={handleCopyLink}
          data-testid="action-copy-link"
          className={`flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left font-mono text-mono-sm transition-colors hover:bg-blu/10 ${
            copied ? 'text-grn' : 'text-blu'
          }`}
        >
          <span className="inline-flex w-5 shrink-0 items-center justify-center text-base leading-none">
            {copied ? '✓' : '🔗'}
          </span>
          <span className="flex-1">{copied ? 'Copied!' : 'Copy link'}</span>
        </button>

        {/* Save post — CHỈ auth user (FR-03.3). Anonymous không thấy. */}
        {user && (
          <button
            type="button"
            role="menuitem"
            onClick={handleToggleSave}
            data-testid="action-toggle-save"
            aria-pressed={!!post.saved}
            className="flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left font-mono text-mono-sm text-yel transition-colors hover:bg-yel/10"
          >
            <span className="inline-flex w-5 shrink-0 items-center justify-center text-base leading-none">
              🔖
            </span>
            <span className="flex-1">{post.saved ? 'Unsave post' : 'Save post'}</span>
          </button>
        )}

        {showAdminSection && (
          <>
            <div className="px-3.5 py-1 font-mono text-mono-xs text-td">// admin</div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onClose();
                navigate(`/admin/create?edit=${post.id}`);
              }}
              data-testid="action-edit"
              className="flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left font-mono text-mono-sm text-yel transition-colors hover:bg-yel/10"
            >
              <span className="inline-flex w-5 shrink-0 items-center justify-center text-base leading-none">
                ✎
              </span>
              <span className="flex-1">Edit post</span>
              <span className="text-mono-xs text-td">⌘E</span>
            </button>
          </>
        )}

        {showAdminSection && (
          <>
            <div className="px-3.5 py-1 font-mono text-mono-xs text-td">// danger</div>
            <button
              type="button"
              role="menuitem"
              onClick={handleDelete}
              data-testid="action-delete"
              className="flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left font-mono text-mono-sm text-red transition-colors hover:bg-red/10"
            >
              <span className="inline-flex w-5 shrink-0 items-center justify-center text-base leading-none">
                ✕
              </span>
              <span className="flex-1">Delete post</span>
              <span className="text-mono-xs text-td">permanent</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
