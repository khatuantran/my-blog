type Cell = { date: string; count: number };

type Props = {
  cells: Cell[]; // 28 entries (4 weeks × 7 days), oldest → newest
  // T-413 FR-11.7 design L584-598 — Activity tab variant render day labels Su/Mo/Tu top row +
  // larger cell height 18px + glow shadow khi count > 1. Sidebar variant compact (no labels) giữ default.
  variant?: 'compact' | 'large';
};

const COLORS = ['#1A1F2E', '#2A3548', '#00FFE535', '#00FFE590'];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function intensity(count: number, max: number): number {
  if (count === 0) return 0;
  if (max <= 1) return 1;
  const ratio = count / max;
  if (ratio < 0.34) return 1;
  if (ratio < 0.67) return 2;
  return 3;
}

export function HeatmapGrid({ cells, variant = 'compact' }: Props) {
  const max = cells.reduce((m, c) => Math.max(m, c.count), 0);

  if (variant === 'large') {
    return (
      <div className="flex flex-col gap-2.5" data-testid="heatmap-large">
        {/* Day labels Su/Mo/Tu/We/Th/Fr/Sa top row — design L584-586 */}
        <div className="grid gap-1 text-center" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_LABELS.map((d) => (
            <div key={d} className="font-mono text-[10px] text-td">
              {d}
            </div>
          ))}
        </div>
        {/* Cells 18px height + glow when count > 1 — design L587-593 */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((c) => {
            const lvl = intensity(c.count, max);
            const bg = COLORS[lvl];
            return (
              <div
                key={c.date}
                role="gridcell"
                aria-label={`${c.date} · ${c.count} post${c.count === 1 ? '' : 's'}`}
                title={`${c.date} · ${c.count} post${c.count === 1 ? '' : 's'}`}
                data-count={c.count}
                className="h-[18px] rounded-[3px]"
                style={{
                  background: bg,
                  boxShadow: c.count > 1 ? `0 0 5px ${bg}` : undefined,
                }}
              />
            );
          })}
        </div>
        {/* Less/more legend right-aligned — design L594-598 */}
        <div
          data-testid="heatmap-legend"
          className="flex items-center justify-end gap-1.5 font-mono text-[10px] text-td"
        >
          <span>less</span>
          {COLORS.map((color) => (
            <span
              key={color}
              aria-hidden
              className="rounded-sm"
              style={{ width: 11, height: 11, background: color }}
            />
          ))}
          <span>more</span>
        </div>
      </div>
    );
  }

  // Compact (sidebar)
  return (
    <div className="inline-flex flex-col gap-1.5">
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
      {/* Legend — less / intensity scale / more */}
      <div
        data-testid="heatmap-legend"
        className="flex items-center gap-1 font-mono text-[10px] text-td"
      >
        <span>less</span>
        {COLORS.map((c) => (
          <span key={c} aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}
