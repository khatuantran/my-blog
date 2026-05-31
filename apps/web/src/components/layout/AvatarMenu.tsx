import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { useLogout } from '@/hooks/mutations/use-logout';

// AvatarMenu (T-364) — 7-item dropdown per DESIGN_SYSTEM L848 AvatarMenu spec.
// Triggered by 32×32 avatar in TopBar with green pulse status dot bottom-right.

type ColorKey = 'blu' | 'pur' | 'yel' | 'grn' | 'ts' | 'red';

type MenuEntry = {
  icon: string;
  label: string;
  to?: string;
  kbd?: string;
  color: ColorKey;
  separatorBefore?: boolean;
  adminOnly?: boolean;
  disabled?: boolean;
};

const COLOR_CLASS: Record<ColorKey, string> = {
  blu: 'text-blu',
  pur: 'text-pur',
  yel: 'text-yel',
  grn: 'text-grn',
  ts: 'text-ts',
  red: 'text-red',
};

const AUTHED_MENU: MenuEntry[] = [
  { icon: '📝', label: 'Manage Posts', to: '/admin/posts', color: 'blu', adminOnly: true },
  { icon: '⚙️', label: 'Admin Dashboard', to: '/admin', kbd: '⌘3', color: 'pur', adminOnly: true },
  { icon: '🏷', label: 'Manage Tags', to: '/tags', color: 'yel', adminOnly: true },
  { icon: '🛰', label: 'Trace Logs', to: '/admin/logs', color: 'red', adminOnly: true },
  { icon: '🔧', label: 'System Settings', color: 'grn', disabled: true, adminOnly: true },
  { icon: '👤', label: 'Profile', to: '/me', color: 'ts', separatorBefore: true },
];

const GUEST_MENU: MenuEntry[] = [
  { icon: '🔑', label: 'Login', to: '/auth/login', color: 'blu' },
  { icon: '✨', label: 'Register', to: '/auth/register', color: 'pur' },
];

export function AvatarMenu() {
  const navigate = useNavigate();
  const { user, isAuthed } = useAuth();
  const logoutMutation = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial = (user?.username[0] ?? '?').toUpperCase();
  const isAdmin = user?.role === 'ADMIN';
  const items = isAuthed ? AUTHED_MENU.filter((i) => !i.adminOnly || isAdmin) : GUEST_MENU;

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  function handleLogout() {
    setOpen(false);
    logoutMutation.mutate(undefined, {
      onSettled: () => navigate('/auth/login', { replace: true }),
    });
  }

  return (
    <div ref={ref} className="relative" data-testid="avatar-menu">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={open}
        data-testid="avatar-menu-trigger"
        className={`w-8 h-8 rounded-full border-2 border-cyan flex items-center justify-center font-brand font-bold text-mono-md text-cyan cursor-pointer transition-shadow relative ${
          open ? 'shadow-glow-cyan-md' : 'shadow-glow-cyan-sm'
        }`}
        style={{ background: 'linear-gradient(135deg,#00FFE520,#BB9AF720)' }}
      >
        {initial}
        <span
          aria-hidden="true"
          data-testid="avatar-menu-status-dot"
          className="absolute -bottom-[1px] -right-[1px] w-2 h-2 bg-grn rounded-full animate-pulse-status"
          style={{ border: '1.5px solid #11151F', boxShadow: '0 0 5px #9ECE6A' }}
        />
      </button>

      {open && (
        <div
          role="menu"
          data-testid="avatar-menu-panel"
          className="absolute top-[42px] right-0 bg-elev rounded-lg min-w-[210px] p-1.5 z-dropdown animate-fade-up-xs"
          style={{
            border: '1px solid rgba(0,255,229,.25)',
            boxShadow: '0 0 30px rgba(0,255,229,.1),0 12px 40px rgba(0,0,0,.6)',
          }}
        >
          {isAuthed && (
            <div className="px-2.5 pt-2 pb-2.5 border-b border-b2 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full border-[1.5px] border-cyan flex items-center justify-center text-mono-sm text-cyan font-bold font-brand"
                  style={{ background: 'linear-gradient(135deg,#00FFE520,#BB9AF720)' }}
                >
                  {initial}
                </div>
                <div>
                  <div className="font-mono text-mono-sm text-blu">~/{user?.username}</div>
                  {isAdmin && (
                    <div className="font-mono text-mono-sm text-ora mt-px leading-none">
                      [ ADMIN ]
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {items.map((item, i) => (
            <div key={`${item.label}-${i}`}>
              {item.separatorBefore && <div className="h-px bg-b2 my-1" />}
              {item.disabled ? (
                <div
                  role="menuitem"
                  aria-disabled="true"
                  data-testid={`avatar-menu-item-${slug(item.label)}`}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] cursor-not-allowed opacity-50 ${COLOR_CLASS[item.color]}`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="flex-1 text-mono-md">{item.label}</span>
                  <span className="font-mono text-mono-sm text-td">// TBD</span>
                </div>
              ) : item.to ? (
                <Link
                  to={item.to}
                  role="menuitem"
                  data-testid={`avatar-menu-item-${slug(item.label)}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] no-underline transition-colors hover:bg-cyan/10 ${COLOR_CLASS[item.color]}`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="flex-1 text-mono-md">{item.label}</span>
                  {item.kbd && <span className="font-mono text-mono-sm text-tm">{item.kbd}</span>}
                </Link>
              ) : null}
            </div>
          ))}

          {isAuthed && (
            <>
              <div className="h-px bg-b2 my-1" />
              <button
                type="button"
                role="menuitem"
                data-testid="avatar-menu-item-logout"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-[5px] border-none bg-transparent text-left text-red transition-colors hover:bg-cyan/10 disabled:opacity-50"
              >
                <span className="text-sm">🚪</span>
                <span className="flex-1 text-mono-md">
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </span>
                <span className="font-mono text-mono-sm text-tm">⌘Q</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function slug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-');
}
