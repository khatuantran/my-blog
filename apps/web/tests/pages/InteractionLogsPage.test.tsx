import { Suspense } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { routes } from '@/routes';
import { mswServer } from '../_helpers/msw-server';
import { createTestQueryClient } from '../_helpers/query-client';
import { useAuthStore } from '@/stores/auth-store';
import type { InteractionLog } from '@/types/api';

const API = 'http://localhost:3001';

function makeLog(overrides: Partial<InteractionLog> = {}): InteractionLog {
  return {
    id: 'log-1',
    action: 'COMMENT',
    targetType: 'POST',
    targetId: 'post-abc123',
    postId: 'post-abc123',
    actor: null,
    actorRole: null,
    anonymousId: '0xAAA111',
    ip: '203.0.113.10',
    userAgent: 'Mozilla/5.0',
    browser: 'Chrome 120',
    os: 'macOS',
    device: 'desktop',
    acceptLang: 'vi-VN',
    referer: null,
    geoCountry: null,
    geoCity: null,
    fingerprint: 'a1b2c3d4e5f6a7b8',
    metadata: null,
    createdAt: '2026-05-31T10:00:00.000Z',
    ...overrides,
  };
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes as RouteObject[], { initialEntries: [path] });
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <Suspense fallback={<div>loading…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>,
  );
}

function setAdmin() {
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
}

beforeEach(() => {
  useAuthStore.getState().clear?.();
  mswServer.use(
    http.get(`${API}/admin/interaction-logs`, () =>
      HttpResponse.json({
        data: {
          items: [
            makeLog({ id: 'log-anon', action: 'COMMENT', anonymousId: '0xAAA111' }),
            makeLog({
              id: 'log-user',
              action: 'POST_REACTION',
              actor: { id: 'u1', username: 'alice' },
              actorRole: 'USER',
              anonymousId: null,
              ip: '::ffff:198.51.100.5',
              geoCountry: 'US',
              geoCity: 'Mountain View',
            }),
          ],
          total: 2,
          page: 1,
          limit: 20,
        },
      }),
    ),
  );
});

// Note: admin-gating (non-admin redirect) cover qua ProtectedRoute + BE e2e 403 +
// AvatarMenu adminOnly. KHÔNG test redirect ở đây vì navigation trigger lỗi env
// undici/AbortSignal (giống 3 ManagePostsPage test) — không phải lỗi code.
describe('InteractionLogsPage (FR-18)', () => {
  it('admin → render rows + total + anon/user actor + action badge', async () => {
    setAdmin();
    renderAt('/admin/logs');
    await waitFor(() => expect(screen.getByTestId('logs-table')).toBeInTheDocument());
    expect(screen.getByTestId('log-row-log-anon')).toBeInTheDocument();
    expect(screen.getByTestId('log-row-log-user')).toBeInTheDocument();
    expect(screen.getByTestId('logs-total')).toHaveTextContent('2 logs');
    // anon actor cell + user actor cell
    expect(screen.getByText(/anon · 0xAAA111/)).toBeInTheDocument();
    expect(screen.getByText('~/alice')).toBeInTheDocument();
    // action badges render
    expect(screen.getByText('COMMENT')).toBeInTheDocument();
    expect(screen.getByText('POST_REACTION')).toBeInTheDocument();
    // geo hiển thị + IP strip prefix ::ffff:
    expect(screen.getByText(/🌐 US · Mountain View/)).toBeInTheDocument();
    expect(screen.getByText('198.51.100.5')).toBeInTheDocument();
    // search input
    expect(screen.getByLabelText('Search logs')).toBeInTheDocument();
  });

  it('admin → empty state khi không có log', async () => {
    setAdmin();
    mswServer.use(
      http.get(`${API}/admin/interaction-logs`, () =>
        HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 20 } }),
      ),
    );
    renderAt('/admin/logs');
    await waitFor(() => expect(screen.getByText(/no logs matching filters/i)).toBeInTheDocument());
  });
});
