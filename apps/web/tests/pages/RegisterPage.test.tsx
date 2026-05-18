import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Suspense } from 'react';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import RegisterPage from '@/pages/RegisterPage';
import { mswServer } from '../_helpers/msw-server';
import { createTestQueryClient } from '../_helpers/query-client';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = 'http://localhost:3001';

const navigateSpy = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigateSpy };
});

function renderRegister() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/auth/register']}>
        <Suspense fallback={<div>loading…</div>}>
          <RegisterPage />
        </Suspense>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ status: 'guest', user: null });
  navigateSpy.mockReset();
});

describe('RegisterPage', () => {
  it('renders 3 form fields + create button', async () => {
    renderRegister();
    expect(await screen.findByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('submit invalid username (special chars) → local validation error', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(await screen.findByLabelText('Username'), 'bad name!');
    await user.type(screen.getByLabelText('Password'), 'strongpass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/username chỉ chữ/i);
  });

  it('submit valid → POST /auth/register + setUser + navigate /', async () => {
    const user = userEvent.setup();
    mswServer.use(
      http.post(`${API_URL}/auth/register`, () =>
        HttpResponse.json(
          {
            data: {
              id: 'u1',
              username: 'newuser',
              email: null,
              role: 'USER',
              avatarUrl: null,
              createdAt: '2026-05-18T00:00:00.000Z',
            },
          },
          { status: 201 },
        ),
      ),
    );
    renderRegister();
    await user.type(await screen.findByLabelText('Username'), 'newuser');
    await user.type(screen.getByLabelText('Password'), 'strongpass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(useAuthStore.getState().user?.username).toBe('newuser');
    });
    expect(navigateSpy).toHaveBeenCalledWith('/', { replace: true });
  });

  it('409 username taken → banner red', async () => {
    const user = userEvent.setup();
    mswServer.use(
      http.post(`${API_URL}/auth/register`, () =>
        HttpResponse.json({ error: { code: 'USERNAME_TAKEN' } }, { status: 409 }),
      ),
    );
    renderRegister();
    await user.type(await screen.findByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'strongpass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/already taken/i);
    });
  });
});
