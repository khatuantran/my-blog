import { Link } from 'react-router';
import { Sparkline } from '@/components/shared/Sparkline';
import type { TagWithStats } from '@/types/api';

type Props = {
  tag: TagWithStats;
  maxCount: number;
  variant?: 'grid' | 'list';
  isAdmin?: boolean;
  onEdit?: (tag: TagWithStats) => void;
  onDelete?: (tag: TagWithStats) => void;
};

export function TagCard({ tag, maxCount, variant = 'grid', isAdmin, onEdit, onDelete }: Props) {
  const color = tag.color ?? '#00FFE5';
  const pct = maxCount > 0 ? Math.min(100, (tag.postCount / maxCount) * 100) : 0;
  const href = `/?tag=${encodeURIComponent(tag.name.replace(/^#/, ''))}`;

  if (variant === 'list') {
    return (
      <div
        data-testid={`tag-card-${tag.name}`}
        className="flex items-center justify-between gap-3 rounded-md border border-b2 bg-surf px-4 py-2 transition-colors hover:border-cyan/40"
      >
        <Link to={href} className="flex flex-1 items-center gap-3 min-w-0 no-underline">
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <span className="font-mono text-sm" style={{ color }}>
            {tag.name}
          </span>
          <span className="ml-2 font-mono text-mono-xs text-tm">{tag.postCount} posts</span>
          {tag.description && (
            <span className="truncate font-mono text-mono-xs text-td">{tag.description}</span>
          )}
        </Link>
        <Sparkline data={tag.sparkline7d} color={color} width={60} height={16} />
        {isAdmin && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onEdit?.(tag)}
              aria-label={`Edit tag ${tag.name}`}
              className="rounded-sm border border-b2 bg-elev px-2 py-1 font-mono text-mono-xs text-tm hover:border-cyan/50 hover:text-cyan"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(tag)}
              aria-label={`Delete tag ${tag.name}`}
              className="rounded-sm border border-b2 bg-elev px-2 py-1 font-mono text-mono-xs text-tm hover:border-red/50 hover:text-red"
            >
              🗑
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid={`tag-card-${tag.name}`}
      className="group relative rounded-md border border-b2 bg-surf p-4 transition-all hover:border-cyan/40 hover:shadow-glow-cyan-sm"
    >
      <Link to={href} className="block no-underline">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="font-mono text-base" style={{ color }}>
              {tag.name}
            </span>
          </div>
          <span className="rounded-sm border border-b2 bg-elev px-2 py-0.5 font-mono text-mono-xs text-tm">
            {tag.postCount}
          </span>
        </div>
        {tag.description && (
          <div className="mb-2 truncate font-mono text-mono-xs text-td" title={tag.description}>
            {tag.description}
          </div>
        )}
        <div className="mb-2">
          <Sparkline data={tag.sparkline7d} color={color} width={60} height={20} />
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-sm bg-b1"
          aria-valuenow={pct}
          aria-label={`${Math.round(pct)}% of max usage`}
          role="progressbar"
        >
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      </Link>
      {isAdmin && (
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit?.(tag)}
            aria-label={`Edit tag ${tag.name}`}
            className="rounded-sm border border-b2 bg-elev px-2 py-1 font-mono text-mono-xs text-tm hover:border-cyan/50 hover:text-cyan"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(tag)}
            aria-label={`Delete tag ${tag.name}`}
            className="rounded-sm border border-b2 bg-elev px-2 py-1 font-mono text-mono-xs text-tm hover:border-red/50 hover:text-red"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}
