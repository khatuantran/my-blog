import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Suspense } from 'react';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/pages/LoginPage';
import { mswServer } from '../_helpers/msw-server';
import { createTestQueryClient } from '../_helpers/query-client';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = 'http://localhost:3001';

// Mock useNavigate để tránh full router navigation (avoid React Router lazy +
// MSW undici unhandled rejection noise trong vitest).
const navigateSpy = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigateSpy };
});

function renderLogin(initialEntry = '/auth/login') {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Suspense fallback={<div>loading…</div>}>
          <LoginPage />
        </Suspense>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // Guest mode cho login tests
  useAuthStore.setState({ status: 'guest', user: null });
  navigateSpy.mockReset();
});

describe('LoginPage', () => {
  it('renders form + brand mark + scan line area', async () => {
    renderLogin();
    expect(await screen.findByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /authenticate/i })).toBeInTheDocument();
    expect(screen.getByText('~/auth/login')).toBeInTheDocument();
    expect(screen.getByText('kha')).toBeInTheDocument();
  });

  it('submit empty → error all fields required (no API call)', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(await screen.findByRole('button', { name: /authenticate/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/all fields required/i);
  });

  it('submit invalid → 401 → error banner', async () => {
    const user = userEvent.setup();
    mswServer.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json({ error: { code: 'BAD_CREDS' } }, { status: 401 }),
      ),
    );
    renderLogin();
    await user.type(await screen.findByLabelText(/username/i), 'bad');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /authenticate/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i);
    });
  });

  it('submit valid → POST /auth/login + setUser + navigate /', async () => {
    const user = userEvent.setup();
    mswServer.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json({
          data: {
            id: 'u1',
            username: 'admin',
            email: null,
            role: 'ADMIN',
            avatarUrl: null,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    );
    renderLogin();
    await user.type(await screen.findByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText('Password'), 'admin');
    await user.click(screen.getByRole('button', { name: /authenticate/i }));
    await waitFor(() => {
      expect(useAuthStore.getState().user?.username).toBe('admin');
    });
    expect(navigateSpy).toHaveBeenCalledWith('/', { replace: true });
  });

  it('show/hide password toggle', async () => {
    const user = userEvent.setup();
    renderLogin();
    const pw = await screen.findByLabelText('Password');
    expect(pw).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(pw).toHaveAttribute('type', 'text');
  });

  it('T-370: anonymous link → href /', async () => {
    renderLogin();
    await screen.findByLabelText(/username/i);
    const anonLink = screen.getByTestId('anon-link');
    expect(anonLink).toHaveTextContent('Continue as anonymous →');
    expect(anonLink).toHaveAttribute('href', '/');
  });

  it('T-370: register link → /auth/register', async () => {
    renderLogin();
    await screen.findByLabelText(/username/i);
    const regLink = screen.getByTestId('register-link');
    expect(regLink).toHaveTextContent('❯ register here');
    expect(regLink).toHaveAttribute('href', '/auth/register');
  });

  it('T-370: bracket logo SVG renders 2 polylines (cyan < + purple >)', async () => {
    const { container } = renderLogin();
    await screen.findByLabelText(/username/i);
    const polylines = container.querySelectorAll('polyline');
    expect(polylines.length).toBe(2);
    expect(polylines[0]).toHaveAttribute('stroke', '#00FFE5');
    expect(polylines[1]).toHaveAttribute('stroke', '#BB9AF7');
  });

  it('T-370: bottom mini status shows pulse dot + build sha', async () => {
    renderLogin();
    await screen.findByLabelText(/username/i);
    expect(screen.getByText(/connected to server/)).toBeInTheDocument();
    expect(screen.getByText(/build:/)).toBeInTheDocument();
  });
});
