import type { ReactionType } from '@/types/api';
import { REACTION_CONFIG, type ReactionConfig } from '@/lib/reaction-config';

type Props = {
  /** Reaction config or just type. */
  r: ReactionConfig | ReactionType;
  size?: number;
  /** Add a `drop-shadow` filter glow tinted with the reaction color. */
  glow?: boolean;
};

// ReactionIcon (T-357) — line-art SVG icon per design-file v2 spec
// (design-file/MyBlog Feed.html L718-723). Replaces emoji rendering in
// ReactionButton + ReactionPicker for crisp visuals at any size + per-color glow.
export function ReactionIcon({ r, size = 18, glow = false }: Props) {
  const cfg: ReactionConfig = typeof r === 'string' ? REACTION_CONFIG[r] : r;
  const color = cfg.color;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      data-testid={`reaction-icon-${cfg.type}`}
      style={{
        display: 'block',
        flexShrink: 0,
        filter: glow ? `drop-shadow(0 0 4px ${color})` : 'none',
      }}
    >
      {renderPath(cfg.type, color)}
    </svg>
  );
}

function renderPath(type: ReactionType, c: string): JSX.Element {
  switch (type) {
    case 'LIKE':
      return (
        <>
          <rect x="3" y="11" width="4" height="9" stroke={c} strokeWidth="1.6" fill="none" />
          <path
            d="M7 11l4-7c2 0 2.5 1.5 2 3l-1 2h5.5c1.5 0 2.5 1.5 2 3l-1.5 5.5c-.3 1.2-1.3 1.5-2.3 1.5H7"
            fill="none"
            stroke={c}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <line x1="4" y1="15" x2="6" y2="15" stroke={c} strokeWidth="1.2" />
        </>
      );
    case 'LOVE':
      return (
        <path
          d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"
          fill="none"
          stroke={c}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      );
    case 'HAHA':
      return (
        <>
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="3"
            fill="none"
            stroke={c}
            strokeWidth="1.6"
          />
          <path d="M7 13h10" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M9 13c0 2 1 3 3 3s3-1 3-3"
            fill="none"
            stroke={c}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="M7 9l2 2M17 9l-2 2" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
          <text x="6" y="21.5" fontFamily="'JetBrains Mono',monospace" fontSize="4.5" fill={c}>
            LOL
          </text>
        </>
      );
    case 'WOW':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.8" />
          <circle cx="9" cy="10" r="1.4" fill={c} />
          <circle cx="15" cy="10" r="1.4" fill={c} />
          <ellipse cx="12" cy="16" rx="2" ry="2.5" fill="none" stroke={c} strokeWidth="1.6" />
        </>
      );
    case 'SAD':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.8" />
          <path
            d="M8 16c1-2 2.5-3 4-3s3 1 4 3"
            fill="none"
            stroke={c}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="9" cy="10" r="1" fill={c} />
          <circle cx="15" cy="10" r="1" fill={c} />
          <path d="M9 13l-1 3" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
        </>
      );
    case 'ANGRY':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.8" />
          <path d="M7 8l3 2M14 10l3-2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="9" cy="11" r="1" fill={c} />
          <circle cx="15" cy="11" r="1" fill={c} />
          <path
            d="M8 16c1-2 2.5-2.5 4-2.5s3 .5 4 2.5"
            fill="none"
            stroke={c}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      );
  }
}
