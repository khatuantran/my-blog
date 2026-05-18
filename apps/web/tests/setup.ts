import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { resetMswHandlers, startMswServer, stopMswServer } from './_helpers/msw-server';
import { useAuthStore } from '@/stores/auth-store';

beforeAll(() => startMswServer());
afterEach(() => resetMswHandlers());
afterAll(() => stopMswServer());

// Default: authed admin (giữ behavior tương đương useAuth stub trước M10).
// Tests cần guest/hydrating override qua useAuthStore.setState().
beforeEach(() => {
  useAuthStore.setState({
    status: 'authed',
    user: {
      id: 'stub-admin',
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      avatarUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  });
});

// jsdom polyfills cho upload flow (URL.createObjectURL không có default)
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock';
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}
