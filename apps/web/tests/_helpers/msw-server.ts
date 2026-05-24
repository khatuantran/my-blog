// MSW server setup cho Vitest hook/integration tests.
// Khởi tạo trong tests/setup.ts qua beforeAll/afterAll.

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Default handlers — survive resetHandlers() — cho endpoints rendered trong AppLayout.
// Tests override bằng mswServer.use(...) trong beforeEach/test.
const defaultHandlers = [
  http.get('http://localhost:3001/notifications/unread-count', () =>
    HttpResponse.json({ data: { count: 0 } }),
  ),
  http.get('http://localhost:3001/notifications', () =>
    HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 10, unreadCount: 0 } }),
  ),
];

export const mswServer = setupServer(...defaultHandlers);

export function startMswServer() {
  mswServer.listen({ onUnhandledRequest: 'error' });
}

export function resetMswHandlers() {
  mswServer.resetHandlers();
}

export function stopMswServer() {
  mswServer.close();
}
