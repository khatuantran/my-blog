import type { Page } from '@playwright/test';
import { E2E_USERS } from './seed';

export async function loginAs(page: Page, role: 'admin' | 'user'): Promise<void> {
  const creds = E2E_USERS[role];
  await page.goto('/auth/login');
  await page.getByLabel('Username').fill(creds.username);
  await page.getByLabel('Password').fill(creds.password);
  await page.getByRole('button', { name: /authenticate/i }).click();
  // Wait until AppLayout shell renders (TopBar) — confirms session hydrated
  await page.locator('[data-slot="topbar"]').waitFor({ state: 'visible' });
}

export async function logout(page: Page): Promise<void> {
  await page.locator('[aria-label="User menu"]').click();
  await page.getByRole('menuitem', { name: /logout/i }).click();
  await page.waitForURL(/\/auth\/login/);
}
