type Props = {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
};

// Lightweight inline SVG sparkline với gradient stroke + endpoint glow circle.
// Port từ design-file/myblog-components.jsx:85-103.
export function Sparkline({ data, color = '#00FFE5', width = 80, height = 22 }: Props) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const p = 2; // padding y
  const n = data.length;
  const stepX = n > 1 ? width / (n - 1) : width;
  const yFor = (v: number) => height - p - ((v - min) / range) * (height - p * 2);

  const points = data.map((v, i) => `${i * stepX},${yFor(v)}`).join(' ');
  const last = { x: (n - 1) * stepX, y: yFor(data[n - 1]) };
  const gid = `spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible' }}
      role="img"
      aria-label="Sparkline"
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={last.x}
        cy={last.y}
        r="2.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}
