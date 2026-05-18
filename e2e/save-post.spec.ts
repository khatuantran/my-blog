// E2E-05 — User save post → /me/saved hiển thị
import { test, expect } from '@playwright/test';
import { resetDb, E2E_USERS } from './_helpers/seed';
import { loginAs } from './_helpers/auth';

const API = process.env.E2E_API_URL ?? 'http://localhost:3001';

test.describe('E2E-05 Save post', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
    const ctx = await request.newContext();
    await ctx.post(`${API}/auth/login`, { data: E2E_USERS.admin });
    await ctx.post(`${API}/posts`, {
      data: { content: 'savable post', mood: 'CALM' },
    });
    await ctx.dispose();
  });

  test('user save post → API persists', async ({ page, request }) => {
    await loginAs(page, 'user');
    await page.goto('/');
    await expect(page.getByText('savable post')).toBeVisible();

    // Click save button
    await page
      .getByRole('button', { name: /save|🔖|⭐/i })
      .first()
      .click();

    // Verify via API as logged-in user — share cookies với browser context
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const saved = await request.get(`${API}/me/saved`, {
      headers: { cookie: cookieHeader },
    });
    expect(saved.ok()).toBeTruthy();
    const body = await saved.json();
    expect(body.items.length).toBeGreaterThan(0);
  });
});
