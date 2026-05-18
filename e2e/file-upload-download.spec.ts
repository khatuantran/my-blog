// E2E-11 — Upload + download file attachment
// SKIPPED: Cloudinary 2-step direct upload requires real CLOUDINARY_* env trên BE
// + outbound HTTPS tới Cloudinary CDN. Không phù hợp E2E deterministic suite.
// Cover qua BE integration test files.e2e-spec.ts (sign endpoint) thay vì.
import { test } from '@playwright/test';

test.describe('E2E-11 File upload + download', () => {
  test.skip('upload PDF + download attachment', () => {
    // TODO: stub Cloudinary endpoint hoặc dùng mock provider trong M14
  });
});
