import { MOOD_CFG, type Mood } from '@/lib/mood-config';

type Props = {
  activeMood: Mood | null;
  total?: number;
  onMoodFilter: (mood: Mood | null) => void;
};

const FILTER_MOODS: Mood[] = ['HAPPY', 'EXCITED', 'THOUGHTFUL', 'CALM', 'SAD'];

// Mood pills + sort placeholder. Match design-file/MyBlog Feed.html:272-300.
export function FilterBar({ activeMood, total, onMoodFilter }: Props) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2.5 font-mono text-mono-xs text-tm">
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
        <button
          type="button"
          disabled
          aria-label="Sort order (placeholder)"
          className="ml-auto rounded-sm border border-b2 bg-elev px-3 py-1 font-mono text-mono-sm text-ts opacity-60"
        >
          Latest ▾
        </button>
      </div>
    </div>
  );
}
