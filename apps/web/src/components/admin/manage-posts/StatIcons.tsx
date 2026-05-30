// Cyberpunk line-art SVG icons matching Feed page ReactionIcon style
// (apps/web/src/components/feed/ReactionIcon.tsx — strokeWidth 1.6-1.8, no fill,
// line-cap round). Replace emoji ♡/💬/👁/✎/✕ trong Manage Posts để đồng bộ visual.

type Props = {
  size?: number;
  color?: string;
};

export function HeartIcon({ size = 14, color = 'currentColor' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'inline-block', verticalAlign: '-2px', flexShrink: 0 }}
    >
      <path
        d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommentIcon({ size = 14, color = 'currentColor' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'inline-block', verticalAlign: '-2px', flexShrink: 0 }}
    >
      <path
        d="M4 5h16v11H10l-4 4v-4H4z"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10.5" r="1" fill={color} />
      <circle cx="12" cy="10.5" r="1" fill={color} />
      <circle cx="15" cy="10.5" r="1" fill={color} />
    </svg>
  );
}

export function EyeIcon({ size = 14, color = 'currentColor' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'inline-block', verticalAlign: '-2px', flexShrink: 0 }}
    >
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}

export function PencilIcon({ size = 14, color = 'currentColor' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'inline-block', verticalAlign: '-2px', flexShrink: 0 }}
    >
      <path
        d="M14 4l6 6-10 10H4v-6z"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13 5l6 6" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

export function TrashIcon({ size = 14, color = 'currentColor' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'inline-block', verticalAlign: '-2px', flexShrink: 0 }}
    >
      <path d="M4 7h16" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 7V4h6v3" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path
        d="M6 7l1 13h10l1-13"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
