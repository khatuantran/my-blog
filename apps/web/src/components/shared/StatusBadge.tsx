import { POST_STATUS_CFG, type PostStatus } from '@/lib/status-config';

type Props = {
  variant: 'post';
  status: PostStatus;
};

// Inline-flex pill: '[ LABEL ]' với background/border tint theo status color.
// ARCHIVED giảm opacity để visual "less active" (DESIGN_SYSTEM:433).
// Port từ design-file/MyBlog Manage Posts.html:379.
export function StatusBadge({ variant, status }: Props) {
  if (variant !== 'post') return null;
  const cfg = POST_STATUS_CFG[status];
  if (!cfg) return null;
  const archived = status === 'ARCHIVED';
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-mono-sm whitespace-nowrap"
      style={{
        color: cfg.color,
        background: `${cfg.color}1F`,
        border: `1px solid ${cfg.color}66`,
        opacity: archived ? 0.8 : 1,
      }}
    >
      [ {cfg.label} ]
    </span>
  );
}
