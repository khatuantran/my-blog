import { MOOD_CFG, type Mood } from '@/lib/mood-config';

type Props = {
  mood: Mood;
};

// Inline-flex pill: emoji + label với background/border tint theo mood color + glow shadow.
// Port từ design-file/myblog-components.jsx:129-139.
export function MoodBadge({ mood }: Props) {
  const cfg = MOOD_CFG[mood];
  if (!cfg) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-mono whitespace-nowrap"
      style={{
        color: cfg.color,
        background: `${cfg.color}18`,
        border: `1px solid ${cfg.color}55`,
        boxShadow: `0 0 10px ${cfg.color}30`,
      }}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}
