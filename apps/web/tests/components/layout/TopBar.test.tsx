import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { TopBar } from '@/components/layout/TopBar';

function renderTopBar(onOpen = vi.fn()) {
  return {
    onOpen,
    ...render(
      <MemoryRouter>
        <TopBar onOpenCommandPalette={onOpen} />
      </MemoryRouter>,
    ),
  };
}

describe('TopBar', () => {
  it('renders logo + search input + version badge + avatar', () => {
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

  it('click avatar → dropdown menu hiển thị với 5 items', async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('[ ADMIN ]')).toBeInTheDocument();
  });

  it('click outside dropdown → menu đóng lại', async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Create Post')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Create Post')).not.toBeInTheDocument();
  });

  it('avatar dropdown hiển thị username và admin badge', async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('~/admin')).toBeInTheDocument();
  });
});
