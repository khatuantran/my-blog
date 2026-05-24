type Props = {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  online?: boolean;
};

export function ProfileAvatar({ username, avatarUrl, size = 80, online = false }: Props) {
  const initial = (username[0] ?? '?').toUpperCase();
  const innerSize = size - 6;

  return (
    <div
      data-testid="profile-avatar"
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="absolute inset-0 animate-border-rotate"
        style={{ transformOrigin: '50% 50%' }}
      >
        <defs>
          <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFE5" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#BB9AF7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF79C6" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="url(#avatarGrad)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      </svg>

      <div
        className="flex items-center justify-center rounded-full font-brand font-bold text-cyan"
        style={{
          width: innerSize,
          height: innerSize,
          background: 'linear-gradient(135deg,#00FFE520,#BB9AF720)',
          border: '2px solid #00FFE5',
          boxShadow: '0 0 20px rgba(0,255,229,.2), inset 0 0 20px rgba(0,255,229,.05)',
          fontSize: innerSize * 0.36,
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
          className="absolute animate-pulse rounded-full"
          style={{
            width: 12,
            height: 12,
            background: '#50FA7B',
            border: '2px solid var(--bg)',
            boxShadow: '0 0 8px #50FA7B',
            bottom: 0,
            right: 0,
          }}
        />
      )}
    </div>
  );
}
