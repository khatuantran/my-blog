import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { AvatarMenu } from './AvatarMenu';
import { useAuth } from '@/hooks/use-auth';

type Props = {
  onOpenCommandPalette: () => void;
  hideSearch?: boolean;
};

export function TopBar({ onOpenCommandPalette, hideSearch = false }: Props) {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const [searchInput, setSearchInput] = useState('');

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchInput('');
  }

  return (
    <header
      data-slot="topbar"
      className="fixed top-0 left-0 right-0 h-[52px] bg-surf/95 backdrop-blur-sm border-b border-b1 flex items-center px-5 z-50"
    >
      <Logo />

      {/* Search — centered absolute */}
      {!hideSearch && (
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="absolute left-1/2 -translate-x-1/2 w-[440px] max-w-[calc(100vw-260px)] z-[1] hidden md:block"
        >
          <span
            aria-hidden="true"
            className="absolute left-[10px] top-1/2 -translate-y-1/2 text-tm text-mono-md pointer-events-none"
          >
            ⌕
          </span>
          <input
            type="search"
            aria-label="Search posts, tags, users"
            placeholder="~$ search posts, tags, users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-bg border border-b2 text-ts font-mono text-mono-md pl-9 pr-[70px] py-2 rounded-md outline-none transition-all duration-150 placeholder:text-tm placeholder:italic focus:border-cyan focus:text-tp focus:shadow-glow-cyan-md"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label="Open command palette (⌘K)"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-mono-sm text-tm bg-elev border border-b2 rounded-[3px] px-[7px] py-[2px] cursor-pointer whitespace-nowrap hover:text-tp hover:border-b3"
          >
            ⌘K
          </button>
        </form>
      )}

      {/* Right cluster */}
      <div className="flex items-center gap-2.5 ml-auto shrink-0">
        <span className="font-mono text-mono-sm text-tm border border-b2 rounded-[3px] px-[7px] py-[2px] hidden md:inline-block">
          [ v0.1.0 ]
        </span>
        <span className="flex items-center gap-1 font-mono text-mono-sm text-grn">
          <span className="animate-pulse-status text-[8px]">●</span> 3
        </span>

        {/* Notification bell — authed only */}
        {isAuthed && <NotificationBell />}

        {/* AvatarMenu (T-364) — 7-item dropdown */}
        <AvatarMenu />
      </div>
    </header>
  );
}
