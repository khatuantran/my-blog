import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { CommandPalette } from '@/components/command-palette/CommandPalette';

const navigateMock = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigateMock };
});

function renderCP(open = true, onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <MemoryRouter>
        <CommandPalette open={open} onClose={onClose} />
      </MemoryRouter>,
    ),
  };
}

beforeEach(() => {
  navigateMock.mockReset();
});

describe('CommandPalette', () => {
  it('returns null khi open=false', () => {
    renderCP(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('render dialog với input + groups khi open=true', () => {
    renderCP();
    expect(screen.getByRole('dialog', { name: /command palette/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
    expect(screen.getByText('// recent')).toBeInTheDocument();
    expect(screen.getByText('// navigate')).toBeInTheDocument();
    expect(screen.getByText('// actions')).toBeInTheDocument();
  });

  it('typing trong input filter results', async () => {
    const user = userEvent.setup();
    renderCP();
    const input = screen.getByPlaceholderText(/type a command/i);
    await user.type(input, 'admin');
    // "~/admin" navigate item + "admin dashboard" desc match
    expect(screen.getByText('~/admin')).toBeInTheDocument();
    expect(screen.queryByText('Toggle theme')).not.toBeInTheDocument();
  });

  it('empty state khi không match', async () => {
    const user = userEvent.setup();
    renderCP();
    await user.type(screen.getByPlaceholderText(/type a command/i), 'xyzzy123');
    expect(screen.getByText(/no results for/i)).toBeInTheDocument();
  });

  it('Esc key → onClose fired', () => {
    const { onClose } = renderCP();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('click Esc button → onClose fired', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCP();
    await user.click(screen.getByRole('button', { name: /esc/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('Enter key → navigate to selected command + onClose', () => {
    const { onClose } = renderCP();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(navigateMock).toHaveBeenCalledWith('/'); // first command "Go to feed" → /
    expect(onClose).toHaveBeenCalled();
  });

  it('ArrowDown moves selection xuống', () => {
    renderCP();
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('click item navigates + closes', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCP();
    await user.click(screen.getByText('Create new post'));
    expect(navigateMock).toHaveBeenCalledWith('/admin/create');
    expect(onClose).toHaveBeenCalled();
  });

  it('Saved nav entry routes /saved (T-234)', async () => {
    const user = userEvent.setup();
    renderCP();
    await user.click(screen.getByText('~/saved'));
    expect(navigateMock).toHaveBeenCalledWith('/saved');
  });

  it('Tags nav entry routes /tags (T-234)', async () => {
    const user = userEvent.setup();
    renderCP();
    await user.click(screen.getByText('~/tags'));
    expect(navigateMock).toHaveBeenCalledWith('/tags');
  });

  it('Profile nav entry routes /me (T-234)', async () => {
    const user = userEvent.setup();
    renderCP();
    await user.click(screen.getByText('~/profile'));
    expect(navigateMock).toHaveBeenCalledWith('/me');
  });

  it('Search recent entry fix routes /search (T-234)', async () => {
    const user = userEvent.setup();
    renderCP();
    await user.click(screen.getByText('Search posts'));
    expect(navigateMock).toHaveBeenCalledWith('/search');
  });
});
