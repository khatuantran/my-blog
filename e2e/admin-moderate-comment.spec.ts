// E2E-10 — Admin approve/reject comment queue
// SKIPPED: AdminPage placeholder "// pending moderation queue · wire khi BE admin
// cross-post endpoint sẵn" — UI chưa có. BE cũng chưa có GET /admin/comments.
import { test } from '@playwright/test';

test.describe('E2E-10 Admin moderate queue', () => {
  test.skip('approve/reject pending comments', () => {
    // TODO: implement khi admin comments queue UI wire
  });
});
