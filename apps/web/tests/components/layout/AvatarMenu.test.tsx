import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AvatarMenu } from '@/components/layout/AvatarMenu';
import { createTestQueryClient } from '../../_helpers/query-client';
import { useAuthStore } from '@/stores/auth-store';

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => vi.fn() };
});

function renderMenu() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AvatarMenu />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({
    status: 'authed',
    user: {
      id: 'admin-1',
      username: 'admin',
      email: 'a@x.com',
      role: 'ADMIN',
      avatarUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  });
});

describe('AvatarMenu (T-364)', () => {
  it('renders 7 items khi admin authed (Manage Posts / Admin / Manage Tags / System Settings / Profile / Logout + separator)', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('avatar-menu-trigger'));
    // 5 entries in AUTHED_MENU + Logout (rendered separately) + Profile separator visible.
    expect(screen.getByTestId('avatar-menu-item-manage-posts')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-menu-item-admin-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-menu-item-manage-tags')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-menu-item-system-settings')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-menu-item-profile')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-menu-item-logout')).toBeInTheDocument();
    // System Settings disabled (no route yet)
    expect(screen.getByTestId('avatar-menu-item-system-settings')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    // Admin badge visible
    expect(screen.getByText('[ ADMIN ]')).toBeInTheDocument();
  });

  it('non-admin user filters out adminOnly entries (Manage Posts + Admin Dashboard hidden)', async () => {
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
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('avatar-menu-trigger'));
    expect(screen.queryByTestId('avatar-menu-item-manage-posts')).toBeNull();
    expect(screen.queryByTestId('avatar-menu-item-admin-dashboard')).toBeNull();
    expect(screen.getByTestId('avatar-menu-item-manage-tags')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-menu-item-profile')).toBeInTheDocument();
    expect(screen.queryByText('[ ADMIN ]')).toBeNull();
  });

  it('mousedown outside container closes menu', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('avatar-menu-trigger'));
    expect(screen.getByTestId('avatar-menu-panel')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('avatar-menu-panel')).not.toBeInTheDocument();
  });

  it('avatar status dot present + pulses (animate-pulse-status class)', () => {
    renderMenu();
    const dot = screen.getByTestId('avatar-menu-status-dot');
    expect(dot).toHaveClass('animate-pulse-status');
    expect(dot).toHaveClass('bg-grn');
  });

  it('per-item color classes match design spec (Manage Posts=blu / Admin=pur / Tags=yel / Settings=grn / Profile=ts / Logout=red)', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('avatar-menu-trigger'));
    expect(screen.getByTestId('avatar-menu-item-manage-posts')).toHaveClass('text-blu');
    expect(screen.getByTestId('avatar-menu-item-admin-dashboard')).toHaveClass('text-pur');
    expect(screen.getByTestId('avatar-menu-item-manage-tags')).toHaveClass('text-yel');
    expect(screen.getByTestId('avatar-menu-item-system-settings')).toHaveClass('text-grn');
    expect(screen.getByTestId('avatar-menu-item-profile')).toHaveClass('text-ts');
    expect(screen.getByTestId('avatar-menu-item-logout')).toHaveClass('text-red');
  });
});
