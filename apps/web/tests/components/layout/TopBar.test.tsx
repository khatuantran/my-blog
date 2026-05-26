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

function renderTopBar(onOpen = vi.fn(), props: { hideSearch?: boolean } = {}) {
  return {
    onOpen,
    ...render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <TopBar onOpenCommandPalette={onOpen} hideSearch={props.hideSearch} />
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

  it('dropdown menu hiển thị authed admin items + Logout (T-364: Manage Posts/Admin/Manage Tags/Profile spec)', async () => {
    // T-364 test-stale-assumption: design v2 swaps "Create Post / Saved" → "Manage Posts / Manage Tags / System Settings".
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Manage Posts')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('[ ADMIN ]')).toBeInTheDocument();
  });

  it('click outside → menu đóng', async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Manage Posts')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Manage Posts')).not.toBeInTheDocument();
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

  it('dropdown ẩn admin-only items (Manage Posts + Admin Dashboard) — T-364 stale-assumption update', async () => {
    // T-364 test-stale-assumption: design v2 menu uses Manage Posts/Manage Tags/System Settings instead of Create Post/Saved.
    // Non-admin user keeps Manage Tags + Profile + System Settings (disabled) + Logout.
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.queryByText('Manage Posts')).toBeNull();
    expect(screen.queryByText('Admin Dashboard')).toBeNull();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage Tags')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('[ ADMIN ]')).toBeNull();
  });

  it('Profile link wire → /me (T-364: Saved removed from menu per design v2)', async () => {
    // T-364 test-stale-assumption: "Saved" entry removed from AvatarMenu per design-file spec.
    // /saved route still exists, just not surfaced in this menu.
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByRole('menuitem', { name: /profile/i })).toHaveAttribute('href', '/me');
  });

  it('hideSearch=true → search input not rendered (T-232)', () => {
    renderTopBar(vi.fn(), { hideSearch: true });
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search posts, tags, users/i)).not.toBeInTheDocument();
  });

  it('search submit → navigate /search?q=encoded (T-232)', () => {
    renderTopBar();
    const input = screen.getByPlaceholderText(/search posts, tags, users/i);
    fireEvent.change(input, { target: { value: 'cyberpunk' } });
    const form = screen.getByRole('search');
    fireEvent.submit(form);
    expect(navigateSpy).toHaveBeenCalledWith('/search?q=cyberpunk');
  });

  it('search submit với trimmed empty → no navigate', () => {
    renderTopBar();
    const input = screen.getByPlaceholderText(/search posts, tags, users/i);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
