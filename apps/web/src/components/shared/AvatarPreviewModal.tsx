import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  username?: string | null;
  avatarUrl?: string | null;
  onClose: () => void;
};

// AvatarPreviewModal — popup xem avatar phóng to (click avatar ở PostHeader/feed).
// Click backdrop hoặc × hoặc Esc → đóng. Default avatar (no url) hiển thị initial lớn.
export function AvatarPreviewModal({ username, avatarUrl, onClose }: Props) {
  const initial = (username?.[0] ?? '?').toUpperCase();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={username ? `${username} avatar` : 'Avatar'}
      data-testid="avatar-preview"
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-bg/[0.92] p-6 animate-fade-up-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close avatar viewer"
        data-testid="avatar-preview-close"
        className="absolute right-5 top-4 rounded-md border-none bg-transparent px-2 py-1 font-mono text-mono-lg text-tm transition-colors hover:text-tp"
      >
        ×
      </button>

      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username ? `${username} avatar` : 'Avatar'}
          data-testid="avatar-preview-img"
          className="max-h-[80vh] max-w-[420px] rounded-2xl border-2 border-cyan object-contain shadow-glow-cyan-md"
        />
      ) : (
        <span
          data-testid="avatar-preview-default"
          className="flex h-[280px] w-[280px] items-center justify-center rounded-full border-2 border-cyan font-brand text-[120px] font-bold text-cyan"
          style={{
            background: 'linear-gradient(135deg,#00FFE520,#BB9AF720)',
            boxShadow: '0 0 30px rgba(0,255,229,.25)',
          }}
        >
          {initial}
        </span>
      )}

      {username && <div className="mt-4 font-mono text-mono text-tm">~/{username}</div>}
    </div>
  );

  return createPortal(modal, document.body);
}
