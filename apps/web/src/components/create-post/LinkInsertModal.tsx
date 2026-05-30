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
        className="fixed left-1/2 top-1/2 z-modal w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-cyan/30 bg-elev shadow-glow-cyan-md"
      >
        {/* Header bar (design L873): 🔗 insert.link cyan + ~/editor/link subline + × close */}
        <div className="flex items-center justify-between border-b border-b1 bg-bg px-[18px] py-3.5">
          <div>
            <div className="font-mono text-[12px] text-cyan">🔗 insert.link</div>
            <div className="mt-0.5 font-mono text-[10px] text-td">~/editor/link</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="font-mono text-[20px] leading-none text-tm hover:text-tp"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-[18px]">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] text-tm">
              DISPLAY TEXT <span className="text-td">(if no selection)</span>
            </label>
            <input
              // autoFocus when no selection so user can fill in display text first.
              autoFocus={!initialText}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="click here..."
              data-testid="link-modal-label"
              className="w-full rounded-md border border-b2 bg-[#070A14] px-3 py-2 font-mono text-[13px] text-tp outline-none focus:border-cyan focus:shadow-glow-cyan-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] text-tm">URL</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-cyan">
                ❯
              </span>
              <input
                ref={urlRef}
                // autoFocus when selection already fills label, so user goes straight to URL.
                autoFocus={!!initialText}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                data-testid="link-modal-url"
                className="w-full rounded-md border border-b2 bg-[#070A14] py-2 pl-7 pr-3 font-mono text-[13px] text-tp outline-none focus:border-cyan focus:shadow-glow-cyan-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="mr-auto font-mono text-[10px] text-td">↵ insert · Esc cancel</span>
            <button
              type="button"
              onClick={onClose}
              data-testid="link-modal-cancel"
              className="rounded-md border border-b2 bg-elev px-4 py-1.5 font-mono text-[12px] text-tm hover:text-tp"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              data-testid="link-modal-insert"
              className="rounded-md bg-cyan px-[18px] py-1.5 font-mono text-[12px] font-semibold text-[#0A0E1A] shadow-[0_0_12px_rgba(0,255,229,0.3)] transition-all hover:bg-cyan/80 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              ↵ Insert Link
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
