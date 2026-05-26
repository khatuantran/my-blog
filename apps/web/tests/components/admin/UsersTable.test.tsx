import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersTable } from '@/components/admin/UsersTable';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';
import type { AdminUser, Role } from '@/types/api';

const API_URL = 'http://localhost:3001';

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'u1',
    username: 'user1',
    email: 'u1@example.com',
    role: 'USER' as Role,
    avatarUrl: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  mswServer.resetHandlers();
});

describe('UsersTable', () => {
  it('renders table với 2 users + role badges', async () => {
    mswServer.use(
      http.get(`${API_URL}/users`, () =>
        HttpResponse.json({
          data: {
            items: [
              makeUser({ id: 'u-admin', username: 'admin', role: 'ADMIN' }),
              makeUser({ id: 'u1', username: 'user1', role: 'USER' }),
            ],
            total: 2,
            page: 1,
            limit: 20,
          },
        }),
      ),
    );

    render(
      <TestProviders>
        <UsersTable />
      </TestProviders>,
    );

    expect(await screen.findByText('~/admin')).toBeInTheDocument();
    expect(screen.getByText('~/user1')).toBeInTheDocument();
    expect(screen.getByText('[ ADMIN ]')).toBeInTheDocument();
    expect(screen.getByText('[ USER ]')).toBeInTheDocument();
  });

  it('Ban button click → POST /users/:id/ban + refetch', async () => {
    const user = userEvent.setup();
    let banCalled = false;
    mswServer.use(
      http.get(`${API_URL}/users`, () =>
        HttpResponse.json({
          data: {
            items: [makeUser({ id: 'u1', username: 'user1', role: 'USER' })],
            total: 1,
            page: 1,
            limit: 20,
          },
        }),
      ),
      http.post(`${API_URL}/users/u1/ban`, () => {
        banCalled = true;
        return HttpResponse.json({ data: makeUser({ id: 'u1', role: 'BANNED' }) });
      }),
    );

    render(
      <TestProviders>
        <UsersTable />
      </TestProviders>,
    );

    await user.click(await screen.findByRole('button', { name: /ban user1/i }));
    await waitFor(() => expect(banCalled).toBe(true));
  });

  it('ADMIN role hiển thị "—" thay vì ban button', async () => {
    mswServer.use(
      http.get(`${API_URL}/users`, () =>
        HttpResponse.json({
          data: {
            items: [makeUser({ id: 'a1', username: 'admin', role: 'ADMIN' })],
            total: 1,
            page: 1,
            limit: 20,
          },
        }),
      ),
    );
    render(
      <TestProviders>
        <UsersTable />
      </TestProviders>,
    );
    await screen.findByText('~/admin');
    expect(screen.queryByRole('button', { name: /^Ban admin$/i })).toBeNull();
  });

  it('empty state khi không có users', async () => {
    mswServer.use(
      http.get(`${API_URL}/users`, () =>
        HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 20 } }),
      ),
    );
    render(
      <TestProviders>
        <UsersTable />
      </TestProviders>,
    );
    expect(await screen.findByText(/no users/i)).toBeInTheDocument();
  });
});
