# Progress Tracker

## Trạng thái tổng: 🟡 Docs Foundation Phase

## Milestone

| #   | Milestone                                                                         | Trạng thái            | Ngày target |
| --- | --------------------------------------------------------------------------------- | --------------------- | ----------- |
| M1  | Setup SDD docs v2 (cyberpunk + monorepo stack)                                    | ✅ Done               | 2026-05-17  |
| M2  | Monorepo scaffold (Turborepo + Docker + apps skeleton)                            | ✅ Done               | 2026-05-17  |
| M3  | Backend NestJS — Auth (JWT) + Users + Prisma schema                               | ✅ Done               | 2026-05-17  |
| M4  | Backend — Posts + Files (Cloudinary signed upload) + Tags                         | ✅ Done               | 2026-05-18  |
| M5  | Backend — Comments + Likes + CommentLikes + Saved                                 | ✅ Done               | 2026-05-18  |
| M6  | Backend — Admin endpoints (stats, users, moderation) + WebSocket gateway          | ✅ Done (partial 2/4) | 2026-05-18  |
| M7  | Frontend — Layout (TopBar, StatusBar, CommandPalette)                             | ✅ Done               | 2026-05-18  |
| M8  | Frontend — Feed + Post Detail (ImageCarousel + file download)                     | ⬜ Todo               |             |
| M9  | Frontend — Create Post + Admin Dashboard                                          | ⬜ Todo               |             |
| M10 | Frontend — Login + auth flow + protected routes                                   | ⬜ Todo               |             |
| M11 | Real-time integration (Socket.io client + activity log + live visitors)           | ⬜ Todo               |             |
| M12 | Testing — unit (FE Vitest + BE Jest) + integration (Supertest) + E2E (Playwright) | ⬜ Todo               |             |
| M13 | Deploy — Vercel FE + Fly.io BE + Neon DB + CI/CD GitHub Actions                   | ⬜ Todo               |             |
| M14 | Monitoring + observability (Sentry + Fly metrics + alert rules)                   | ⬜ Todo               |             |

## Tỉ lệ hoàn thành: 50% (7/14 milestone)

> ⬜ Todo | 🟡 Doing | ✅ Done | 🔴 Blocked

---

## Weekly Log

### 2026-05-17 (Week 1)

- **Done:**
  - SDD docs v2 restructure hoàn tất:
    - REQUIREMENTS.md với Vision + Personas + Use Cases (UC-01→UC-12) + Glossary + FR-01→FR-09 + NFR + Traceability matrix
    - ARCHITECTURE.md với C4 diagrams + 8 ADRs (Turborepo, NestJS, React Router v7, Socket.io, Prisma, JWT cookie, Fly.io, OpenAPI auto-gen) + Security policy + Operations runbook
    - DATA_MODEL.md với 14 entities (added File, CommentLike, PostView, AnonymousSession, RefreshToken) + 4 enums + Prisma schema snippet + indexing strategy
    - API_CONTRACT.md narrative + WebSocket events catalog + link `contracts/openapi.yaml` placeholder
    - UI_DESIGN.md 5 screens chi tiết theo cyberpunk design source (Feed/Post Detail/Create Post/Admin/Login)
    - DESIGN_SYSTEM.md dark-only cyberpunk theme: tokens (10 color layers + 7 typography + 4px spacing + radius + shadow + motion) + ~25 components + patterns + Mood/File color maps
    - CODING_CONVENTION.md split Universal/Frontend/Backend + Security & Performance checklists
    - TESTING_STRATEGY.md test pyramid + Vitest/Jest/Supertest/Playwright + 13 E2E flows catalog + data strategy
    - DEPLOYMENT.md Local Docker Compose + Vercel + Fly.io + Neon + env matrix + CI/CD plan
    - CLAUDE.md update (sẽ làm tiếp)
    - PROGRESS.md, TASKS.md, BUGS.md, CHANGELOG.md, INDEX.md update
    - Removed docs/PROMPT.md (obsolete spec, REQUIREMENTS.md mới thay thế)
    - Renamed: DATABASE_SCHEMA → DATA_MODEL, API → API_CONTRACT
    - Created: docs/contracts/openapi.yaml placeholder, root README + .env.example
- **Done (M2 complete ✅):**
  - Tách env per-app: `apps/api/.env.example` + `apps/web/.env.example` (root xóa)
  - Init git repository (branch `main`) + `.gitignore` (ignore `design-file/` reference-only)
  - **T-002** Monorepo skeleton: `package.json` + `pnpm-workspace.yaml` + `turbo.json` + `.npmrc` + `.nvmrc` (Node 24 LTS) + `packages/`. Turbo 2.9.14, pnpm 9.15.0
  - **T-003** `docker-compose.yml`: postgres-main (persistent) + postgres-test (tmpfs) + healthcheck
  - **T-004** Scaffold `apps/api` NestJS skeleton (main + common + config Zod + prisma nestjs-prisma + Swagger). NestJS 10.4, Prisma 5.22
  - **T-005** Scaffold `apps/web` Vite + React 19 + RR v7 + TanStack Query 5 + Tailwind 3.4 cyberpunk tokens + shadcn/ui init + Zod env. Vitest smoke pass.
  - **T-006** ESLint 9 flat config (root + per-app extends) + Prettier 3 + Husky 9 + lint-staged + commitlint. Format baseline 28 files. Pre-commit + commit-msg hooks active.
  - **T-007** đóng: env validation đã có qua Zod (BE + FE). `dotenv-safe` defer permanent — Zod superset cover.
  - Bonus: `.vscode/` (extensions + settings) + `.editorconfig` + TypeScript pin root cho `js/ts.tsdk.path` resolve. Convention rules: §Enums (cấm string literal union), §Logging (cấm console.\*, dùng NestJS Logger BE + loglevel FE). Tách tests/ folder khỏi src/.
- **Doing:**
  - —
- **Blocked:**
  - —
- **M3 complete ✅ (6/6 done):**
  - ✅ T-010: Prisma schema 14 entities + first migration `20260517165932_init`
  - ✅ T-011: Seed scripts (admin + 3 sample posts/2 tags/1 anon comment; test seed admin only)
  - ✅ T-012 + T-013 (gộp): AuthModule full feature — service + 2 strategies + 2 guards + 5 endpoints + cookie httpOnly + refresh rotation DB hash. 10 smoke cases pass.
  - ✅ T-014 + T-015 (gộp): UsersModule (CRUD + ban/unban) + common infra (@Public/@Roles/@CurrentUser/@AnonymousId decorators + RolesGuard + AnonymousIdMiddleware + JwtAuthGuard Reflector-aware). 10 smoke cases pass.
  - ✅ **Test infra + retroactive M3 tests**: BE test pyramid (helpers test-app/db-reset/factory/auth + global setup migrate test-admin). 47 tests pass (27 unit + 20 integration). Env simplify `.env.local` → `.env`. CLAUDE.md enforce test-before-commit cho F1/F2.
- **Next (M4):**
  - T-020: PostsModule CRUD endpoints
  - T-021: View tracking endpoint + 30min dedup
  - T-022: FilesModule Cloudinary signed upload + delete
  - T-023: TagsModule CRUD + color rotation

### 2026-05-18 (Week 2)

- **M4 complete ✅ (4/4):**
  - ✅ **T-020** PostsModule CRUD: 5 endpoints (GET list/detail public, POST/PATCH/DELETE admin), Service auto-upsert Tag, `$transaction` replace tags/images/files, hard delete cascade. 14 unit + 20 integration.
  - ✅ **T-021** View tracking POST /posts/:id/view: optional auth qua new `JwtOptionalAuthGuard` reusable. Dedup 30min theo userId/anonymousId. Response `{ viewCount, counted }`. 5 unit + 5 integration.
  - ✅ **T-022** FilesModule Cloudinary: POST /files/sign + DELETE /files/:id (admin). `CloudinaryService` wrapper + cascade Cloudinary cleanup hook PostsService.remove/update. Dep `cloudinary ^2.10`. 3 unit + 9 integration.
  - ✅ **T-023** TagsModule CRUD + color rotation: GET public top N + POST/PATCH/DELETE admin. `TAG_COLORS` palette 7 cyberpunk colors cycle theo `tag.count() % 7`. Refactor PostsService inline upsert → `TagsService.upsertMany(names, tx?)` transaction-aware. 16 unit + 18 integration.
  - Total **66 unit + 74 e2e = 140 tests pass**.
- **M5 complete ✅ (3/3):**
  - ✅ **T-030** LikesModule: 2 endpoints (POST /posts/:id/like + POST /comments/:id/like) optional auth qua JwtOptionalAuthGuard, toggle idempotent qua unique constraint, comment likes chỉ APPROVED. 11 unit + 10 integration.
  - ✅ **T-031** CommentsModule + admin moderation: 4 endpoints (GET role-aware, POST optional, DELETE admin, PATCH /:id/status admin). Status default APPROVED. Single controller no-base pattern. 15 unit + 19 integration.
  - ✅ **T-032** SavedModule bookmark: 2 endpoints auth-only (POST /posts/:id/save toggle + GET /me/saved paginated savedAt DESC). Reuse toPostView từ PostsService. 6 unit + 9 integration. Total **98 unit + 112 e2e = 210 tests pass**.
- **M6 closed partial ✅ (2/4 done, 2 deferred):**
  - ✅ **T-040** AdminModule (stats / moods / heatmap): 3 endpoints aggregation admin-only. Helper `bucketByDay` UTC + zero-fill.
  - ✅ **T-043** Rate limiting (@nestjs/throttler): Global 100/60s/IP + per-endpoint @Throttle 10/min cho register/login/comments/likes (NFR-04). skipIf `THROTTLE_DISABLED=1` cho test. Map ThrottlerException → `RATE_LIMITED` 429. Total **104 unit + 123 e2e = 227 tests pass**.
  - 🟦 **T-041 + T-042 DEFERRED** — realtime stack (Socket.io gateway + activity log persist) gộp thành 1 phase riêng, có thể implement sau hoặc skip tuỳ scope.
- **M7 complete ✅ (5/5 done):**
  - ✅ **T-056** Design tokens align với design-file.
  - ✅ **T-055** App router + AppLayout/AuthLayout + ProtectedRoute + useAuth stub.
  - ✅ **T-050** TopBar: Logo glitch + search + ⌘K hint + Avatar dropdown 5 items.
  - ✅ **T-051** StatusBar: fixed-bottom 28px terminal-style. Path/info/build/online/version sections.
  - ✅ **T-052** CommandPalette ⌘K: portal overlay + 8 commands 3 groups + realtime filter + keyboard nav (↑↓/Enter/Esc) + global ⌘K listener trong AppLayout. Zustand store. Total **26 FE tests pass** (7 routes + 5 TopBar + 5 StatusBar + 9 CP).
  - Docs sync prep: drop global Sidebar/RightPanel; T-053 + T-054 DROPPED.
- **M8 in progress 🟡 (3/10 done):**
  - ✅ **T-065** MoodBadge + TagPill + Avatar primitives.
  - ✅ **T-062** PostContent markdown renderer.
  - ✅ **T-063** ImageGrid + ImgSlot fallback. 7 tests. Total **51 FE tests**.
- **Next (M8 Phase A còn 3 tasks):**
  - T-064 FileAttachments + FILE_CFG
  - T-061 PostCard (assembles primitives + like/save mutations)
  - T-060 FeedPage + FilterBar + foundation (types + services + hooks + MSW)

---

## Template thêm milestone mới

```markdown
| M<N> | <tên milestone> | ⬜ Todo | YYYY-MM-DD |
```

## Template log tiến độ hằng tuần

```markdown
### YYYY-MM-DD (Week N)

- **Done:** ...
- **Doing:** ...
- **Blocked:** ...
- **Next week:** ...
```
