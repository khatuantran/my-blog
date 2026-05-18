// E2E-01 — Auth flow: register → login → logout
import { test, expect } from '@playwright/test';
import { resetDb } from './_helpers/seed';
import { loginAs, logout } from './_helpers/auth';

test.describe('E2E-01 Auth', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('register new user → auto-authed → land on feed', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel('Username').fill('newuser');
    await page.getByLabel('Password').fill('pass1234');
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL('/');
    await expect(page.locator('[data-slot="topbar"]')).toBeVisible();
  });

  test('login as admin then logout returns to /auth/login', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL('/');
    await logout(page);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('login with wrong password shows error banner', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('wrong-pass');
    await page.getByRole('button', { name: /authenticate/i }).click();
    await expect(page.getByRole('alert')).toContainText(/error/i);
  });
});
