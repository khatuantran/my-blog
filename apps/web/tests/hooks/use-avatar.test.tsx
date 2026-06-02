import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createTestQueryClient } from '../_helpers/query-client';
import { useUploadAvatar, useRemoveAvatar } from '@/hooks/mutations/use-avatar';
import { useAuthStore } from '@/stores/auth-store';

vi.mock('@/services/api/avatar', () => ({
  uploadAvatarChain: vi.fn(async () => ({
    avatarUrl: 'https://cdn.example.com/new.jpg',
    avatarPublicId: 'myblog/avatars/new',
  })),
  removeAvatar: vi.fn(async () => ({ avatarUrl: null, avatarPublicId: null })),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  useAuthStore.setState({
    status: 'authed',
    user: {
      id: 'u1',
      username: 'kha',
      email: 'a@x.com',
      role: 'ADMIN',
      avatarUrl: 'https://cdn.example.com/OLD.jpg',
      avatarPublicId: 'myblog/avatars/old',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  });
});

describe('use-avatar', () => {
  it('regression BUG-036: upload cập nhật avatarUrl trong auth store (TopBar reflect ngay, không cần reload)', async () => {
    const { result } = renderHook(() => useUploadAvatar('kha'), { wrapper });
    result.current.mutate(new Blob(['x'], { type: 'image/jpeg' }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().user?.avatarUrl).toBe('https://cdn.example.com/new.jpg');
    expect(useAuthStore.getState().user?.avatarPublicId).toBe('myblog/avatars/new');
  });

  it('regression BUG-036: remove set avatarUrl về null trong auth store', async () => {
    const { result } = renderHook(() => useRemoveAvatar('kha'), { wrapper });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().user?.avatarUrl).toBeNull();
    expect(useAuthStore.getState().user?.avatarPublicId).toBeNull();
  });
});
