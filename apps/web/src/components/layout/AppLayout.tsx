import { Outlet, useLocation } from 'react-router';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';

// Map URL path → terminal path label cho StatusBar.
function pathLabel(pathname: string): string {
  if (pathname === '/') return '~/feed';
  if (pathname.startsWith('/post/')) return `~/post${pathname.slice(5)}`;
  if (pathname === '/admin') return '~/admin/dashboard';
  if (pathname === '/admin/create') return '~/admin/create-post';
  return `~${pathname}`;
}

// Shell shared cho mọi page (trừ Auth). CommandPalette (T-052) wire ở task kế.
export function AppLayout() {
  const { pathname } = useLocation();

  function handleOpenCommandPalette() {
    // TODO(T-052): mở CommandPalette qua Zustand store.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[AppLayout] open command palette (stub — wired in T-052)');
    }
  }

  return (
    <div className="min-h-screen bg-bg text-tp font-sans antialiased">
      <TopBar onOpenCommandPalette={handleOpenCommandPalette} />

      <main className="pt-[52px] pb-[28px] min-h-screen">
        <Outlet />
      </main>

      <StatusBar path={pathLabel(pathname)} />
    </div>
  );
}
