# Task Backlog

> Format chi tiết per task: xem Template ở cuối file.
> Status: `TODO` | `DOING` | `DONE` | `BLOCKED`
> Priority: `P0` (critical) | `P1` (high) | `P2` (medium) | `P3` (low)
> Flow: F1-F7 (xem [../CLAUDE.md > Flow Router](../CLAUDE.md))
> Affected layer: `FE` | `BE` | `Both` | `Infra` | `Docs`

## Sprint hiện tại (M1 → M2 transition)

### Completed

- [T-001] [P0] [F6/Infra/Docs] Refactor docs sang SDD chuẩn v2 — **DONE** (2026-05-17)
  - Áp dụng design source cyberpunk + monorepo stack split FE/BE
  - 14 docs rewrite, ADRs, traceability matrix

### Backlog — M2: Monorepo scaffold

- [T-002] [P0] [F7] [Infra] Setup Turborepo + pnpm workspaces (apps/web + apps/api + packages/) - DONE (2026-05-17)
  - Root `package.json` + `pnpm-workspace.yaml` + `turbo.json` + `.npmrc` + `.nvmrc` (Node 24 LTS) + `packages/.gitkeep`
  - Turbo 2.9.14, pnpm 9.15.0, Node 24.15.0
  - Pipeline tasks: build / dev / lint / test / test:unit / test:e2e / typecheck / clean
- [T-003] [P0] [F7] [Infra] Tạo docker-compose.yml (postgres-main:5432 + postgres-test:5433) - DONE (2026-05-17)
  - postgres-main: postgres:16-alpine, persistent volume `postgres-main-data`, healthcheck pg_isready
  - postgres-test: postgres:16-alpine, tmpfs (in-memory) cho test speed, healthcheck pg_isready
  - `docker compose config` validate passed
- [T-004] [P0] [F7] [BE] Scaffold apps/api NestJS bằng `nest new` + Prisma + class-validator + Swagger module - DONE (2026-05-17)
  - Manual scaffold (folder đã có .env.example): package.json + tsconfig + nest-cli + jest configs
  - src/: main.ts (helmet/compression/cookie-parser/CORS/ValidationPipe/Swagger), app.module + AppController (/+/health), config/env.schema.ts (Zod fail-fast), common/filters+interceptors, prisma/ (nestjs-prisma forRoot)
  - prisma/schema.prisma: datasource + generator + `Placeholder` model (xóa T-010)
  - apps/api/README.md + apps/api/docs/MIGRATIONS.md updated
  - Verify: typecheck ✓, test ✓ (passWithNoTests), build ✓ (dist/main.js)
  - Smoke boot defer: local postgres chiếm :5432, cần stop + `docker compose up -d` (user action)
- [T-005] [P0] [F7] [FE] Scaffold apps/web Vite + React 19 + React Router v7 + TanStack Query + Tailwind + shadcn/ui - DONE (2026-05-17)
  - Vite 6 + React 19 + React Router v7 + TanStack Query 5 + Tailwind 3.4 + Zustand 5 + shadcn/ui init
  - src/: main.tsx (QueryClient + RouterProvider + Suspense + DevTools dev-only), App, routes (lazy HomePage + NotFoundPage), pages placeholder
  - styles/globals.css: Tailwind + cyberpunk CSS vars (bg/surf/elev/over, b1-b3, tp/ts/tm/td, 8 accents) + radial dot grid background + CRT scanline class
  - tailwind.config.ts: full mapping (colors, fonts, fontSize mono variants, radius, shadow glow-cyan, animation glitch/pulse/blink/shake/fade-up)
  - lib/: utils.ts (cn helper), env.ts (Zod VITE\_\* fail-fast), validators.ts barrel
  - services/api/client.ts: fetch wrapper + ApiError + cookie credentials (typed gen defer M3+)
  - shadcn components.json init (style new-york, alias `@/*`) — add components per-need
  - Test: src/App.test.tsx smoke (Vitest + RTL + jsdom)
  - Verify: typecheck ✓, test ✓ (1/1), build ✓ (dist/index.html + assets), dev boot ✓ HTTP 200 :5173
- [T-006] [P1] [F7] [Infra] Setup ESLint + Prettier + husky + lint-staged (root + per-app config) - DONE (2026-05-17)
  - ESLint 9 flat config: root `eslint.config.mjs` (typescript-eslint, no-console, no-explicit-any) + per-app extends (apps/api NestJS, apps/web React 19 hooks + refresh)
  - Prettier 3: `.prettierrc.json` (semi, singleQuote, printWidth 100, trailingComma all) + `.prettierignore`
  - Husky 9: `.husky/pre-commit` → `pnpm lint-staged`; `.husky/commit-msg` → `commitlint --edit`
  - lint-staged config trong root `package.json`: eslint --fix + prettier --write
  - commitlint extends `config-conventional`, enforce types theo CLAUDE.md Commit Convention
  - Test files + config files: relax rules (no-console, no-explicit-any off)
  - Verify: `pnpm lint` ✓ both apps zero warnings; `pnpm format:check` ✓ 100% files; commitlint reject invalid msg, accept valid
- [T-007] [P1] [F7] [Infra] Setup `.env.example` per app + dotenv-safe validation - IN_PROGRESS
  - Done: split env templates → `apps/api/.env.example` + `apps/web/.env.example` (2026-05-17)
  - Remaining: `dotenv-safe` (hoặc `@nestjs/config` + Zod) runtime validation — defer đến khi scaffold app code (T-004, T-005)

### Backlog — M3: BE Auth + Users

- [T-010] [P0] [F1] [BE] Prisma schema initial migration (14 entities theo DATA_MODEL.md) - TODO
- [T-011] [P0] [F1] [BE] Seed script (admin user + dev/test fixtures) - TODO
- [T-012] [P0] [F1] [BE] AuthModule — JwtStrategy + JwtRefreshStrategy + bcrypt + cookie - TODO
- [T-013] [P0] [F1] [BE] Endpoints `/auth/register`, `/login`, `/refresh`, `/logout`, `/me` - TODO
- [T-014] [P0] [F1] [BE] UsersModule — CRUD + ban endpoint - TODO
- [T-015] [P1] [F1] [BE] RolesGuard + @CurrentUser decorator + AnonymousIdMiddleware - TODO

### Backlog — M4: BE Posts + Files

- [T-020] [P0] [F1] [BE] PostsModule — CRUD endpoints theo API_CONTRACT - TODO
- [T-021] [P0] [F1] [BE] View tracking endpoint + dedup logic (30min window) - TODO
- [T-022] [P0] [F1] [BE] FilesModule — Cloudinary signed upload `/files/sign` + delete - TODO
- [T-023] [P1] [F1] [BE] TagsModule — CRUD + color rotation logic - TODO

### Backlog — M5: BE Interactions

- [T-030] [P1] [F1] [BE] LikesModule (post + comment) - TODO
- [T-031] [P1] [F1] [BE] CommentsModule + moderation status logic - TODO
- [T-032] [P1] [F1] [BE] SavedModule (`/posts/:id/save`, `/me/saved`) - TODO

### Backlog — M6: BE Admin + WebSocket

- [T-040] [P1] [F1] [BE] AdminModule — `/admin/stats`, `/admin/moods`, `/admin/users`, `/admin/comments/pending`, `/admin/heatmap`, `/admin/visitors` - TODO
- [T-041] [P1] [F1] [BE] RealtimeGateway — Socket.io + rooms (`post:<id>`, `admin`) + lifecycle hooks - TODO
- [T-042] [P1] [F1] [BE] Activity log persist (PostView, AnonymousSession update) - TODO
- [T-043] [P2] [F1] [BE] Rate limiting (@nestjs/throttler) + per-endpoint limits - TODO

### Backlog — M7: FE Layout

- [T-050] [P0] [F1] [FE] TopBar (logo + search + ⌘K hint + avatar dropdown) - TODO
- [T-051] [P0] [F1] [FE] StatusBar (fixed bottom 28px terminal) - TODO
- [T-052] [P1] [F1] [FE] CommandPalette (⌘K overlay với filter + keyboard nav) - TODO
- [T-053] [P1] [F1] [FE] Sidebar (admin only, 220px sticky) - TODO
- [T-054] [P2] [F1] [FE] RightPanel (mood distribution + activity heatmap + live visitors) - TODO
- [T-055] [P0] [F1] [FE] App router (React Router v7 config + lazy load + ProtectedRoute) - TODO
- [T-056] [P0] [F1] [FE] Design tokens CSS variables in `styles/globals.css` + Tailwind config - TODO

### Backlog — M8: FE Feed + Post Detail

- [T-060] [P0] [F1] [FE] FeedPage — PostCard list + infinite scroll + FilterBar (mood/tag) - TODO
- [T-061] [P0] [F1] [FE] PostCard component (header + content + ImageGrid + FileAttachments + tags + actions) - TODO
- [T-062] [P0] [F1] [FE] PostContent markdown renderer (with code block syntax) - TODO
- [T-063] [P0] [F1] [FE] ImageGrid (1/2/3+ layout) - TODO
- [T-064] [P0] [F1] [FE] FileAttachments component - TODO
- [T-065] [P0] [F1] [FE] MoodBadge + TagPill + Avatar shared components - TODO
- [T-066] [P0] [F1] [FE] PostDetailPage — breadcrumb + ImageCarousel + comment list + form + MetaPanel - TODO
- [T-067] [P1] [F1] [FE] ImageCarousel (prev/next + dots + keyboard) - TODO
- [T-068] [P1] [F1] [FE] CommentForm + post-as-anon toggle - TODO
- [T-069] [P1] [F1] [FE] CommentItem + like + reply (defer) - TODO

### Backlog — M9: FE Create Post + Admin

- [T-070] [P1] [F1] [FE] CreatePostPage — split editor + preview pane + sub-toolbar - TODO
- [T-071] [P1] [F1] [FE] MoodPicker (7 emoji buttons) - TODO
- [T-072] [P1] [F1] [FE] MarkdownEditor (textarea + toolbar B/I/code/h/link) - TODO
- [T-073] [P1] [F1] [FE] UploadZone — drag-drop ảnh + file với progress - TODO
- [T-074] [P1] [F1] [FE] TagInput + per-tag color cycle - TODO
- [T-075] [P1] [F1] [FE] PostPreview live (right pane) - TODO
- [T-076] [P1] [F1] [FE] AdminPage — 4 StatCards + 2-col (mood/activity) + users table + comments moderation - TODO
- [T-077] [P1] [F1] [FE] StatCard + Sparkline SVG - TODO
- [T-078] [P1] [F1] [FE] MoodBar + ActivityLog item - TODO
- [T-079] [P1] [F1] [FE] UsersTable + ban/view actions - TODO
- [T-080] [P1] [F1] [FE] CommentsModeration queue (approve/delete) - TODO

### Backlog — M10: FE Login + Auth flow

- [T-090] [P0] [F1] [FE] LoginPage (terminal card + scan line + shake animation) - TODO
- [T-091] [P1] [F1] [FE] RegisterPage (defer scaffold pattern từ Login) - TODO
- [T-092] [P0] [F1] [FE] useAuth hook + TanStack Query refresh logic (catch 401 → refresh) - TODO
- [T-093] [P0] [F1] [FE] ProtectedRoute component (role check + redirect) - TODO
- [T-094] [P1] [F1] [FE] Avatar dropdown menu + Logout action - TODO

### Backlog — M11: Real-time

- [T-100] [P1] [F1] [FE] useWebSocket hook + Socket.io client setup - TODO
- [T-101] [P1] [F1] [FE] Activity log feed component (Admin) — subscribe events - TODO
- [T-102] [P1] [F1] [FE] Live visitors panel (Feed RightPanel) — subscribe events - TODO
- [T-103] [P1] [F1] [FE] Online count indicator (TopBar + StatusBar) - TODO
- [T-104] [P1] [F1] [FE] Comment hot-reload on Post Detail (WS event handler) - TODO

### Backlog — M12: Testing

- [T-110] [P1] [F1] [BE] Unit tests Jest cho mọi service - TODO
- [T-111] [P1] [F1] [BE] Integration tests Supertest cho mọi endpoint - TODO
- [T-112] [P1] [F1] [FE] Unit tests Vitest cho hooks + services + validators - TODO
- [T-113] [P1] [F1] [Both] E2E tests Playwright (E2E-01 → E2E-13) - TODO
- [T-114] [P2] [F7] [Infra] CI GitHub Actions matrix (FE unit + BE unit + BE integration + E2E) - TODO

### Backlog — M13: Deploy

- [T-120] [P1] [F7] [Infra] Setup Vercel project (FE) + connect GitHub - TODO
- [T-121] [P1] [F7] [Infra] Setup Fly.io app (BE) + Dockerfile + fly.toml + secrets - TODO
- [T-122] [P1] [F7] [Infra] Setup Neon project + branches (main + dev) + connection strings - TODO
- [T-123] [P1] [F7] [Infra] Migrate prod Neon DB + seed admin - TODO
- [T-124] [P2] [F7] [Infra] Custom domain + DNS (kha.blog) - TODO

### Backlog — M14: Monitoring

- [T-130] [P2] [F7] [Both] Sentry setup (FE + BE) - TODO
- [T-131] [P2] [F7] [Infra] Configure alert rules (Sentry + Fly + Neon) - TODO
- [T-132] [P3] [F7] [Infra] (Optional) /metrics endpoint cho Prometheus - TODO

---

## Quy ước

- ID tăng dần theo block 10 (T-001-009 setup, T-010-019 BE auth, ...). Không reuse ID.
- Khi DONE giữ trong file, không xóa — di chuyển sang section "Completed" sprint hiện tại OR archive sau.
- Priority cho bug fix dynamic theo severity: Critical→P0, High→P1, Medium→P2, Low→P3
- Mỗi task có Affected layer rõ ràng để dễ filter

---

## Template thêm task mới

```markdown
### [T-XXX] [P0|P1|P2|P3] [F1-F7] [FE|BE|Both|Infra|Docs] <Title ngắn>

- **Status:** TODO | DOING | DONE | BLOCKED
- **Assignee:** <tên hoặc để trống>
- **Estimate:** <giờ hoặc story point>
- **Mô tả:** <1-2 câu>
- **Acceptance criteria:**
  - [ ] ...
  - [ ] ...
- **Liên quan:** FR-XX, UC-YY, file: `apps/api/src/...` hoặc `apps/web/src/...`
- **Depends on:** T-YYY (task phải xong trước; để trống nếu độc lập)
- **Blocks:** T-AAA (task khác đang chờ task này)
- **Related bug:** BUG-XXX (nếu là task fix bug)
- **Branch:** `main` (trunk-based mặc định). Chỉ ghi khác nếu F4 Hotfix / Experiment / WIP
- **Created:** YYYY-MM-DD
- **Done:** YYYY-MM-DD — commit hash
```
