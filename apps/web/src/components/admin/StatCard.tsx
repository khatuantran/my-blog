import { Sparkline } from '@/components/shared/Sparkline';

type Props = {
  label: string;
  value: string | number;
  delta?: number;
  color: string;
  sparkline?: number[];
};

function formatDelta(n: number): string {
  if (n === 0) return '±0';
  return n > 0 ? `+${n}` : `${n}`;
}

// Stat card cho Admin Dashboard. Match design-file/MyBlog Admin.html L143-149.
export function StatCard({ label, value, delta, color, sparkline }: Props) {
  return (
    <div
      className="rounded-lg bg-surf p-4"
      style={{ borderLeft: `3px solid ${color}` }}
      data-testid={`stat-card-${label.toLowerCase()}`}
    >
      <div className="mb-2.5 flex items-start justify-between">
        <span className="font-mono text-mono-xs text-tm tracking-[0.08em]">{label}</span>
        {typeof delta === 'number' && (
          <span className="font-mono text-mono-xs" style={{ color }}>
            {formatDelta(delta)} today
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-brand text-display text-tp">{value}</span>
        {sparkline && sparkline.length > 0 && <Sparkline data={sparkline} color={color} />}
      </div>
    </div>
  );
}
