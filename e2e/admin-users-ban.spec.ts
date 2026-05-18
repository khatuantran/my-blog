// E2E-09 — Admin ban/unban user via UsersTable
import { test, expect } from '@playwright/test';
import { resetDb } from './_helpers/seed';
import { loginAs } from './_helpers/auth';

test.describe('E2E-09 Admin ban/unban', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('admin click Ban trên USER → role flips → Unban appears', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');

    const row = page.locator('[data-testid="user-row-user"]');
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /^ban/i }).click();

    // After mutation invalidate, row updates
    await expect(row.getByRole('button', { name: /^unban/i })).toBeVisible();
  });
});
