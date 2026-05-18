import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '@/stores/auth-store';
import { mswServer } from '../_helpers/msw-server';

const API_URL = 'http://localhost:3001';

const FAKE_USER = {
  id: 'u1',
  username: 'kha',
  email: 'kha@x.com',
  role: 'USER' as const,
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.setState({ status: 'idle', user: null });
});

describe('useAuthStore', () => {
  it('hydrate success → status=authed + user set', async () => {
    mswServer.use(http.get(`${API_URL}/auth/me`, () => HttpResponse.json({ data: FAKE_USER })));
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().status).toBe('authed');
    expect(useAuthStore.getState().user?.username).toBe('kha');
  });

  it('hydrate 401 → status=guest + user=null', async () => {
    mswServer.use(
      http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json({ error: { code: 'UNAUTH' } }, { status: 401 }),
      ),
      // Refresh attempt cũng 401 (chưa login)
      http.post(`${API_URL}/auth/refresh`, () =>
        HttpResponse.json({ error: { code: 'NO_REFRESH' } }, { status: 401 }),
      ),
    );
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().status).toBe('guest');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setUser → status=authed', () => {
    useAuthStore.getState().setUser(FAKE_USER);
    expect(useAuthStore.getState().status).toBe('authed');
    expect(useAuthStore.getState().user).toEqual(FAKE_USER);
  });

  it('clear → status=guest + user=null', () => {
    useAuthStore.setState({ status: 'authed', user: FAKE_USER });
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().status).toBe('guest');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('concurrent hydrate calls → dedupe (1 in-flight)', async () => {
    let count = 0;
    mswServer.use(
      http.get(`${API_URL}/auth/me`, () => {
        count += 1;
        return HttpResponse.json({ data: FAKE_USER });
      }),
    );
    await Promise.all([useAuthStore.getState().hydrate(), useAuthStore.getState().hydrate()]);
    // Second call returns immediately since first already hydrating.
    expect(count).toBeLessThanOrEqual(1);
  });
});
