import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from './routes';
import './lib/env'; // side-effect: validate VITE_* env on startup
import './styles/globals.css';
import { useAuthStore } from './stores/auth-store';
import { AsciiSpinner } from './components/feed/AsciiSpinner';

// Kick off auth hydration ngay khi module load (before render).
// Splash UI trong AppLayout sẽ cover cho đến khi resolve.
void useAuthStore.getState().hydrate();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center gap-2 font-mono text-mono text-tm">
            <AsciiSpinner /> loading…
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
);
