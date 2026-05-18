// E2E-12 — ⌘K command palette navigation
import { test, expect } from '@playwright/test';
import { resetDb } from './_helpers/seed';
import { loginAs } from './_helpers/auth';

test.describe('E2E-12 Command palette', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('⌘K → type "feed" → Enter → navigate /', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');

    // Open palette
    await page.keyboard.press('Meta+K');
    const input = page.getByPlaceholder(/type a command/i);
    await expect(input).toBeVisible();
    await input.fill('feed');
    await page.keyboard.press('Enter');
    await page.waitForURL('/');
  });

  test('Esc closes palette', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.keyboard.press('Meta+K');
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/type a command/i)).toHaveCount(0);
  });
});
