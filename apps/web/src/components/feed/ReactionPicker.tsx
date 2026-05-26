import { REACTION_LIST } from '@/lib/reaction-config';
import { ReactionIcon } from './ReactionIcon';
import type { ReactionType } from '@/types/api';

type Props = {
  open: boolean;
  selected: ReactionType | null;
  onPick: (type: ReactionType) => void;
};

// Popover spec: DESIGN_SYSTEM.md > ReactionPicker. Hover above trigger.
export function ReactionPicker({ open, selected, onPick }: Props) {
  if (!open) return null;
  return (
    <div
      role="menu"
      aria-label="Pick a reaction"
      className="absolute bottom-full left-0 z-10 mb-2 flex items-center gap-1 rounded-full border border-b2 bg-surf px-2 py-1.5 shadow-glow-cyan-lg"
      data-testid="reaction-picker"
    >
      {REACTION_LIST.map((r) => {
        const isSelected = selected === r.type;
        return (
          <button
            key={r.type}
            type="button"
            role="menuitem"
            onClick={() => onPick(r.type)}
            aria-label={r.label}
            title={r.label}
            data-testid={`reaction-picker-${r.type}`}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent text-lg cursor-pointer transition-transform hover:scale-125 ${
              isSelected ? 'scale-110 bg-elev' : ''
            }`}
          >
            <ReactionIcon r={r} size={20} glow={isSelected} />
          </button>
        );
      })}
    </div>
  );
}
