import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePostComments } from '@/hooks/queries/use-comments';
import { CommentItem } from '@/components/comment/CommentItem';
import { CommentForm } from '@/components/comment/CommentForm';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';

type Props = {
  postId: string;
  postExcerpt?: string;
  onClose: () => void;
};

export function CommentsModal({ postId, postExcerpt, onClose }: Props) {
  const { data, isLoading, isError } = usePostComments(postId);

  // Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Body scroll lock
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const items = data?.items ?? [];

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comments"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
      data-testid="comments-modal"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[640px] flex-col rounded-lg border border-b2 bg-surf shadow-glow-cyan-lg"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-b1 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-mono text-mono-md text-cyan">// comments</h2>
            {postExcerpt && (
              <p className="mt-0.5 truncate font-mono text-mono-sm text-td">{postExcerpt}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comments"
            data-testid="comments-modal-close"
            className="ml-4 shrink-0 rounded-md border-none bg-transparent px-2 py-1 font-mono text-mono-lg text-tm transition-colors hover:text-tp"
          >
            ×
          </button>
        </header>

        {/* Body — comment list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="flex items-center gap-2 font-mono text-mono text-tm">
              <AsciiSpinner /> loading comments...
            </div>
          )}
          {isError && (
            <div className="font-mono text-mono-sm text-red">// failed to load comments</div>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <div className="py-8 text-center font-mono text-mono text-tm">
              // no comments yet — be the first ❯
            </div>
          )}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
            </div>
          )}
        </div>

        {/* Footer — comment form */}
        <footer className="border-t border-b1 bg-bg/40 p-4">
          <CommentForm postId={postId} />
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
