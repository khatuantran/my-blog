type Size = 'xs' | 'sm' | 'md' | 'lg';

type Props = {
  username?: string | null;
  avatarUrl?: string | null;
  size?: Size;
  online?: boolean;
};

const SIZE_PX: Record<Size, number> = { xs: 24, sm: 28, md: 36, lg: 52 };
const FONT_PX: Record<Size, number> = { xs: 10, sm: 11, md: 14, lg: 18 };

// Circle avatar: gradient cyan→purple bg + cyan border + initial uppercase.
// Online dot bottom-right optional. Port từ design Avatar pattern.
export function Avatar({ username, avatarUrl, size = 'md', online = false }: Props) {
  const px = SIZE_PX[size];
  const fontPx = FONT_PX[size];
  const initial = (username?.[0] ?? '?').toUpperCase();

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-cyan font-brand font-bold text-cyan overflow-hidden"
      style={{
        width: px,
        height: px,
        fontSize: fontPx,
        background: avatarUrl ? undefined : 'linear-gradient(135deg,#00FFE520,#BB9AF720)',
        boxShadow: '0 0 10px rgba(0,255,229,.2)',
      }}
      aria-label={username ? `${username} avatar` : 'Avatar'}
    >
      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}
      {online && (
        <span
          aria-hidden="true"
          className="absolute -bottom-px -right-px h-2 w-2 rounded-full bg-grn"
          style={{ border: '1.5px solid #11151F', boxShadow: '0 0 5px #9ECE6A' }}
        />
      )}
    </span>
  );
}
