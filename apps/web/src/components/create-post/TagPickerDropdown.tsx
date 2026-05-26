import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { TagPill } from '@/components/shared/TagPill';
import { useTags } from '@/hooks/queries/use-tags';
import { pickTagColor } from '@/lib/tag-colors';

export type TagDraft = { name: string; color: string };

type Props = {
  value: TagDraft[];
  onChange: (next: TagDraft[]) => void;
  maxCount?: number;
};

const MAX_TAGS = 10;

// TagPickerDropdown (T-367) — master-data picker per design-file v2.
// Replaces free-form text input. Shows system tags fetched via useTags(), filters out
// already-selected, click `+ <name> N` chip → adds to value. Footer link → /tags for
// users who can't find their tag (admin creates new ones there).
export function TagPickerDropdown({ value, onChange, maxCount = MAX_TAGS }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tagsQ = useTags({ sort: 'top', limit: 30 });

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const selectedNames = new Set(value.map((t) => t.name));
  const available = (tagsQ.data?.items ?? []).filter((t) => !selectedNames.has(t.name));
  const full = value.length >= maxCount;

  function addTag(name: string, color: string | null) {
    if (full) return;
    if (selectedNames.has(name)) return;
    const c = color ?? pickTagColor(value.length);
    onChange([...value, { name, color: c }]);
  }

  function removeTag(name: string) {
    onChange(
      value.filter((t) => t.name !== name).map((t, i) => ({ ...t, color: pickTagColor(i) })),
    );
  }

  return (
    <div ref={ref} className="relative" data-testid="tag-picker-dropdown">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-b2 bg-bg px-2.5 py-2">
        {value.map((t) => (
          <span key={t.name} className="inline-flex items-center gap-1">
            <TagPill name={t.name} color={t.color} />
            <button
              type="button"
              onClick={() => removeTag(t.name)}
              aria-label={`Remove tag #${t.name}`}
              className="border-none bg-transparent font-mono text-mono-sm text-tm hover:text-red"
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={full}
          aria-expanded={open}
          aria-haspopup="listbox"
          data-testid="tag-picker-trigger"
          className="rounded-sm border border-dashed border-b2 px-2 py-0.5 font-mono text-mono-sm text-tm transition-colors hover:border-cyan hover:text-cyan disabled:opacity-40"
        >
          {full ? '// max reached' : '+ add tag'}
        </button>
      </div>

      {open && !full && (
        <div
          role="listbox"
          aria-label="Available tags"
          data-testid="tag-picker-list"
          className="absolute left-0 right-0 top-full z-popover mt-1 rounded-lg border border-b2 bg-elev p-2 shadow-drop-md animate-fade-up-xs"
        >
          {tagsQ.isLoading ? (
            <div className="px-2 py-3 font-mono text-mono-sm text-tm">// loading tags...</div>
          ) : available.length === 0 ? (
            <div className="px-2 py-3 font-mono text-mono-sm text-tm">
              // {tagsQ.data?.items.length === 0 ? 'no system tags yet' : 'all tags added'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5" data-testid="tag-picker-chips">
              {available.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  data-testid={`tag-picker-chip-${tag.name}`}
                  onClick={() => addTag(tag.name, tag.color)}
                  className="inline-flex items-center gap-1 rounded-sm border border-b2 bg-surf px-2 py-1 font-mono text-mono-sm transition-colors hover:border-cyan hover:bg-cyan/10"
                  style={tag.color ? { color: tag.color } : undefined}
                >
                  + {tag.name}
                  <span className="text-mono-sm text-tm">{tag.postCount}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 border-t border-b1 pt-2 text-center">
            <Link
              to="/tags"
              data-testid="tag-picker-manage-link"
              onClick={() => setOpen(false)}
              className="font-mono text-mono-sm text-blu hover:text-cyan"
            >
              // can&apos;t find your tag? manage tags →
            </Link>
          </div>
        </div>
      )}

      <div className="mt-1.5 font-mono text-mono-sm text-tm">
        {value.length}/{maxCount} tags selected
      </div>
    </div>
  );
}
