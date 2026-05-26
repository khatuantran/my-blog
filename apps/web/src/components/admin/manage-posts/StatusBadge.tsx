import type { PostStatus } from '@/types/api';

const STATUS_CFG: Record<PostStatus, { color: string; label: string }> = {
  PUBLISHED: { color: '#9ECE6A', label: 'PUBLISHED' },
  DRAFT: { color: '#E0AF68', label: 'DRAFT' },
  ARCHIVED: { color: '#566176', label: 'ARCHIVED' },
};

export function StatusBadge({ status }: { status: PostStatus }) {
  const { color, label } = STATUS_CFG[status];
  return (
    <span
      data-testid={`status-badge-${status}`}
      className="rounded-sm border px-1.5 py-0.5 font-mono text-[10px] leading-none"
      style={{
        color,
        borderColor: `${color}60`,
        background: `${color}1e`,
        opacity: status === 'ARCHIVED' ? 0.8 : 1,
      }}
    >
      {label}
    </span>
  );
}
