import type { APIRequestContext } from '@playwright/test';

export const E2E_USERS = {
  admin: { username: 'admin', password: 'admin1234' },
  user: { username: 'user', password: 'user1234' },
} as const;

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001';

/** Truncate BE DB + reseed fixtures via POST /admin/test-reset. */
export async function resetDb(request: APIRequestContext): Promise<void> {
  const res = await request.post(`${API_URL}/admin/test-reset`);
  if (!res.ok()) {
    throw new Error(`resetDb failed: ${res.status()} — ensure BE chạy với ALLOW_TEST_RESET=1`);
  }
}
