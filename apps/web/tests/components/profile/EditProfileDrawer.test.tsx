import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { ToastProvider } from '@/components/shared/Toast';
import { EditProfileDrawer } from '@/components/profile/EditProfileDrawer';
import { mswServer } from '../../_helpers/msw-server';
import { NEON_COLORS } from '@/lib/tag-colors';
import type { ProfileUser } from '@/types/api';

// react-easy-crop hangs trong jsdom (uses requestAnimationFrame + image-orientation).
// Mock entire AvatarUploadModal — simple stub renders test marker khi open=true.
vi.mock('@/components/profile/AvatarUploadModal', () => ({
  AvatarUploadModal: ({
    open,
    imageSrc,
    onClose,
    onSuccess,
  }: {
    open: boolean;
    imageSrc: string | null;
    onClose: () => void;
    onSuccess: (r: { avatarUrl: string | null; avatarPublicId: string | null }) => void;
  }) => {
    if (!open || !imageSrc) return null;
    return (
      <div data-testid="avatar-upload-modal-mock">
        <button onClick={onClose} data-testid="mock-modal-close">
          close
        </button>
        <button
          onClick={() =>
            onSuccess({
              avatarUrl: 'https://res.cloudinary.com/demo/v1/avatars/u1-new.jpg',
              avatarPublicId: 'avatars/u1-new',
            })
          }
          data-testid="mock-modal-success"
        >
          fake-upload
        </button>
      </div>
    );
  },
}));

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
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ToastProvider>{ui}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EditProfileDrawer (T-376, T-222, FR-11.3)', () => {
  it('open=false → no dialog rendered', () => {
    wrap(<EditProfileDrawer open={false} user={USER} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog', { name: /edit profile/i })).toBeNull();
  });

  it('T-376: renders all 4 section headers', () => {
    wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);
    expect(screen.getByText('// basic.info')).toBeInTheDocument();
    expect(screen.getByText('// contact.links')).toBeInTheDocument();
    expect(screen.getByText('// skills.stack')).toBeInTheDocument();
    expect(screen.getByText('// security')).toBeInTheDocument();
  });

  it('FR-11.9: basic.info pre-fills title + bio; handle editable (= username, không @)', () => {
    wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue('Dev')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hi')).toBeInTheDocument();
    // F2 amend (FR-11.9): handle giờ EDIT được — value 'alice' (không @, @ là prefix span), không readonly.
    const handle = screen.getByLabelText(/handle \(username\)/i);
    expect(handle).toHaveValue('alice');
    expect(handle).not.toHaveAttribute('readonly');
  });

  it('T-376: contact.links section renders location + born year + github + website fields', () => {
    wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Born year')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
    expect(screen.getByLabelText('Website')).toBeInTheDocument();
  });

  it('T-376: SkillChipInput uses NEON_COLORS — new skill chip added correctly', () => {
    wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);
    const addInput = screen.getByLabelText(/add skill/i);
    fireEvent.change(addInput, { target: { value: 'React' } });
    fireEvent.keyDown(addInput, { key: 'Enter' });
    expect(screen.getByText('React')).toBeInTheDocument();
    // Verify NEON_COLORS export has 8 entries (8-cycle palette)
    expect(NEON_COLORS).toHaveLength(8);
  });

  it('Esc → onClose fired', () => {
    const onClose = vi.fn();
    wrap(<EditProfileDrawer open user={USER} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('T-376: ✓ Save Changes button → PATCH /users/:id + onClose', async () => {
    let patched: { id?: string; body?: unknown } = {};
    mswServer.use(
      http.patch(`${API}/users/:id`, async ({ request, params }) => {
        patched = { id: params.id as string, body: await request.json() };
        return HttpResponse.json({ ...USER, title: 'New Title' });
      }),
    );
    const onClose = vi.fn();
    wrap(<EditProfileDrawer open user={USER} onClose={onClose} />);
    fireEvent.change(screen.getByDisplayValue('Dev'), { target: { value: 'New Title' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
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

  it('regression BUG-009: header shows 2-line title (// edit.profile + ~/settings/profile subline) + Save Changes is filled solid cyan', () => {
    wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);

    // 2-line header per design-file Profile.html L370-374
    expect(screen.getByText('// edit.profile')).toBeInTheDocument();
    expect(screen.getByText('~/settings/profile')).toBeInTheDocument();

    // Save Changes = filled solid cyan (NOT outline) per design L426-428
    const saveBtn = screen.getByTestId('save-changes-btn');
    expect(saveBtn.className).toMatch(/bg-cyan(?!\/)/); // bg-cyan (not bg-cyan/10)
    expect(saveBtn.className).toMatch(/text-\[#0A0E1A\]/); // dark text on cyan bg
    expect(saveBtn.className).toMatch(/font-semibold/);
    expect(saveBtn.className).toMatch(/shadow-\[/); // has shadow glow
  });

  it('regression BUG-009: Field labels are UPPERCASE via CSS (design L60 .edit-lbl)', () => {
    wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);
    // Label text in JSX is natural case but CSS applies uppercase
    const handleLabelDiv = screen.getByText(/^handle$/i);
    expect(handleLabelDiv.className).toMatch(/uppercase/);
    expect(handleLabelDiv.className).toMatch(/tracking-\[0\.05em\]/);
  });

  describe('T-412 // avatar section (FR-11.7)', () => {
    it('renders // avatar section header + Upload button + Profile photo label', () => {
      wrap(<EditProfileDrawer open user={USER} onClose={vi.fn()} />);
      expect(screen.getByText('// avatar')).toBeInTheDocument();
      expect(screen.getByText(/profile photo/i)).toBeInTheDocument();
      expect(screen.getByTestId('avatar-upload-btn')).toBeInTheDocument();
    });

    it('× Remove button hidden khi avatarUrl null', () => {
      wrap(<EditProfileDrawer open user={{ ...USER, avatarUrl: null }} onClose={vi.fn()} />);
      expect(screen.queryByTestId('avatar-remove-btn')).toBeNull();
    });

    it('× Remove button visible khi avatarUrl present', () => {
      wrap(
        <EditProfileDrawer
          open
          user={{ ...USER, avatarUrl: 'https://res.cloudinary.com/demo/v1/x.jpg' }}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByTestId('avatar-remove-btn')).toBeInTheDocument();
    });

    it('× Remove click → ConfirmDialog mở → confirm → DELETE /users/me/avatar', async () => {
      let deleteCalled = false;
      mswServer.use(
        http.delete('http://localhost:3001/users/me/avatar', () => {
          deleteCalled = true;
          return HttpResponse.json({ avatarUrl: null, avatarPublicId: null });
        }),
      );
      wrap(
        <EditProfileDrawer
          open
          user={{ ...USER, avatarUrl: 'https://res.cloudinary.com/demo/v1/x.jpg' }}
          onClose={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByTestId('avatar-remove-btn'));
      // ConfirmDialog appear
      expect(screen.getByText(/remove avatar\?/i)).toBeInTheDocument();
      const confirmBtn = screen.getByRole('button', { name: /confirm remove/i });
      fireEvent.click(confirmBtn);
      await waitFor(() => expect(deleteCalled).toBe(true));
    });
  });
});
