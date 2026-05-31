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

// jsdom polyfills cho ProseMirror/TipTap (T-435) — jsdom thiếu geometry API mà
// prosemirror-view + Placeholder viewport tracking gọi khi mount editor.
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null;
}
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () =>
    ({ length: 0, item: () => null }) as unknown as DOMRectList;
}
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = () =>
    ({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }) as DOMRect;
}
