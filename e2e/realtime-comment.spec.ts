// E2E-13 — Comment hot-reload via WebSocket
// SKIPPED: depends M11 Socket.io gateway + FE useWebSocket hook (T-100..T-104 todo).
// Reopen khi M11 close.
import { test } from '@playwright/test';

test.describe('E2E-13 Realtime comment', () => {
  test.skip('comment fires WS event + 2nd tab live updates', () => {
    // TODO: implement after M11 realtime stack wired
  });
});
