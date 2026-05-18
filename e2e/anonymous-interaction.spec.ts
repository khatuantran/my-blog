// E2E-04 — Anonymous: view feed → like → comment as anon
import { test, expect, request as pwRequest } from '@playwright/test';
import { resetDb, E2E_USERS } from './_helpers/seed';

const API = process.env.E2E_API_URL ?? 'http://localhost:3001';

test.describe('E2E-04 Anonymous interaction', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
    // Admin seeds 1 post via API (no browser login mixed in)
    const ctx = await pwRequest.newContext();
    await ctx.post(`${API}/auth/login`, { data: E2E_USERS.admin });
    await ctx.post(`${API}/posts`, {
      data: { content: 'anon-target post', mood: 'HAPPY' },
    });
    await ctx.dispose();
  });

  test('anon xem feed + like + comment', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('anon-target post')).toBeVisible();

    // Like (heart button)
    const likeBtn = page.getByRole('button', { name: /like|♡|♥/i }).first();
    await likeBtn.click();

    // Open detail + comment as anon
    await page
      .getByRole('link', { name: /comment/i })
      .first()
      .click();
    await page.waitForURL(/\/post\//);

    await page.getByPlaceholder(/add a comment/i).fill('Hello from anon');
    // Anon name field shows up
    const anonName = page.getByPlaceholder(/your name|anon/i).first();
    if (await anonName.isVisible().catch(() => false)) {
      await anonName.fill('AnonE2E');
    }
    await page.getByRole('button', { name: /send|↵/i }).click();
    await expect(page.getByText('Hello from anon')).toBeVisible();
  });
});
