import { useState } from 'react';

type Props = {
  name: string;
  color?: string | null;
  onClick?: () => void;
};

// Tag chip với hover shift bg + glow. Port từ design-file/myblog-components.jsx:116-127.
// Name có thể không có `#` prefix; component tự thêm.
const DEFAULT_COLOR = '#00FFE5';

export function TagPill({ name, color, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const c = color || DEFAULT_COLOR;
  const display = name.startsWith('#') ? name : `#${name}`;
  const interactive = !!onClick;

  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`inline-block font-mono text-mono-sm rounded-sm px-2 py-0.5 whitespace-nowrap transition-all duration-150 ${interactive ? 'cursor-pointer' : ''}`}
      style={{
        color: hover ? '#E6EDF3' : c,
        background: `${c}${hover ? '28' : '15'}`,
        border: `1px solid ${c}${hover ? '70' : '40'}`,
        boxShadow: hover ? `0 0 8px ${c}50` : undefined,
      }}
    >
      {display}
    </span>
  );
}
