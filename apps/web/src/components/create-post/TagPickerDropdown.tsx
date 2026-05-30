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
  // BE sort values: name | posts | recent (NOT 'top' — gây 400 → picker rỗng). 'posts' = most used.
  const tagsQ = useTags({ sort: 'posts', limit: 30 });

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
          className="mt-1 max-h-[40vh] overflow-y-auto rounded-lg border border-cyan/30 bg-elev p-3 shadow-drop-md animate-fade-up-xs"
        >
          {/* Header (design L737): // system.tags · N available + × close */}
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-mono text-mono-sm text-tm">
              // system.tags · <span className="text-cyan">{available.length}</span> available
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close tag picker"
              data-testid="tag-picker-close"
              className="font-mono text-[17px] leading-none text-tm hover:text-tp"
            >
              ×
            </button>
          </div>

          {tagsQ.isLoading ? (
            <div className="px-2 py-3 text-center font-mono text-mono-sm text-tm">
              // loading tags...
            </div>
          ) : tagsQ.isError ? (
            <div className="px-2 py-3 text-center font-mono text-mono-sm text-red">
              // failed to load tags
            </div>
          ) : available.length === 0 ? (
            <div className="px-2 py-4 text-center font-mono text-mono-sm text-td">
              ◎{' '}
              {(tagsQ.data?.items.length ?? 0) === 0
                ? 'no system tags yet'
                : 'all available tags selected'}
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
                  className="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-mono-sm transition-all hover:brightness-125"
                  style={
                    tag.color
                      ? {
                          color: tag.color,
                          background: `${tag.color}12`,
                          borderColor: `${tag.color}50`,
                        }
                      : undefined
                  }
                >
                  + #{tag.name}
                  <span className="text-[9px] text-td">{tag.postCount}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2.5 border-t border-b2 pt-2 font-mono text-[10px] text-td">
            // can&apos;t find your tag?{' '}
            <Link
              to="/tags"
              data-testid="tag-picker-manage-link"
              onClick={() => setOpen(false)}
              className="text-cyan no-underline hover:text-cyan"
            >
              manage tags →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
