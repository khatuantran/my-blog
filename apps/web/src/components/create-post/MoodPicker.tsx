import { MOOD_CFG, MOOD_KEYS, type Mood } from '@/lib/mood-config';

type Props = {
  value: Mood;
  onChange: (mood: Mood) => void;
};

// 7 emoji button grid. Active mood: border + bg tint + glow theo MOOD_CFG.color.
export function MoodPicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Mood" className="flex flex-wrap gap-2">
      {MOOD_KEYS.map((m) => {
        const cfg = MOOD_CFG[m];
        const active = m === value;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m)}
            className="flex items-center gap-1.5 rounded-md border bg-elev px-3 py-1.5 font-mono text-mono-sm transition-all hover:border-b3"
            style={
              active
                ? {
                    borderColor: cfg.color,
                    background: `${cfg.color}15`,
                    color: cfg.color,
                    boxShadow: `0 0 12px ${cfg.color}40`,
                  }
                : { borderColor: '#2A3548', color: '#A0AEC0' }
            }
          >
            <span className="text-base">{cfg.emoji}</span>
            <span>{cfg.label}</span>
          </button>
        );
      })}
    </div>
  );
}
