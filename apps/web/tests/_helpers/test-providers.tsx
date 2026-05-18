import { Suspense, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createTestQueryClient } from './query-client';

type Props = {
  children: ReactNode;
  initialEntries?: string[];
  client?: QueryClient;
};

export function TestProviders({ children, initialEntries = ['/'], client }: Props) {
  const qc = client ?? createTestQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>
        <Suspense fallback={<div>loading…</div>}>{children}</Suspense>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
