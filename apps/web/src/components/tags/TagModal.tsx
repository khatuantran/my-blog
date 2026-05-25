import { useEffect, useState } from 'react';
import { TAG_COLORS } from '@/lib/tag-colors';
import { TagPill } from '@/components/shared/TagPill';
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
  const [color, setColor] = useState<string>(TAG_COLORS[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setName((initial?.name ?? '').replace(/^#/, ''));
    setColor(initial?.color ?? TAG_COLORS[0]);
    setDescription(initial?.description ?? '');
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={variant === 'create' ? '// create.tag' : '// edit.tag'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-[480px] max-w-full rounded-lg border border-b2 bg-elev p-5 shadow-xl"
      >
        <div className="mb-3 font-mono text-mono-sm text-tm">
          {variant === 'create' ? '// create.tag' : '// edit.tag'}
        </div>

        <div className="mb-3">
          <label htmlFor="tag-name" className="mb-1 block font-mono text-mono-sm text-tm">
            name (auto # prefix · lowercase)
          </label>
          <input
            id="tag-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="❯ dev"
            autoFocus
            maxLength={50}
            className="w-full rounded-sm border border-b2 bg-bg px-3 py-2 font-mono text-sm text-tp outline-none placeholder:text-td focus:border-cyan focus:shadow-glow-cyan-sm"
          />
        </div>

        <div className="mb-3">
          <div className="mb-1 font-mono text-mono-sm text-tm">color</div>
          <div className="flex flex-wrap gap-1.5">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={`h-7 w-7 rounded-full border-2 transition-all ${
                  color === c ? 'border-tp shadow-glow-cyan-sm' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="tag-desc" className="mb-1 block font-mono text-mono-sm text-tm">
            description <span className="text-td">// optional, max 280</span>
          </label>
          <textarea
            id="tag-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Brief description..."
            className="w-full resize-y rounded-sm border border-b2 bg-bg px-3 py-2 font-mono text-sm text-tp outline-none placeholder:text-td focus:border-cyan focus:shadow-glow-cyan-sm"
          />
          <div className="mt-1 text-right font-mono text-mono-sm text-td">
            {description.length}/280
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1 font-mono text-mono-sm text-tm">// preview</div>
          <TagPill name={name.replace(/^#/, '') || 'preview'} color={color} />
        </div>

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-sm border border-red/40 bg-red/[0.08] px-3 py-2 font-mono text-mono-sm text-red"
          >
            {error}
          </div>
        )}

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
