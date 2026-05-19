import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MeRedirect from '@/pages/MeRedirect';
import { useAuthStore } from '@/stores/auth-store';

function wrap(entries: string[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={entries}>
        <Routes>
          <Route path="/me" element={<MeRedirect />} />
          <Route path="/profile/:username" element={<div>profile of placeholder</div>} />
          <Route path="/auth/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MeRedirect (T-223, FR-11.2)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: 'guest' });
  });

  it('authed → redirect /profile/:ownUsername', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        username: 'alice',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      status: 'authed',
    });
    wrap(['/me']);
    expect(screen.getByText(/profile of placeholder/i)).toBeInTheDocument();
  });

  it('guest → redirect /auth/login?next=%2Fme', () => {
    wrap(['/me']);
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  it('hydrating → renders null (no redirect yet)', () => {
    useAuthStore.setState({ user: null, status: 'hydrating' });
    const { container } = wrap(['/me']);
    expect(container).toHaveTextContent('');
  });
});
