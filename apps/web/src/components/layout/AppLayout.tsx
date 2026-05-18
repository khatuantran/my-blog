import { Outlet } from 'react-router';

// Shell shared cho mọi page (trừ Auth). TopBar (T-050) + StatusBar (T-051)
// + CommandPalette (T-052) sẽ wire vào slot tại các task kế.
// Hiện tại render Outlet với spacing tương đương khi shell đầy đủ
// (52px top + 28px bottom) để layout không jump khi components đáp vào.
export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg text-tp font-sans antialiased">
      {/* TopBar slot — fixed top 52px, fill ở T-050 */}
      <div
        role="presentation"
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[52px] border-b border-b1 bg-surf/95 backdrop-blur-sm z-50"
        data-slot="topbar"
      />

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
