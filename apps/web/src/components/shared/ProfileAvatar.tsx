type Props = {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  online?: boolean;
};

export function ProfileAvatar({ username, avatarUrl, size = 80, online = false }: Props) {
  const initial = (username[0] ?? '?').toUpperCase();
  const r = size / 2 - 2;

  return (
    <div
      data-testid="profile-avatar"
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        className="pointer-events-none absolute left-0 top-0 z-[1] animate-border-rotate"
        style={{ transformOrigin: '50% 50%' }}
      >
        <defs>
          <linearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00FFE5" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#BB9AF7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF6E96" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#avatarGrad)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      </svg>

      <div
        className="absolute z-[2] flex items-center justify-center rounded-full font-brand font-bold"
        style={{
          top: 4,
          left: 4,
          right: 4,
          bottom: 4,
          background: 'linear-gradient(135deg,#00FFE518,#BB9AF718)',
          border: '2px solid #00FFE5',
          boxShadow: '0 0 20px rgba(0,255,229,.2), inset 0 0 20px rgba(0,255,229,.05)',
          color: '#00FFE5',
          fontSize: size / 3,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Avatar of ${username}`}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span style={{ textShadow: '0 0 20px rgba(0,255,229,.8)' }}>{initial}</span>
        )}
      </div>

      {online && (
        <div
          data-testid="profile-avatar-online-dot"
          aria-label="Online"
          className="absolute z-[3] animate-pulse rounded-full"
          style={{
            bottom: 4,
            right: 4,
            width: 12,
            height: 12,
            background: '#9ECE6A',
            border: '2px solid #0A0E1A',
            boxShadow: '0 0 8px #9ECE6A',
          }}
        />
      )}
    </div>
  );
}
