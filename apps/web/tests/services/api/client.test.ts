import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { apiFetch, ApiError } from '@/services/api/client';
import { mswServer } from '../../_helpers/msw-server';

const API_URL = 'http://localhost:3001';

beforeEach(() => {
  mswServer.resetHandlers();
});

describe('apiFetch refresh interceptor', () => {
  it('happy path: 200 → trả data', async () => {
    mswServer.use(http.get(`${API_URL}/posts`, () => HttpResponse.json({ data: { ok: 1 } })));
    const r = await apiFetch<{ ok: number }>('/posts');
    expect(r).toEqual({ ok: 1 });
  });

  it('401 → refresh thành công → retry 1 lần → trả data', async () => {
    let calls = 0;
    mswServer.use(
      http.get(`${API_URL}/posts/secret`, () => {
        calls += 1;
        if (calls === 1) return HttpResponse.json({ error: { code: 'X' } }, { status: 401 });
        return HttpResponse.json({ data: { secret: 42 } });
      }),
      http.post(`${API_URL}/auth/refresh`, () => HttpResponse.json({ data: {} })),
    );

    const r = await apiFetch<{ secret: number }>('/posts/secret');
    expect(r).toEqual({ secret: 42 });
    expect(calls).toBe(2);
  });

  it('401 + refresh fail → throw ApiError 401', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/secret`, () =>
        HttpResponse.json({ error: { code: 'X' } }, { status: 401 }),
      ),
      http.post(`${API_URL}/auth/refresh`, () =>
        HttpResponse.json({ error: { code: 'NO_REFRESH' } }, { status: 401 }),
      ),
    );

    await expect(apiFetch('/posts/secret')).rejects.toBeInstanceOf(ApiError);
  });

  it('401 trên /auth/login → KHÔNG refresh (NO_REFRESH_PATHS)', async () => {
    let refreshCalls = 0;
    mswServer.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json({ error: { code: 'BAD_CREDS' } }, { status: 401 }),
      ),
      http.post(`${API_URL}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ data: {} });
      }),
    );

    await expect(
      apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({}) }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls).toBe(0);
  });

  it('concurrent 401s → chỉ 1 refresh in-flight (mutex)', async () => {
    let postCalls = 0;
    let refreshCalls = 0;
    mswServer.use(
      http.get(`${API_URL}/x`, () => {
        postCalls += 1;
        if (postCalls <= 2) return HttpResponse.json({ error: { code: 'X' } }, { status: 401 });
        return HttpResponse.json({ data: { n: postCalls } });
      }),
      http.post(`${API_URL}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ data: {} });
      }),
    );

    await Promise.all([apiFetch('/x'), apiFetch('/x')]);
    expect(refreshCalls).toBe(1);
  });
});
