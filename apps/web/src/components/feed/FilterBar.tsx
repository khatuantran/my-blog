import { useEffect, useRef, useState } from 'react';
import { MOOD_CFG, type Mood } from '@/lib/mood-config';
import type { PostSort } from '@/types/api';

export type { PostSort };

const SORT_OPTIONS: { value: PostSort; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'likes', label: 'Most liked' },
];

type Props = {
  activeMood: Mood | null;
  total?: number;
  sort?: PostSort;
  onMoodFilter: (mood: Mood | null) => void;
  onSortChange?: (sort: PostSort) => void;
};

const FILTER_MOODS: Mood[] = ['HAPPY', 'EXCITED', 'THOUGHTFUL', 'CALM', 'SAD'];

export function FilterBar({
  activeMood,
  total,
  sort = 'latest',
  onMoodFilter,
  onSortChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Latest';
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2.5 font-mono text-mono-sm text-tm">
        <span>// feed.posts{typeof total === 'number' ? ` · ${total} total` : ''}</span>
        {activeMood && (
          <span style={{ color: MOOD_CFG[activeMood].color }}>
            · filtered: {MOOD_CFG[activeMood].emoji} {MOOD_CFG[activeMood].label}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onMoodFilter(null)}
          className={`rounded-sm border bg-elev px-3 py-1 font-mono text-mono-sm text-ts transition-all hover:border-b3 hover:text-tp ${
            !activeMood
              ? 'border-cyan/50 !bg-cyan/[0.08] !text-cyan shadow-glow-cyan-sm'
              : 'border-b2'
          }`}
        >
          All
        </button>
        {FILTER_MOODS.map((m) => {
          const cfg = MOOD_CFG[m];
          const isActive = activeMood === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onMoodFilter(isActive ? null : m)}
              className="rounded-sm border bg-elev px-3 py-1 font-mono text-mono-sm transition-all hover:border-b3"
              style={
                isActive
                  ? {
                      borderColor: `${cfg.color}70`,
                      color: cfg.color,
                      background: `${cfg.color}10`,
                      boxShadow: `0 0 8px ${cfg.color}20`,
                    }
                  : { borderColor: '#2A3548', color: '#A0AEC0' }
              }
            >
              {cfg.emoji} {cfg.label}
            </button>
          );
        })}
        <div ref={ref} className="relative ml-auto">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Sort order"
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={!onSortChange}
            className="rounded-sm border border-b2 bg-elev px-3 py-1 font-mono text-mono-sm text-ts transition-colors hover:border-b3 hover:text-tp disabled:opacity-60"
          >
            {sortLabel} ▾
          </button>
          {open && (
            <ul
              role="listbox"
              aria-label="Sort options"
              className="absolute right-0 z-10 mt-1 min-w-[140px] rounded-sm border border-b2 bg-elev py-1 shadow-lg"
            >
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={sort === opt.value}
                    onClick={() => {
                      onSortChange?.(opt.value);
                      setOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left font-mono text-mono-sm transition-colors hover:bg-cyan/10 ${
                      sort === opt.value ? 'text-cyan' : 'text-ts'
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
