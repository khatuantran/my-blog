import { MOOD_CFG, type Mood } from '@/lib/mood-config';

type Props = {
  mood: Mood;
  count: number;
  total: number;
};

// Single mood row: emoji + label + count/% + horizontal bar gradient.
// Match design-file/MyBlog Admin.html L85-101.
export function MoodBar({ mood, count, total }: Props) {
  const cfg = MOOD_CFG[mood];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{cfg.emoji}</span>
          <span className="font-mono text-mono-sm" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <span className="font-mono text-mono-sm text-tm">
          {count} <span className="text-td">·</span> {pct}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-elev">
        <div
          aria-label={`${cfg.label} ${pct} percent`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg,${cfg.color}80,${cfg.color})`,
            borderRadius: 2,
            boxShadow: `0 0 6px ${cfg.color}60`,
            transition: 'width .4s ease',
          }}
        />
      </div>
    </div>
  );
}
