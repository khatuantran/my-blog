import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { useAuthStore } from '@/stores/auth-store';

function renderGuard(
  path: string,
  guard: React.ReactNode,
  extra?: { path: string; element: React.ReactNode }[],
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div data-testid="home">HOME</div>} />
        <Route path="/auth/login" element={<div data-testid="login">LOGIN</div>} />
        <Route path="/protected" element={<>{guard}</>} />
        <Route path="/admin-only" element={<>{guard}</>} />
        {extra?.map((r) => (
          <Route key={r.path} path={r.path} element={<>{r.element}</>} />
        ))}
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // Reset trước mỗi test
  useAuthStore.setState({ status: 'guest', user: null });
});

describe('ProtectedRoute', () => {
  it('hydrating → render null (no redirect flash)', () => {
    useAuthStore.setState({ status: 'hydrating', user: null });
    renderGuard(
      '/protected',
      <ProtectedRoute>
        <div data-testid="content">SECRET</div>
      </ProtectedRoute>,
    );
    expect(screen.queryByTestId('content')).toBeNull();
    expect(screen.queryByTestId('login')).toBeNull();
    expect(screen.queryByTestId('home')).toBeNull();
  });

  it('guest → redirect /auth/login với next= preserved', () => {
    useAuthStore.setState({ status: 'guest', user: null });
    renderGuard(
      '/protected',
      <ProtectedRoute>
        <div data-testid="content">SECRET</div>
      </ProtectedRoute>,
    );
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('authed + không có requireRole → render children', () => {
    useAuthStore.setState({
      status: 'authed',
      user: {
        id: 'u',
        username: 'u',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    renderGuard(
      '/protected',
      <ProtectedRoute>
        <div data-testid="content">SECRET</div>
      </ProtectedRoute>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('USER + requireRole=ADMIN → redirect /', () => {
    useAuthStore.setState({
      status: 'authed',
      user: {
        id: 'u',
        username: 'u',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    renderGuard(
      '/admin-only',
      <ProtectedRoute requireRole="ADMIN">
        <div data-testid="content">SECRET</div>
      </ProtectedRoute>,
    );
    expect(screen.getByTestId('home')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('ADMIN + requireRole=ADMIN → render children', () => {
    useAuthStore.setState({
      status: 'authed',
      user: {
        id: 'a',
        username: 'admin',
        email: null,
        role: 'ADMIN',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    renderGuard(
      '/admin-only',
      <ProtectedRoute requireRole="ADMIN">
        <div data-testid="content">SECRET</div>
      </ProtectedRoute>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
