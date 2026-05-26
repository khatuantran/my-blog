import { REACTION_LIST } from '@/lib/reaction-config';
import { ReactionIcon } from './ReactionIcon';
import type { ReactionType } from '@/types/api';

type Props = {
  open: boolean;
  selected: ReactionType | null;
  onPick: (type: ReactionType) => void;
};

// ReactionPicker (T-358 polish) — panel container per design-file/MyBlog Feed.html
// L717-758. Hover state per spec L750: bg `${color}22`, border `${color}A0`, boxShadow
// glow + inset translateY -2px. Active state: bg `${color}18`, border `${color}80`.
// Per-color hex tinting forces inline-style via mouseenter/leave handlers — Tailwind
// arbitrary classes can't interpolate 6 dynamic colors at runtime.
export function ReactionPicker({ open, selected, onPick }: Props) {
  if (!open) return null;
  return (
    <div
      role="menu"
      aria-label="Pick a reaction"
      data-testid="reaction-picker"
      className="absolute bottom-full left-0 z-popover mb-2 flex items-center gap-0.5 rounded-lg border border-cyan/35 bg-elev px-2 py-1.5 shadow-glow-cyan-md animate-fade-up-xs"
    >
      {REACTION_LIST.map((r) => {
        const isSelected = selected === r.type;
        const activeBg = `${r.color}18`;
        const activeBorder = `${r.color}80`;
        return (
          <button
            key={r.type}
            type="button"
            role="menuitem"
            onClick={() => onPick(r.type)}
            aria-label={r.label}
            aria-pressed={isSelected}
            title={r.label}
            data-testid={`reaction-picker-${r.type}`}
            // Inline style needed for per-color (6 variants) bg/border/glow combo —
            // Tailwind can't tree-shake or interpolate dynamic hex across all reactions.
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              background: isSelected ? activeBg : 'transparent',
              border: `1px solid ${isSelected ? activeBorder : 'transparent'}`,
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = `${r.color}22`;
              e.currentTarget.style.borderColor = `${r.color}A0`;
              e.currentTarget.style.boxShadow = `0 0 10px ${r.color}50, inset 0 0 8px ${r.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = isSelected ? activeBg : 'transparent';
              e.currentTarget.style.borderColor = isSelected ? activeBorder : 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
            className="flex items-center justify-center cursor-pointer"
          >
            <ReactionIcon r={r} size={22} glow={isSelected} />
          </button>
        );
      })}
    </div>
  );
}
