import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Logo } from './Logo';
import { useAuth } from '@/hooks/use-auth';
import { useLogout } from '@/hooks/mutations/use-logout';

type Props = {
  onOpenCommandPalette: () => void;
  hideSearch?: boolean;
};

type ColorKey = 'cyan' | 'pur' | 'yel' | 'tp' | 'red';
type MenuItem = {
  icon: string;
  label: string;
  to: string;
  kbd?: string;
  color: ColorKey;
  separatorBefore?: boolean;
  adminOnly?: boolean;
};

const COLOR_CLASS: Record<ColorKey, string> = {
  cyan: 'text-cyan',
  pur: 'text-pur',
  yel: 'text-yel',
  tp: 'text-tp',
  red: 'text-red',
};

const AUTHED_MENU: MenuItem[] = [
  {
    icon: '✏️',
    label: 'Create Post',
    to: '/admin/create',
    kbd: '⌘N',
    color: 'cyan',
    adminOnly: true,
  },
  { icon: '⚙️', label: 'Admin Dashboard', to: '/admin', kbd: '⌘3', color: 'pur', adminOnly: true },
  { icon: '🔖', label: 'Saved', to: '/saved', kbd: '⌘2', color: 'yel' },
  { icon: '👤', label: 'Profile', to: '/me', color: 'tp', separatorBefore: true },
];

const GUEST_MENU: MenuItem[] = [
  { icon: '🔑', label: 'Login', to: '/auth/login', color: 'cyan' },
  { icon: '✨', label: 'Register', to: '/auth/register', color: 'pur' },
];

export function TopBar({ onOpenCommandPalette, hideSearch = false }: Props) {
  const navigate = useNavigate();
  const { user, isAuthed } = useAuth();
  const logoutMutation = useLogout();
  const [showMenu, setShowMenu] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchInput('');
  }
  const initial = (user?.username[0] ?? '?').toUpperCase();
  const isAdmin = user?.role === 'ADMIN';
  const menuItems = isAuthed ? AUTHED_MENU.filter((i) => !i.adminOnly || isAdmin) : GUEST_MENU;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleLogout() {
    setShowMenu(false);
    logoutMutation.mutate(undefined, {
      onSettled: () => navigate('/auth/login', { replace: true }),
    });
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
            className="absolute left-[10px] top-1/2 -translate-y-1/2 text-tm text-[13px] pointer-events-none"
          >
            ⌕
          </span>
          <input
            type="search"
            aria-label="Search posts, tags, users"
            placeholder="~$ search posts, tags, users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-bg border border-b2 text-ts font-mono text-[13px] pl-9 pr-[70px] py-2 rounded-md outline-none transition-all duration-150 placeholder:text-tm placeholder:italic focus:border-cyan focus:text-tp focus:shadow-glow-cyan-md"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label="Open command palette (⌘K)"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-mono-xs text-tm bg-elev border border-b2 rounded-[3px] px-[7px] py-[2px] cursor-pointer whitespace-nowrap hover:text-tp hover:border-b3"
          >
            ⌘K
          </button>
        </form>
      )}

      {/* Right cluster */}
      <div className="flex items-center gap-2.5 ml-auto shrink-0">
        <span className="font-mono text-mono-xs text-tm border border-b2 rounded-[3px] px-[7px] py-[2px] hidden md:inline-block">
          [ v0.1.0 ]
        </span>
        <span className="flex items-center gap-1 font-mono text-mono-sm text-grn">
          <span className="animate-pulse-status text-[8px]">●</span> 3
        </span>

        {/* Avatar + dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            aria-label="User menu"
            aria-expanded={showMenu}
            className={`w-8 h-8 rounded-full border-2 border-cyan flex items-center justify-center font-brand font-bold text-[13px] text-cyan cursor-pointer transition-shadow relative ${
              showMenu ? 'shadow-glow-cyan-md' : 'shadow-glow-cyan-sm'
            }`}
            style={{ background: 'linear-gradient(135deg,#00FFE520,#BB9AF720)' }}
          >
            {initial}
            <span
              aria-hidden="true"
              className="absolute -bottom-[1px] -right-[1px] w-2 h-2 bg-grn rounded-full"
              style={{ border: '1.5px solid #11151F', boxShadow: '0 0 5px #9ECE6A' }}
            />
          </button>

          {showMenu && (
            <div
              role="menu"
              className="absolute top-[42px] right-0 bg-elev rounded-lg min-w-[210px] p-1.5 z-[200] animate-fade-up"
              style={{
                border: '1px solid rgba(0,255,229,.25)',
                boxShadow: '0 0 30px rgba(0,255,229,.1),0 12px 40px rgba(0,0,0,.6)',
              }}
            >
              <div className="px-2.5 pt-2 pb-2.5 border-b border-b2 mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full border-[1.5px] border-cyan flex items-center justify-center text-[11px] text-cyan font-bold font-brand"
                    style={{ background: 'linear-gradient(135deg,#00FFE520,#BB9AF720)' }}
                  >
                    {initial}
                  </div>
                  <div>
                    <div className="font-mono text-mono-sm text-blu">
                      ~/{user?.username ?? 'guest'}
                    </div>
                    {isAdmin && (
                      <div className="font-mono text-mono-xs text-ora mt-px">[ ADMIN ]</div>
                    )}
                  </div>
                </div>
              </div>
              {menuItems.map((item, i) => (
                <div key={i}>
                  {item.separatorBefore && <div className="h-px bg-b2 my-1" />}
                  <Link
                    to={item.to}
                    role="menuitem"
                    onClick={() => setShowMenu(false)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] no-underline transition-colors hover:bg-cyan/10 ${COLOR_CLASS[item.color]}`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="flex-1 text-[13px]">{item.label}</span>
                    {item.kbd && <span className="font-mono text-mono-xs text-tm">{item.kbd}</span>}
                  </Link>
                </div>
              ))}
              {isAuthed && (
                <>
                  <div className="h-px bg-b2 my-1" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-[5px] border-none bg-transparent text-left text-red transition-colors hover:bg-red/10 disabled:opacity-50"
                  >
                    <span className="text-sm">🚪</span>
                    <span className="flex-1 text-[13px]">
                      {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                    </span>
                    <span className="font-mono text-mono-xs text-tm">⌘Q</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
