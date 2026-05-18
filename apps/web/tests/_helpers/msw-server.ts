// MSW server setup cho Vitest hook/integration tests.
// Khởi tạo trong tests/setup.ts qua beforeAll/afterAll.

import { setupServer } from 'msw/node';

export const mswServer = setupServer();

export function startMswServer() {
  mswServer.listen({ onUnhandledRequest: 'error' });
}

export function resetMswHandlers() {
  mswServer.resetHandlers();
}

export function stopMswServer() {
  mswServer.close();
}
