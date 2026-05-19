type Cell = { date: string; count: number };

type Props = {
  cells: Cell[]; // 28 entries (4 weeks × 7 days), oldest → newest
};

const COLORS = ['#1A1F2E', '#2A3548', '#00FFE535', '#00FFE590'];

function intensity(count: number, max: number): number {
  if (count === 0) return 0;
  if (max <= 1) return 1;
  const ratio = count / max;
  if (ratio < 0.34) return 1;
  if (ratio < 0.67) return 2;
  return 3;
}

export function HeatmapGrid({ cells }: Props) {
  const max = cells.reduce((m, c) => Math.max(m, c.count), 0);

  return (
    <div
      role="grid"
      aria-label="28-day activity heatmap"
      className="inline-grid gap-0.5"
      style={{ gridTemplateColumns: 'repeat(7, 12px)' }}
    >
      {cells.map((c) => (
        <div
          key={c.date}
          role="gridcell"
          aria-label={`${c.date} · ${c.count} post${c.count === 1 ? '' : 's'}`}
          title={`${c.date} · ${c.count} post${c.count === 1 ? '' : 's'}`}
          data-count={c.count}
          className="h-3 w-3 rounded-sm"
          style={{ background: COLORS[intensity(c.count, max)] }}
        />
      ))}
    </div>
  );
}
