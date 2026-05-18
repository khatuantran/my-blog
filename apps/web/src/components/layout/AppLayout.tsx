import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';
import { CommandPalette } from '../command-palette/CommandPalette';
import { useCommandPalette } from '@/hooks/use-command-palette';

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
      <TopBar onOpenCommandPalette={() => setOpen(true)} />

      <main className="pt-[52px] pb-[28px] min-h-screen">
        <Outlet />
      </main>

      <StatusBar path={pathLabel(pathname)} />

      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
