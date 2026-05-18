// E2E-03 — Admin edit + delete post (via API; UI edit page is M11 scope)
import { test, expect } from '@playwright/test';
import { resetDb, E2E_USERS } from './_helpers/seed';

const API = process.env.E2E_API_URL ?? 'http://localhost:3001';

test.describe('E2E-03 Admin edit/delete post', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('admin tạo, PATCH edit, DELETE → post biến mất khỏi feed', async ({ page, request }) => {
    // Login via API for HTTP fixtures
    const login = await request.post(`${API}/auth/login`, { data: E2E_USERS.admin });
    expect(login.ok()).toBeTruthy();

    const created = await request.post(`${API}/posts`, {
      data: { content: 'before edit', mood: 'CALM' },
    });
    expect(created.ok()).toBeTruthy();
    const post = await created.json();

    const patched = await request.patch(`${API}/posts/${post.id}`, {
      data: { content: 'after edit' },
    });
    expect(patched.ok()).toBeTruthy();

    await page.goto(`/post/${post.id}`);
    await expect(page.getByText('after edit')).toBeVisible();

    const del = await request.delete(`${API}/posts/${post.id}`);
    expect(del.ok()).toBeTruthy();

    await page.goto('/');
    await expect(page.getByText('after edit')).toHaveCount(0);
  });
});
