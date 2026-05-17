import { Outlet } from 'react-router';

export function App() {
  return (
    <div className="min-h-screen bg-bg text-tp font-sans antialiased">
      <Outlet />
    </div>
  );
}
