type Cell = { date: string; count: number };

type Props = {
  cells: Cell[]; // 28 entries (4 weeks × 7 days), oldest → newest
  // T-413 FR-11.7 design L584-598 — Activity tab variant render day labels Su/Mo/Tu top row +
  // larger cell height 18px + glow shadow khi count > 1. Sidebar variant compact (no labels) giữ default.
  variant?: 'compact' | 'large';
};

const COLORS = ['#1A1F2E', '#2A3548', '#00FFE535', '#00FFE590'];
// design L243 — single-char M-Sun (Monday-Sunday) for both compact + large variants
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
        {/* Day labels M/T/W/T/F/S/S top row — design L584-586. Keys = index vì labels lặp (T, S). */}
        <div className="grid gap-1 text-center" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="font-mono text-[10px] text-td">
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

  // Compact (sidebar) — design L702-711: 7-col full-width cells + day labels M/T/W/T/F/S/S 8px,
  // gap 3px, NO less/more legend (legend chỉ ở large variant).
  return (
    <div className="flex w-full flex-col gap-0.5" data-testid="heatmap-compact">
      <div className="grid gap-[3px] text-center" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="font-mono text-[8px] text-td">
            {d}
          </div>
        ))}
      </div>
      <div
        role="grid"
        aria-label="28-day activity heatmap"
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
      >
        {cells.map((c) => (
          <div
            key={c.date}
            role="gridcell"
            aria-label={`${c.date} · ${c.count} post${c.count === 1 ? '' : 's'}`}
            title={`${c.date} · ${c.count} post${c.count === 1 ? '' : 's'}`}
            data-count={c.count}
            className="h-3 rounded-sm"
            style={{ background: COLORS[intensity(c.count, max)] }}
          />
        ))}
      </div>
    </div>
  );
}
