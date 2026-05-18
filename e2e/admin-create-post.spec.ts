// E2E-02 — Admin create post (text + mood + tag) → hiển thị feed
import { test, expect } from '@playwright/test';
import { resetDb } from './_helpers/seed';
import { loginAs } from './_helpers/auth';

test.describe('E2E-02 Admin create post', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('admin tạo post mới với mood + tag, hiển thị trên feed', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/create');

    // Pick mood HAPPY
    await page.getByRole('radio', { name: /happy/i }).click();

    // Type content
    const contentBody = `E2E-02 post #${Date.now()}`;
    await page.getByRole('textbox', { name: /content/i }).fill(contentBody);

    // Add tag
    const tagInput = page.locator('input[placeholder*="tag" i]').first();
    await tagInput.fill('e2e-tag');
    await tagInput.press('Enter');

    // Publish (⌘↵ or button)
    await page.getByRole('button', { name: /publish/i }).click();

    // Navigate to /post/:id automatically; back to feed assert visible
    await page.waitForURL(/\/post\/[a-z0-9-]+/i, { timeout: 10_000 });
    await page.goto('/');
    await expect(page.getByText(contentBody)).toBeVisible();
  });
});
