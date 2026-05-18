// E2E-06 — Filter feed theo mood
import { test, expect } from '@playwright/test';
import { resetDb, E2E_USERS } from './_helpers/seed';

const API = process.env.E2E_API_URL ?? 'http://localhost:3001';

test.describe('E2E-06 Filter feed', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
    const ctx = await request.newContext();
    await ctx.post(`${API}/auth/login`, { data: E2E_USERS.admin });
    await ctx.post(`${API}/posts`, { data: { content: 'happy one', mood: 'HAPPY' } });
    await ctx.post(`${API}/posts`, { data: { content: 'sad one', mood: 'SAD' } });
    await ctx.dispose();
  });

  test('click mood SAD → chỉ post SAD hiển thị', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('happy one')).toBeVisible();
    await expect(page.getByText('sad one')).toBeVisible();

    await page.getByRole('button', { name: /sad/i }).first().click();
    await expect(page.getByText('sad one')).toBeVisible();
    await expect(page.getByText('happy one')).toHaveCount(0);
  });
});
