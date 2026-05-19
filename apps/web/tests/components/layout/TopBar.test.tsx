import { describe, expect, it, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/TopBar';
import { createTestQueryClient } from '../../_helpers/query-client';
import { mswServer } from '../../_helpers/msw-server';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = 'http://localhost:3001';

const navigateSpy = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigateSpy };
});

function renderTopBar(onOpen = vi.fn()) {
  return {
    onOpen,
    ...render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <TopBar onOpenCommandPalette={onOpen} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  navigateSpy.mockReset();
});

describe('TopBar — authed admin (default)', () => {
  it('renders logo + search + version + avatar', () => {
    renderTopBar();
    expect(screen.getByText('kha')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search posts, tags, users/i)).toBeInTheDocument();
    expect(screen.getByText('[ v0.1.0 ]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
  });

  it('click ⌘K hint → onOpenCommandPalette callback fired', async () => {
    const user = userEvent.setup();
    const { onOpen } = renderTopBar();
    await user.click(screen.getByRole('button', { name: /open command palette/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('dropdown menu hiển thị authed admin items + Logout', async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('[ ADMIN ]')).toBeInTheDocument();
  });

  it('click outside → menu đóng', async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Create Post')).not.toBeInTheDocument();
  });

  it('click Logout → POST /auth/logout + clear store + navigate /auth/login', async () => {
    const user = userEvent.setup();
    let logoutCalled = false;
    mswServer.use(
      http.post(`${API_URL}/auth/logout`, () => {
        logoutCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /logout/i }));

    await waitFor(() => expect(logoutCalled).toBe(true));
    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith('/auth/login', { replace: true });
    });
  });
});

describe('TopBar — guest user', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'guest', user: null });
  });

  it('dropdown chỉ có Login + Register, không có Logout', async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).toBeNull();
    expect(screen.queryByText('Admin Dashboard')).toBeNull();
    expect(screen.queryByText('[ ADMIN ]')).toBeNull();
  });
});

describe('TopBar — authed USER (non-admin)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'authed',
      user: {
        id: 'u',
        username: 'plain',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  it('dropdown ẩn admin-only items (Create Post + Admin Dashboard)', async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.queryByText('Create Post')).toBeNull();
    expect(screen.queryByText('Admin Dashboard')).toBeNull();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('[ ADMIN ]')).toBeNull();
  });

  it('Profile link wire → /me, Saved → /saved (T-223)', async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByRole('menuitem', { name: /profile/i })).toHaveAttribute('href', '/me');
    expect(screen.getByRole('menuitem', { name: /saved/i })).toHaveAttribute('href', '/saved');
  });
});
