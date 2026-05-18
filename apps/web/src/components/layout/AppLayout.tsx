import { Outlet } from 'react-router';
import { TopBar } from './TopBar';

// Shell shared cho mọi page (trừ Auth).
// StatusBar (T-051) + CommandPalette (T-052) sẽ wire ở task kế.
export function AppLayout() {
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

      {/* StatusBar slot — fixed bottom 28px, fill ở T-051 */}
      <div
        role="presentation"
        aria-hidden="true"
        className="fixed bottom-0 left-0 right-0 h-[28px] border-t border-b1 bg-[#070A14] z-50"
        data-slot="statusbar"
      />
    </div>
  );
}
