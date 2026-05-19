import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditProfileDrawer } from '@/components/profile/EditProfileDrawer';
import { mswServer } from '../../_helpers/msw-server';
import type { ProfileUser } from '@/types/api';

const API = 'http://localhost:3001';

const USER: ProfileUser = {
  id: 'u-alice',
  username: 'alice',
  email: null,
  role: 'USER',
  avatarUrl: null,
  title: 'Dev',
  bio: 'hi',
  skills: [{ name: 'TS', color: '#7DCFFF' }],
  createdAt: '2026-05-01T00:00:00.000Z',
};

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('EditProfileDrawer (T-222, FR-11.3)', () => {
  it('open=false → null', () => {
    const { container } = wrap(<EditProfileDrawer open={false} user={USER} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders pre-filled title/bio + skills + close button', () => {
    wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: /edit profile/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dev')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hi')).toBeInTheDocument();
    expect(screen.getByText('TS')).toBeInTheDocument();
  });

  it('Esc → onClose fired', () => {
    const onClose = vi.fn();
    wrap(<EditProfileDrawer open user={USER} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('Save profile → PATCH /users/:id + onClose', async () => {
    let patched: { id?: string; body?: unknown } = {};
    mswServer.use(
      http.patch(`${API}/users/:id`, async ({ request, params }) => {
        patched = { id: params.id as string, body: await request.json() };
        return HttpResponse.json({ ...USER, title: 'New Title' });
      }),
    );
    const onClose = vi.fn();
    wrap(<EditProfileDrawer open user={USER} onClose={onClose} />);
    const titleInput = screen.getByDisplayValue('Dev');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));
    await waitFor(() => expect(patched.id).toBe('u-alice'));
    expect(patched.body).toMatchObject({ title: 'New Title' });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('Change password — confirm mismatch → inline error', async () => {
    wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'old' },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'new-secret-8' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'mismatch' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/không khớp/i));
  });

  it('Change password — POST /auth/change-password 200 → "password changed" ok banner', async () => {
    mswServer.use(http.post(`${API}/auth/change-password`, () => HttpResponse.json({ ok: true })));
    wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'old' },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'new-secret-8' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'new-secret-8' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    await waitFor(() => expect(screen.getByText(/password changed/i)).toBeInTheDocument());
  });
});
