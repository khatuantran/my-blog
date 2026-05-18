import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: 1,
  reporter: CI ? [['html', { open: 'never' }], ['list']] : [['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: CI ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {},
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: CI
    ? [
        {
          command: 'pnpm --filter api dev',
          url: `${API_URL}/health`,
          timeout: 120_000,
          reuseExistingServer: !CI,
          env: { ALLOW_TEST_RESET: '1' },
        },
        {
          command: 'pnpm --filter web dev',
          url: BASE_URL,
          timeout: 120_000,
          reuseExistingServer: !CI,
        },
      ]
    : undefined,
});
