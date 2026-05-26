import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  initialText: string;
  onApply: (url: string, label: string) => void;
  onClose: () => void;
};

// LinkInsertModal (T-369) — 420px modal triggered by 🔗 toolbar button / ⌘K.
// Pre-fills label from selected text; restores editor selection on apply via
// RichTextEditorHandle.applyLink called by parent (CreatePostPage).
// Component unmounts when closed (if !open return null), so autoFocus fires fresh each open.
export function LinkInsertModal({ open, initialText, onApply, onClose }: Props) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLabel(initialText);
    setUrl('');
  }, [open, initialText]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimUrl = url.trim();
    if (!trimUrl) return;
    onApply(trimUrl, label.trim());
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-modal bg-black/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Insert link"
        data-testid="link-insert-modal"
        className="fixed left-1/2 top-1/2 z-modal w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-cyan/35 bg-surf p-5 shadow-glow-cyan-md"
      >
        <div className="mb-4 font-mono text-mono-sm text-td">// insert.link</div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block font-mono text-mono-sm text-tm">// text label</label>
            <input
              // autoFocus when no selection so user can fill in display text first.
              // When selection exists, URL input gets autoFocus below.
              autoFocus={!initialText}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="display text"
              data-testid="link-modal-label"
              className="w-full rounded-md border border-b2 bg-bg px-3 py-1.5 font-mono text-mono-sm text-tp outline-none focus:border-cyan focus:shadow-glow-cyan-sm"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-mono-sm text-tm">// url</label>
            <input
              ref={urlRef}
              // autoFocus when selection already fills label, so user goes straight to URL.
              autoFocus={!!initialText}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              data-testid="link-modal-url"
              className="w-full rounded-md border border-b2 bg-bg px-3 py-1.5 font-mono text-mono-sm text-tp outline-none focus:border-cyan focus:shadow-glow-cyan-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              data-testid="link-modal-cancel"
              className="rounded-sm border border-b2 bg-elev px-3 py-1.5 font-mono text-mono-sm text-tm hover:text-tp"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              data-testid="link-modal-insert"
              className="rounded-sm border border-cyan/50 bg-cyan/10 px-3 py-1.5 font-mono text-mono-sm text-cyan hover:bg-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↵ Insert
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
