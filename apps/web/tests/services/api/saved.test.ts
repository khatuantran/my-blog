import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { listSavedPosts, togglePostSave } from '@/services/api/saved';
import { mswServer } from '../../_helpers/msw-server';

const API = 'http://localhost:3001';

describe('services/api/saved', () => {
  it('togglePostSave POSTs to /posts/:id/save and returns body', async () => {
    mswServer.use(http.post(`${API}/posts/abc/save`, () => HttpResponse.json({ saved: true })));
    const res = await togglePostSave('abc');
    expect(res).toEqual({ saved: true });
  });

  it('listSavedPosts() with no params hits /me/saved', async () => {
    let captured: URL | null = null;
    mswServer.use(
      http.get(`${API}/me/saved`, ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({ items: [], total: 0, page: 1, limit: 20 });
      }),
    );
    const res = await listSavedPosts();
    expect(res.items).toEqual([]);
    expect(captured).not.toBeNull();
    expect(captured!.search).toBe('');
  });

  it('listSavedPosts(page, limit) appends query params', async () => {
    let captured: URL | null = null;
    mswServer.use(
      http.get(`${API}/me/saved`, ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({ items: [], total: 0, page: 2, limit: 5 });
      }),
    );
    await listSavedPosts({ page: 2, limit: 5 });
    expect(captured!.searchParams.get('page')).toBe('2');
    expect(captured!.searchParams.get('limit')).toBe('5');
  });
});
