type Props = {
  username: string;
  avatarUrl?: string | null;
  size?: number;
};

export function ProfileAvatar({ username, avatarUrl, size = 80 }: Props) {
  const initial = (username[0] ?? '?').toUpperCase();
  const ringSize = size;
  const innerSize = size - 6;

  return (
    <div
      data-testid="profile-avatar"
      className="relative inline-flex items-center justify-center"
      style={{ width: ringSize, height: ringSize }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="absolute inset-0"
        style={{ animation: 'spin 4s linear infinite' }}
      >
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="#00FFE5"
          strokeWidth="2"
          strokeDasharray="20 12"
          opacity="0.7"
        />
      </svg>
      <div
        className="flex items-center justify-center rounded-full font-brand font-bold text-cyan"
        style={{
          width: innerSize,
          height: innerSize,
          background: 'linear-gradient(135deg,#00FFE520,#BB9AF720)',
          border: '1px solid #00FFE540',
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
          initial
        )}
      </div>
    </div>
  );
}
