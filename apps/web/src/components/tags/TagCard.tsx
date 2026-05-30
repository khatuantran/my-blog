import { Link } from 'react-router';
import { Sparkline } from '@/components/shared/Sparkline';
import { PencilIcon, TrashIcon } from '@/components/shared/cyber-icons';
import type { TagWithStats } from '@/types/api';

type Props = {
  tag: TagWithStats;
  maxCount: number;
  isAdmin?: boolean;
  index?: number;
  onEdit?: (tag: TagWithStats) => void;
  onDelete?: (tag: TagWithStats) => void;
};

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// T-420 design L224-269 — TagCard grid variant: name textShadow glow + since date
// subline + desc min-h-36 + Space Grotesk 22px count + sparkline right + always-visible
// actions với SVG cyber icons. List variant removed (moved inline TagsPage 5-col table).
export function TagCard({ tag, maxCount, isAdmin, index, onEdit, onDelete }: Props) {
  const color = tag.color ?? '#00FFE5';
  const pct = maxCount > 0 ? Math.min(100, (tag.postCount / maxCount) * 100) : 0;
  const href = `/?tag=${encodeURIComponent(tag.name.replace(/^#/, ''))}`;

  return (
    <div
      data-testid={`tag-card-${tag.name}`}
      className="animate-fade-up-md group relative overflow-hidden rounded-lg border border-b2 bg-elev p-4 transition-all"
      style={{ animationDelay: `${(index ?? 0) * 30}ms`, animationFillMode: 'both' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}60`;
        e.currentTarget.style.boxShadow = `0 0 20px ${color}10`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Top accent bar — visible always per design L231 (no hover) */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      />

      {/* Header: name + since date | actions always-visible right */}
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <Link to={href} className="block min-w-0 no-underline">
          <div
            className="font-mono text-[16px] font-semibold"
            style={{ color, textShadow: `0 0 12px ${color}50` }}
          >
            {tag.name}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-tm">
            since {formatMonth(tag.createdAt)}
          </div>
        </Link>
        {isAdmin && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => onEdit?.(tag)}
              aria-label={`Edit tag ${tag.name}`}
              className="inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[11px] text-blu hover:bg-blu/10"
              style={{ borderColor: 'rgba(125,207,255,0.25)' }}
            >
              <PencilIcon size={12} /> edit
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(tag)}
              aria-label={`Delete tag ${tag.name}`}
              className="inline-flex items-center justify-center rounded border px-2 py-1 font-mono text-[11px] text-red hover:bg-red/10"
              style={{ borderColor: 'rgba(247,118,142,0.25)' }}
            >
              <TrashIcon size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Description — min-h-[36px] giữ card chiều cao consistent */}
      <p className="mb-3 min-h-[36px] text-[13px] leading-snug text-ts">
        {tag.description || <span className="italic text-td">// no description</span>}
      </p>

      {/* Stats row — Space Grotesk 22 count + "posts" label + sparkline right (design L257-263) */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-brand text-[22px] font-bold leading-none"
            style={{ color }}
            data-testid="tag-count"
          >
            {tag.postCount}
          </span>
          <span className="font-mono text-[11px] text-td">posts</span>
        </div>
        <Sparkline data={tag.sparkline7d} color={color} width={60} height={20} />
      </div>

      {/* Progress bar 2px height + glow shadow (design L266-268) */}
      <div
        className="mt-2.5 h-[2px] overflow-hidden rounded-[1px] bg-b1"
        aria-valuenow={pct}
        aria-label={`${Math.round(pct)}% of max usage`}
        role="progressbar"
      >
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}80` }}
        />
      </div>
    </div>
  );
}
