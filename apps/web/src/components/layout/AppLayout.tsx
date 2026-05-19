import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';
import { CommandPalette } from '../command-palette/CommandPalette';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useAuth } from '@/hooks/use-auth';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';

// Map URL path → terminal path label cho StatusBar.
function pathLabel(pathname: string): string {
  if (pathname === '/') return '~/feed';
  if (pathname.startsWith('/post/')) return `~/post${pathname.slice(5)}`;
  if (pathname === '/admin') return '~/admin/dashboard';
  if (pathname === '/admin/create') return '~/admin/create-post';
  return `~${pathname}`;
}

// Shell shared cho mọi page (trừ Auth).
export function AppLayout() {
  const { pathname } = useLocation();
  const { open, setOpen, toggle } = useCommandPalette();
  const { isHydrating } = useAuth();

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return (
    <div className="min-h-screen bg-bg text-tp font-sans antialiased">
      <TopBar onOpenCommandPalette={() => setOpen(true)} hideSearch={pathname === '/search'} />

      <main className="pt-[52px] pb-[28px] min-h-screen">
        <Outlet />
      </main>

      <StatusBar path={pathLabel(pathname)} />

      <CommandPalette open={open} onClose={() => setOpen(false)} />

      {isHydrating && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Initializing session"
          className="fixed inset-0 z-[300] flex items-center justify-center bg-bg font-mono text-mono text-tm"
        >
          <span className="flex items-center gap-2">
            <AsciiSpinner /> initializing session...
          </span>
        </div>
      )}
    </div>
  );
}
