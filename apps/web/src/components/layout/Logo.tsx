import { Link } from 'react-router';

type Props = {
  to?: string;
  className?: string;
};

// Brand mark: SVG `< >` brackets (cyan + purple) + text "kha.blog" với glitch.
// Reuse cho TopBar + Login.
export function Logo({ to = '/', className = '' }: Props) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 select-none shrink-0 no-underline ${className}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0 block" aria-hidden="true">
        <polyline
          points="8,3 3,12 8,21"
          stroke="#00FFE5"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="16,3 21,12 16,21"
          stroke="#BB9AF7"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="font-brand font-bold text-base tracking-[-0.04em] leading-none animate-glitch inline-block">
        <span className="text-tp">kha</span>
        <span className="text-cyan">.</span>
        <span className="text-ts font-medium">blog</span>
      </div>
    </Link>
  );
}
