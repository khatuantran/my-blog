# Testing Strategy

> Comprehensive test plan cho monorepo MyBlog (FE Vite React + BE NestJS).
> Test Failure Rule + Regression Test rule (BẮT BUỘC): xem [CLAUDE.md > Testing Rules](../CLAUDE.md).
> FR mapping: [REQUIREMENTS.md > Traceability](./REQUIREMENTS.md).

## Test Pyramid

```
        ╱─────╲          ← E2E (10%) — Playwright
       ╱───────╲           cross-app user flow
      ╱─────────╲
     ╱───────────╲       ← Integration (30%) — Supertest (BE)
    ╱─────────────╲        HTTP + real DB
   ╱───────────────╲
  ╱─────────────────╲    ← Unit (60%) — Vitest (FE) + Jest (BE)
 ╱___________________╲     mock isolated
```

**Rationale:**
- Unit base lớn để feedback nhanh (CI < 30s per run)
- Integration test BE với real Postgres để catch issue Prisma + business logic
- E2E ít nhưng cover critical user journey end-to-end

## Stack Summary

| Layer | Tool | Where |
|-------|------|-------|
| FE unit | **Vitest** + React Testing Library + MSW (mock API) | `apps/web/src/**/*.test.ts(x)` |
| BE unit | **Jest** (NestJS default) | `apps/api/src/**/*.spec.ts` |
| BE integration | **Supertest** + Jest + real Postgres test DB | `apps/api/test/**/*.e2e-spec.ts` |
| E2E | **Playwright** (chromium) | `e2e/**/*.spec.ts` (root level) |
| Coverage | Vitest coverage v8 + Jest coverage | report uploaded to CI artifact |

---

## Unit Tests — Frontend (Vitest)

### Setup

- `apps/web/vitest.config.ts`:
  - `environment: 'jsdom'`
  - `setupFiles: './src/test-setup.ts'` (cleanup + MSW server start)
- Mock: `vi.mock()` cho services; MSW cho HTTP intercept

### Cover

- **Hooks** (`src/hooks/*`) — render với `@testing-library/react-hooks` hoặc renderHook from @testing-library/react
- **Services** (`src/services/*`) — pure logic test với mock fetch
- **Validators** (`src/lib/validators.ts`) — Zod schema parse positive + negative
- **Pure components** (`src/components/shared/*`) — render output, prop variations
- **Pages** (lite — chỉ smoke test, integration test thực qua E2E)

### File pattern

```
apps/web/src/
├── hooks/usePosts.ts
├── hooks/usePosts.test.ts          ← co-located
├── components/post/PostCard.tsx
├── components/post/PostCard.test.tsx
├── lib/validators.ts
└── lib/validators.test.ts
```

### Example

```ts
// apps/web/src/hooks/usePosts.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePosts } from './usePosts';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

test('usePosts fetches feed', async () => {
  const { result } = renderHook(() => usePosts({ mood: 'HAPPY' }), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(10);
});
```

### Coverage target

| Layer | Target |
|-------|--------|
| Validators (Zod) | 100% |
| Hooks | ≥ 80% |
| Services (api client, ws client) | ≥ 70% |
| Components quan trọng (PostCard, CommentItem, MoodBadge) | ≥ 70% |
| Layout components (TopBar, StatusBar) | ≥ 50% (visual stuff cover qua E2E) |

---

## Unit Tests — Backend (Jest)

### Setup

- `apps/api/jest.config.js`:
  - `testRegex: '.*\\.spec\\.ts$'`
  - `preset: 'ts-jest'`
- Mock Prisma: `jest.mock('@/prisma/prisma.service')` hoặc `prisma-mock` library

### Cover

- **Service methods** — business logic isolated với mocked Prisma
- **DTO validation** — class-validator manual trigger
- **Helpers** — pure function
- **Guards** (custom logic) — vd: RolesGuard check
- **Pipes** (custom) — vd: AnonymousIdPipe

### File pattern

```
apps/api/src/
├── posts/
│   ├── posts.service.ts
│   ├── posts.service.spec.ts       ← co-located
│   ├── posts.controller.ts
│   └── posts.controller.spec.ts
```

### Example

```ts
// apps/api/src/posts/posts.service.spec.ts
import { Test } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: { post: { findMany: jest.fn() } } },
      ],
    }).compile();
    service = module.get(PostsService);
    prisma = module.get(PrismaService);
  });

  it('lists posts with mood filter', async () => {
    prisma.post.findMany.mockResolvedValue([{ id: '1', mood: 'HAPPY' }] as any);
    const result = await service.list({ mood: 'HAPPY', page: 1, limit: 10 });
    expect(prisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { mood: 'HAPPY' },
      take: 10,
    }));
    expect(result.data).toHaveLength(1);
  });
});
```

### Coverage target

| Layer | Target |
|-------|--------|
| Service | ≥ 80% |
| Validators / DTOs | 100% |
| Helpers | ≥ 90% |
| Guards / Pipes / Filters / Interceptors | ≥ 70% |

---

## Integration Tests — Backend (Supertest)

### Setup

- `apps/api/test/jest-e2e.json` config riêng (Jest preset)
- Use **dedicated test Postgres** trong Docker (`postgres-test` service, port 5433, db `myblog_test`)
- Env var `DATABASE_URL_TEST` cho test runs
- `beforeAll`: `prisma migrate reset --force --skip-seed && pnpm tsx prisma/seed-test.ts`
- `beforeEach`: truncate volatile tables (Post, Comment, Like, ...) — KHÔNG truncate User để giữ admin seed

### Cover

- **Full HTTP request → response** flow
- Auth flow (register → login → use protected endpoint)
- DB state assertion sau mutation
- Error case (validation, 404, 403, 429)

### File pattern

```
apps/api/test/
├── jest-e2e.json
├── setup.ts                        global setup (DB reset, app init)
├── auth.e2e-spec.ts
├── posts.e2e-spec.ts
├── comments.e2e-spec.ts
├── likes.e2e-spec.ts
├── files.e2e-spec.ts
└── admin.e2e-spec.ts
```

### Example

```ts
// apps/api/test/posts.e2e-spec.ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app.module';

describe('Posts (e2e)', () => {
  let app, adminCookie;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();

    // Login admin
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin' });
    adminCookie = res.headers['set-cookie'];
  });

  it('POST /posts creates post (admin only)', async () => {
    const res = await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', adminCookie)
      .send({ content: 'hello', mood: 'HAPPY', tags: [], images: [], files: [] });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
  });

  it('POST /posts returns 403 for non-admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/posts')
      .send({ content: 'x', mood: 'HAPPY' });
    expect(res.status).toBe(401);  // chưa login
  });

  afterAll(async () => await app.close());
});
```

### Coverage target

- Mọi public endpoint có ≥ 1 happy path test
- Mọi endpoint với auth có ≥ 1 forbidden test
- Mọi endpoint với validation có ≥ 1 invalid input test

---

## E2E Tests (Playwright)

### Setup

- `playwright.config.ts` ở root level (monorepo)
- `baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173'`
- Run pre-script: start BE (Fly.io preview hoặc local with test DB) + FE dev server
- Browser: chromium (firefox/webkit defer)
- Use `storageState` cho login-persistent flows (avoid re-login per test)

### File structure

```
e2e/
├── playwright.config.ts
├── fixtures/
│   ├── admin-state.json            ← Playwright storageState sau login admin (cached)
│   ├── user-state.json
│   └── reset-db.ts                 helper to call `/test/reset` BE endpoint (dev only)
├── auth.spec.ts                    E2E-01
├── admin-create-post.spec.ts       E2E-02
├── admin-edit-delete.spec.ts       E2E-03
├── anonymous-interaction.spec.ts   E2E-04
├── save-post.spec.ts               E2E-05
├── filter.spec.ts                  E2E-06
├── share.spec.ts                   E2E-07
├── admin-moderate.spec.ts          E2E-08
├── admin-users-ban.spec.ts         E2E-09
├── admin-moderate-comment.spec.ts  E2E-10
├── file-upload-download.spec.ts    E2E-11
├── command-palette.spec.ts         E2E-12
└── realtime-comment.spec.ts        E2E-13
```

### Core Flow Catalog

| Flow ID | Title | File | Linked FR/UC |
|---------|-------|------|--------------|
| E2E-01 | Auth: register → login → logout | `auth.spec.ts` | FR-01, UC-09, UC-10 |
| E2E-02 | Admin: tạo bài (text + ảnh + mood + tag) → hiển thị feed | `admin-create-post.spec.ts` | FR-02, UC-01 |
| E2E-03 | Admin: edit + delete bài | `admin-edit-delete.spec.ts` | FR-02 |
| E2E-04 | Anonymous: xem feed → like → comment | `anonymous-interaction.spec.ts` | FR-03, FR-04, UC-02, UC-04 |
| E2E-05 | User auth: save bài + xem trang saved | `save-post.spec.ts` | FR-03.3, UC-05 |
| E2E-06 | Filter: theo mood + tag | `filter.spec.ts` | FR-04.3 |
| E2E-07 | Share: copy link + share social | `share.spec.ts` | FR-05, UC-06 |
| E2E-08 | Admin: xóa comment | `admin-moderate.spec.ts` | FR-03.4 |
| E2E-09 | Admin: ban/unban user | `admin-users-ban.spec.ts` | FR-01.5, FR-07.3, UC-08 |
| E2E-10 | Admin: moderate comment (approve/reject) | `admin-moderate-comment.spec.ts` | FR-07.4, UC-07 |
| E2E-11 | Admin: upload + download file attachment | `file-upload-download.spec.ts` | FR-06, UC-01 |
| E2E-12 | ⌘K command palette navigation | `command-palette.spec.ts` | FR-08, UC-12 |
| E2E-13 | Real-time: comment hot-reload qua WS | `realtime-comment.spec.ts` | FR-09, UC-11 |

> Thêm E2E flow mới khi có feature mới → update bảng này + sync vào CLAUDE.md > Testing Rules (chỉ link, không duplicate).

### Example

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('login with admin credentials', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[data-testid="username-input"]', 'admin');
  await page.fill('[data-testid="password-input"]', 'admin');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-testid="avatar-dropdown-trigger"]')).toBeVisible();
});

test('login with invalid creds shows error + shake', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[data-testid="username-input"]', 'admin');
  await page.fill('[data-testid="password-input"]', 'wrong');
  await page.click('[data-testid="login-submit"]');
  await expect(page.locator('[data-testid="login-error"]')).toContainText('invalid credentials');
});
```

### Data attribute convention

- All test-target element: `data-testid="<kebab-case-id>"`
- Naming: `<context>-<element>` (vd: `post-card`, `like-button`, `cmd-palette-input`)
- KHÔNG dùng class hoặc ARIA cho selector (volatile)

---

## Test Data Strategy

### Seed scripts

- `apps/api/prisma/seed.ts` — dev environment seed
  - 1 admin user (`admin` / `admin` từ env)
  - 5-10 sample posts với mix mood, image, file, tag
  - 1-2 auth user demo
  - 5-10 anonymous comments
- `apps/api/prisma/seed-test.ts` — test environment seed
  - 1 admin user (deterministic credentials)
  - 1 auth user (deterministic credentials)
  - 3 posts mỗi mood (21 posts total) để filter test
  - Tag set known
  - KHÔNG có anonymous sessions seed (test tự tạo)

### Factory pattern

Library: `faker.js` (`@faker-js/faker`) — tạo data động:

```ts
// apps/api/test/factories/post.factory.ts
import { faker } from '@faker-js/faker';
export const postFactory = (overrides = {}) => ({
  content: faker.lorem.paragraph(),
  mood: faker.helpers.arrayElement(['HAPPY', 'EXCITED', 'CALM']),
  tags: [`#${faker.lorem.word()}`],
  ...overrides,
});
```

### DB reset strategy per layer

| Layer | Strategy |
|-------|----------|
| Unit (FE) | Mock data inline; no DB |
| Unit (BE) | Mock Prisma; no DB |
| Integration (BE) | `beforeAll`: full reset + seed; `beforeEach`: truncate volatile tables |
| E2E | Pre-suite: full reset + seed; in-suite via test API `/test/reset` (dev/test env only) |

### Cloudinary in tests

- Integration test: dùng **test upload preset** Cloudinary (separate folder) OR mock Cloudinary SDK với in-memory
- E2E: dùng **MSW** hoặc Cloudinary mock server để intercept upload, return fake URL

### WebSocket in tests

- Integration test: `@nestjs/testing` + `socket.io-client` mock
- E2E: real WS connection từ Playwright với 2 browser context (1 trigger event, 1 observe)

---

## Coverage Targets (summary)

| Test type | Target |
|-----------|--------|
| FE Validators (Zod) | 100% |
| FE Services + Hooks | ≥ 70% |
| FE Components (key) | ≥ 70% |
| BE Service | ≥ 80% |
| BE DTOs / Validators | 100% |
| BE Helpers | ≥ 90% |
| BE Controller (integration) | 100% happy path + chính error case |
| E2E core flows | E2E-01 → E2E-13 must pass |

**Overall threshold:** > 75% line coverage, > 70% branch coverage (đo qua CI report).

---

## CI Pipeline

### GitHub Actions matrix

```yaml
# .github/workflows/test.yml (sẽ tạo khi setup)
jobs:
  fe-unit:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter web test:unit -- --coverage
      - upload-artifact coverage-fe

  be-unit:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter api test:unit -- --coverage
      - upload-artifact coverage-be

  be-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: myblog_test }
        ports: ['5433:5432']
    steps:
      - run: pnpm --filter api prisma migrate deploy
      - run: pnpm --filter api test:integration

  e2e:
    runs-on: ubuntu-latest
    needs: [fe-unit, be-unit, be-integration]
    steps:
      - install playwright browsers
      - start FE dev server + BE dev server (background)
      - run: pnpm test:e2e
      - upload-artifact playwright-report (screenshots + video on fail)
```

### Pre-commit (local)

- `husky` + `lint-staged`:
  - `eslint --fix` on staged
  - `prettier --write` on staged
  - `vitest related --run` for FE files changed
  - `jest --findRelatedTests --passWithNoTests` for BE files changed

### Block merge

CI must pass tất cả 4 jobs để merge `main`.

---

## Run Commands

```bash
# FE unit
pnpm --filter web test                  # watch mode
pnpm --filter web test:unit             # single run
pnpm --filter web test:coverage         # with coverage report

# BE unit
pnpm --filter api test                  # Jest watch
pnpm --filter api test:unit
pnpm --filter api test:coverage

# BE integration (requires Docker Postgres running)
pnpm --filter api test:integration

# E2E
pnpm test:e2e                           # headless
pnpm test:e2e:ui                        # Playwright UI mode
pnpm test:e2e:debug                     # debug 1 test với inspector

# All tests
pnpm test:all                           # CI-equivalent, run sequentially
```

---

## Templates

### Template thêm E2E flow mới

```markdown
| E2E-XX | <Title> | `<file.spec.ts>` | FR-XX, UC-YY |
```

### Template Test Failure Report (BẮT BUỘC khi test fail)

> Format đầy đủ ở [CLAUDE.md > Testing Rules > Test Failure Rule](../CLAUDE.md).

```
❌ TEST FAILED
- File: <path>:<line>
- Test: <test name>
- Error: <message>
- Stack: <relevant frames>
- Likely cause: [code-bug | test-stale-assumption | flaky | env | data-setup | dependency-change]
- Evidence: <log/screenshot>
- Proposed fix:
  - [ ] Option A: ...
  - [ ] Option B: ...
- Recommended: Option <X> vì <lý do>
```

### Template thêm Regression Test (cho bug fix)

```ts
it('regression BUG-XXX: <short description>', async () => {
  // Setup: reproduce condition gây bug
  ...
  // Act: trigger bug
  ...
  // Assert: KHÔNG còn bug (kết quả đúng)
  expect(...).toBe(...);
});
```
