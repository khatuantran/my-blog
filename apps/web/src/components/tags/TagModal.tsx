import { useEffect, useState } from 'react';
import { NEON_COLORS } from '@/lib/tag-colors';
import type { Tag, CreateTagPayload } from '@/types/api';

type Props = {
  open: boolean;
  variant: 'create' | 'edit';
  initial?: Tag | null;
  pending?: boolean;
  error?: string | null;
  onSubmit: (body: CreateTagPayload) => void;
  onClose: () => void;
};

export function TagModal({
  open,
  variant,
  initial,
  pending = false,
  error,
  onSubmit,
  onClose,
}: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(NEON_COLORS[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setName((initial?.name ?? '').replace(/^#/, ''));
    setColor(initial?.color ?? NEON_COLORS[0]);
    setDescription(initial?.description ?? '');
  }, [open, initial]);

  // Esc close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      color,
      description: description.trim() || undefined,
    });
  }

  const title = variant === 'create' ? '// create.tag' : '// edit.tag';
  const previewName = name.trim() || 'preview';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-[440px] max-w-full animate-fade-up-sm rounded-lg border border-cyan/25 bg-elev p-5 shadow-glow-cyan-modal"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="font-mono text-mono-sm text-tm">{title}</div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="font-mono text-base text-td transition-colors hover:text-tp"
          >
            ×
          </button>
        </div>

        {/* Live preview */}
        <div className="mb-4 rounded-sm border border-b2 bg-bg p-3">
          <div className="mb-1 font-mono text-[11px] text-td">// live preview</div>
          <span
            className="font-mono text-[17px] font-semibold leading-none"
            style={{ color, textShadow: `0 0 12px ${color}80` }}
          >
            #{previewName}
          </span>
        </div>

        {/* Name */}
        <div className="mb-3">
          <label htmlFor="tag-name" className="mb-1 block font-mono text-mono-sm text-tm">
            name <span className="text-td">// auto lowercase · unique</span>
          </label>
          <div className="flex items-center rounded-sm border border-b2 bg-bg transition-colors focus-within:border-cyan focus-within:shadow-glow-cyan-sm">
            <span className="select-none pl-3 font-mono text-sm font-semibold" style={{ color }}>
              #
            </span>
            <input
              id="tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="dev"
              autoFocus
              maxLength={50}
              className="w-full bg-transparent py-2 pl-1 pr-3 font-mono text-sm text-tp outline-none placeholder:text-td"
            />
          </div>
        </div>

        {/* Color */}
        <div className="mb-3">
          <div className="mb-1 font-mono text-mono-sm text-tm">color</div>
          <div className="flex flex-wrap gap-2">
            {NEON_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                style={{
                  background: c,
                  transform: color === c ? 'scale(1.15)' : undefined,
                  border: color === c ? '2px solid white' : '2px solid transparent',
                  boxShadow: color === c ? `0 0 8px ${c}80` : undefined,
                }}
                className="h-7 w-7 rounded-sm transition-all"
              />
            ))}
          </div>
          {/* Native color picker + hex */}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded-sm border border-b2 bg-transparent p-0"
              aria-label="Custom color"
            />
            <span className="font-mono text-[12px] text-tm">{color}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-3">
          <label htmlFor="tag-desc" className="mb-1 block font-mono text-mono-sm text-tm">
            description <span className="text-td">// optional · max 280</span>
          </label>
          <textarea
            id="tag-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder="Brief description..."
            className="w-full resize-y rounded-sm border border-b2 bg-bg px-3 py-2 font-mono text-sm text-tp outline-none placeholder:text-td focus:border-cyan focus:shadow-glow-cyan-sm"
          />
          <div className="mt-0.5 text-right font-mono text-mono-sm text-td">
            {description.length}/280
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-sm border border-red/40 bg-red/[0.08] px-3 py-2 font-mono text-[12px] text-red"
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-sm border border-b2 bg-surf px-3 py-1.5 font-mono text-mono-sm text-tm hover:text-tp disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="rounded-sm border border-cyan/50 bg-cyan/10 px-3 py-1.5 font-mono text-mono-sm text-cyan hover:bg-cyan/20 disabled:opacity-50"
          >
            {pending ? '⠋ ...' : variant === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
