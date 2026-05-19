import { useEffect } from 'react';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = '// confirm.action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={`w-[400px] max-w-full rounded-md border bg-elev p-5 shadow-xl ${
          destructive ? 'border-red/30' : 'border-b2'
        }`}
      >
        <div className={`mb-2 font-mono text-mono-xs ${destructive ? 'text-red' : 'text-tm'}`}>
          {destructive ? '⚠️ ' : ''}
          {title}
        </div>
        <div className="mb-4 text-sm text-tp">{message}</div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-sm border border-b2 bg-surf px-3 py-1.5 font-mono text-mono-xs text-tm transition-colors hover:border-b3 hover:text-tp disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-sm border px-3 py-1.5 font-mono text-mono-xs transition-colors disabled:opacity-50 ${
              destructive
                ? 'border-red/50 bg-red/10 text-red hover:bg-red/20'
                : 'border-cyan/50 bg-cyan/10 text-cyan hover:bg-cyan/20'
            }`}
          >
            {pending ? '⠋ ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
