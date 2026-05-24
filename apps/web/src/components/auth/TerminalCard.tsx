import type { ReactNode } from 'react';
import { Link } from 'react-router';

type Props = {
  path: string;
  cursorBlink?: boolean;
  shaking?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

// Reusable terminal card cho Login + Register.
// - Header: brand logo + path + cursor blink
// - Scan-line stripe animation moving top → bottom
// - Shake animation khi prop shaking=true (450ms ease)
//
// Inline keyframes inject 1 lần (deduped by id).
const KEYFRAMES_CSS = `
@keyframes scanCardStripe { 0% { top: -100%; } 100% { top: 200%; } }
@keyframes terminalShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
@keyframes terminalFadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes terminalCursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
`;

function injectKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('terminal-card-css')) return;
  const style = document.createElement('style');
  style.id = 'terminal-card-css';
  style.textContent = KEYFRAMES_CSS;
  document.head.appendChild(style);
}

export function TerminalCard({ path, cursorBlink = true, shaking, children, footer }: Props) {
  injectKeyframes();

  return (
    <div
      className="w-full max-w-[420px] p-5 font-mono"
      style={{ animation: 'terminalFadeUp .35s ease' }}
    >
      <div
        className="relative overflow-hidden rounded-xl bg-elev"
        style={{
          border: '1px solid #2A3548',
          boxShadow: '0 0 50px rgba(0,255,229,.07), 0 20px 60px rgba(0,0,0,.55)',
          animation: shaking ? 'terminalShake .45s ease' : undefined,
        }}
      >
        {/* Scan stripe */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 z-[2] h-[2px]"
          style={{
            background: 'linear-gradient(90deg,transparent,rgba(0,255,229,.18),transparent)',
            animation: 'scanCardStripe 4s linear infinite',
          }}
        />

        {/* Header */}
        <div className="border-b border-b1 bg-bg px-[18px] py-[14px]">
          <div className="mb-1.5 flex items-center gap-2">
            <Link
              to="/"
              aria-label="kha.blog home"
              className="flex items-center gap-2 no-underline"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <polyline
                  points="8,3 3,12 8,21"
                  stroke="#00FFE5"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <polyline
                  points="16,3 21,12 16,21"
                  stroke="#BB9AF7"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-brand text-[15px] font-bold tracking-[-0.03em]">
                <span className="text-tp">kha</span>
                <span className="text-cyan">.</span>
                <span className="text-ts font-medium">blog</span>
              </span>
            </Link>
            <span className="ml-1 font-mono text-mono-sm text-td">v0.1.0</span>
          </div>
          <div className="font-mono text-mono-md text-tm">
            {path}
            {cursorBlink && (
              <span
                className="text-cyan"
                style={{ animation: 'terminalCursorBlink 1.06s steps(2) infinite' }}
              >
                _
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="relative z-[1] px-5 pb-[26px] pt-[22px]">{children}</div>
      </div>

      {footer}
    </div>
  );
}
