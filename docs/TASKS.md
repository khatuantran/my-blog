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
- [T-007] [P1] [F7] [Infra] Setup `.env.example` per app + dotenv-safe validation - DONE (2026-05-17)
  - Split env templates → `apps/api/.env.example` + `apps/web/.env.example` (per-app)
  - Runtime env validation qua Zod thay `dotenv-safe`:
    - BE: `apps/api/src/config/env.schema.ts` → `validateEnv()` injected vào ConfigModule, fail-fast (T-004)
    - FE: `apps/web/src/lib/env.ts` → Zod parse `import.meta.env`, throw Error trên import (T-005)
  - `dotenv-safe` defer permanent — Zod cover cả existence + type/format (superset)
- [T-009] [P1] [F7] [Infra] Setup openapi:generate workflow (NestJS Swagger → yaml + FE openapi-typescript) - TODO
  - apps/api: add script `openapi:generate` boot NestJS standalone + dump SwaggerModule → `docs/contracts/openapi.yaml`
  - apps/web: add dep `openapi-typescript` + script `openapi:types` generate `apps/web/src/types/api.ts`
  - Verify: regenerate openapi.yaml cover /auth + /users + /posts (post-T-020) đầy đủ
  - Blocks: FE typed API client (M7+)

### Backlog — M3: BE Auth + Users

- [T-010] [P0] [F1] [BE] Prisma schema initial migration (14 entities theo DATA_MODEL.md) - DONE (2026-05-17)
  - schema.prisma: replace Placeholder với 14 models + 4 enums (Role/Mood/FileType/CommentStatus)
  - Migration `20260517165932_init` (272 lines SQL) applied on `postgres-main` :5434
  - Docker postgres-main port :5432 → :5434 (tránh conflict local postgres)
  - apps/api/.env.example DATABASE_URL/DIRECT_URL port sync
  - Add `dotenv-cli` + scripts `prisma:migrate` / `prisma:studio` (auto-load .env.local)
  - Verify: prisma validate ✓, migrate status "up to date" ✓, typecheck ✓, build ✓
  - Migration log: apps/api/docs/MIGRATIONS.md + DATA_MODEL.md summary updated
- [T-011] [P0] [F1] [BE] Seed script (admin user + dev/test fixtures) - DONE (2026-05-17)
  - `apps/api/prisma/seed.ts` — admin upsert (bcrypt cost 10) + 2 tags (#dev cyan, #life mag) + 3 sample posts (3 mood: EXCITED/CALM/GRATEFUL) + 1 anonymous comment. Idempotent (skip nếu posts đã có).
  - `apps/api/prisma/seed-test.ts` — admin only cho integration test
  - Prisma config: `"seed": "tsx prisma/seed.ts"`. Scripts: `db:seed` + `db:seed:test` (dotenv-cli wrap .env.local / .env.test.local)
  - Add deps: `bcrypt ^5.1.1`, `@types/bcrypt ^5.0.2`, `tsx ^4.19.2`
  - ESLint exemption: `**/prisma/seed*.ts` + `**/scripts/**` allow `no-console` (CLI output legitimate)
  - Verify: seed run thành công 2 lần (idempotent), lint ✓, typecheck ✓
- [T-012] [P0] [F1] [BE] AuthModule — JwtStrategy + JwtRefreshStrategy + bcrypt + cookie - DONE (2026-05-17, gộp với T-013)
  - AuthModule (JwtModule async + PassportModule) + AuthService (bcrypt cost 10 + JWT sign + refresh rotation + reuse detection family revoke)
  - 2 strategies: JwtStrategy (access from cookie) + JwtRefreshStrategy (refresh from cookie, passReqToCallback)
  - 2 guards: JwtAuthGuard + JwtRefreshGuard (thin AuthGuard wrappers)
  - DTOs: RegisterDto (username 3-32 [a-zA-Z0-9_-], password ≥8, email optional) + LoginDto + AuthUserDto
  - Cookie config: httpOnly, secure prod, sameSite lax dev / none prod, path /
  - RefreshToken table: store SHA-256 hash + tid in JWT payload + rotation revoke old + userAgent/IP track
- [T-013] [P0] [F1] [BE] Endpoints `/auth/register`, `/login`, `/refresh`, `/logout`, `/me` - DONE (2026-05-17, gộp với T-012)
  - 5 endpoints: POST /auth/register|login|refresh|logout + GET /auth/me. Swagger decorators đầy đủ.
  - Set/clear cookies tự động trong controller. JwtRefreshGuard cho refresh + logout. JwtAuthGuard cho /me.
  - Smoke test live ✓ 10 cases: health, register conflict (409), login (200 + cookies), me with/without cookie (200/401), refresh rotate (200), logout (204), refresh after revoke (401 REFRESH_REVOKED), wrong password (401 INVALID_CREDENTIALS)
  - Env schema: relax Cloudinary từ `.min(1)` → `.default('')` (chỉ required khi T-022 FilesModule)
- [T-014] [P0] [F1] [BE] UsersModule — CRUD + ban endpoint - DONE (2026-05-17, gộp với T-015)
  - UsersModule + UsersService + UsersController + 3 DTOs (Update/ListUsers/UserResponse + PaginatedUsers)
  - 5 endpoints: GET /users (admin pagination + role filter), GET /users/:id (admin or self, email hidden cho others), PATCH /users/:id (admin or self, email/avatar), POST /users/:id/ban (admin, revoke tokens, not self/not admin), POST /users/:id/unban
  - Smoke test live ✓ 10 cases: login admin/alice register, USER 403 FORBIDDEN_ROLE list, admin list 200, PATCH self 200, PATCH other 403, ban self 403, ban alice 200 (revoke tokens), alice refresh 401 REFRESH_REVOKED, unban 200
- [T-015] [P1] [F1] [BE] RolesGuard + @CurrentUser decorator + AnonymousIdMiddleware - DONE (2026-05-17, gộp với T-014)
  - 4 decorators: @Public (IS_PUBLIC_KEY metadata cho future global guard) + @Roles (...Role[]) + @CurrentUser + @AnonymousId (extract `anon_id` cookie)
  - RolesGuard (common/guards/) — read @Roles metadata, throw FORBIDDEN_ROLE
  - JwtAuthGuard refactor: inject Reflector, check IS_PUBLIC_KEY → skip nếu @Public
  - AnonymousIdMiddleware (common/middleware/) — issue cookie `anon_id` format hex `0x7F4A2C` nếu chưa có, 1 năm TTL, apply forRoutes('\*')
  - common/index.ts barrel update; common/decorators/index.ts replace placeholder

### Backlog — M4: BE Posts + Files

- [T-020] [P0] [F1] [BE] PostsModule — CRUD endpoints theo API_CONTRACT - DONE (2026-05-18, commit f43d415)
  - 5 endpoints: GET /posts (public, paginated + mood/tag filter), GET /posts/:id (public), POST /posts (admin), PATCH /posts/:id (admin), DELETE /posts/:id (admin, hard cascade).
  - DTOs: CreatePostDto (+ ImageInputDto, FileInputDto nested), UpdatePostDto (PartialType), ListPostsDto, PostResponseDto + PaginatedPostsDto.
  - Service: auto-upsert Tag (lowercase + strip `#`), `$transaction` cho create/update (atomic tag/image/file replace).
  - Tests: 14 unit (posts.service.spec.ts mock Prisma) + 20 integration (posts.e2e-spec.ts cover auth 401/403, validation 400, 404, cascade delete).
  - Verify: typecheck ✓, lint ✓, test (41 unit + 40 e2e = 81 pass).
  - KHÔNG include view tracking (defer T-021), FilesModule Cloudinary signing (defer T-022), TagsModule color rotation (defer T-023).
- [T-021] [P0] [F1] [BE] View tracking endpoint + dedup logic (30min window) - DONE (2026-05-18, commit 6820e97)
  - POST /posts/:id/view (optional auth via new `JwtOptionalAuthGuard` reusable cho T-030/T-031). Dedup theo userId (nếu auth) hoặc anonymousId (else) trong 30 phút. Response 200 `{ viewCount, counted }`. PostView record + `viewCount` increment trong `$transaction`.
  - Tests: 5 unit (mock Prisma + PostView) + 5 integration (anonymous track/dedup, 2 anon khác track riêng, auth user prefer userId, 404). Total 46 unit + 45 e2e = 91 tests pass.
- [T-022] [P0] [F1] [BE] FilesModule — Cloudinary signed upload `/files/sign` + delete - DONE (2026-05-18, commit 94aae8e)
  - 2 endpoints: POST /files/sign (admin, body `{ resourceType, folder?, publicId? }`) + DELETE /files/:id (admin, hard delete DB + revoke Cloudinary). Dep: `cloudinary ^2.10`.
  - `CloudinaryService` wrapper (sign upload via `cloudinary.utils.api_sign_request` + `destroyMany` best-effort, log fail). Inject `ConfigService<Env, true>`.
  - **Cascade Cloudinary cleanup** hook vào `PostsService.remove()` (collect image+file publicIds trước cascade DB delete, destroy sau commit) và `PostsService.update()` (orphaned assets khi replace images/files).
  - Test infra: `createTestApp()` override `CloudinaryService` provider với mock — không hit real Cloudinary API. Stub `.env.test` Cloudinary vars.
  - Tests: 3 unit (FilesService) + 9 integration (sign auth/role/validate, delete cascade, post delete + patch replace verify destroyMany). Total **50 unit + 56 e2e = 106 tests pass**.
- [T-023] [P1] [F1] [BE] TagsModule — CRUD + color rotation logic - DONE (2026-05-18)
  - 4 endpoints: GET /tags (public, top N by postCount DESC, default limit 20 max 100), POST /tags (admin, body `{ name, color? }`, auto-assign từ palette nếu thiếu), PATCH /tags/:id (admin, rename/change color), DELETE /tags/:id (admin, hard delete + cascade PostTag).
  - Color rotation: `TAG_COLORS` palette 7 cyberpunk colors theo DESIGN_SYSTEM.md. Cycle theo `tag.count() % 7` khi auto-create.
  - Refactor `PostsService.create/update` inline `tag.upsert` → delegate sang `TagsService.upsertMany(names, tx?)` áp dụng color rotation nhất quán. PostsService unit tests update để mock TagsService.
  - Tests: 16 unit (TagsService) + 18 integration (CRUD auth/validate/cascade + color cycle wrap-around 7→0 + PostsService auto-create dùng palette). Total **66 unit + 74 e2e = 140 tests pass**.
  - M4 milestone complete (T-020/T-021/T-022/T-023 done).

### Backlog — M5: BE Interactions

- [T-030] [P1] [F1] [BE] LikesModule (post + comment) - DONE (2026-05-18)
  - 2 endpoints: POST /posts/:id/like + POST /comments/:id/like (optional auth qua JwtOptionalAuthGuard từ T-021). Identity: userId (auth) hoặc anonymousId (anon). Toggle idempotent qua unique constraint schema. Comment likes chỉ APPROVED, PENDING/REJECTED → 404 (ẩn).
  - Helper `buildDedupKey()` reusable + `BadRequestException` `VIEWER_ID_REQUIRED` khi thiếu cả. Response 200 `{ liked, count }`.
  - Tests: 11 unit + 10 integration (toggle on/off anon, 2 anon riêng count=2, auth user prefer userId, cascade Post delete xóa Like, comment PENDING/REJECTED 404). Total **77 unit + 84 e2e = 161 tests pass**.
- [T-031] [P1] [F1] [BE] CommentsModule + moderation status logic - DONE (2026-05-18)
  - 4 endpoints: GET /posts/:id/comments (public role-aware: USER chỉ APPROVED, admin tất cả status), POST optional auth (auth/anon với anonymousName, default APPROVED), DELETE admin (cascade CommentLike), PATCH /:id/status admin (APPROVED|REJECTED, PENDING không cho phép).
  - DTOs: Create (content 1-2000, anonymousName? 1-50), UpdateStatus (IsIn APPROVED|REJECTED), Response (author summary OR anonymousName + likesCount).
  - Service: list filter `status=APPROVED` cho non-admin; create discriminate userId vs anonymousId (auth → ignore anonymousName).
  - Tests: 15 unit (list role-aware filter, create auth/anon discriminate, updateStatus, remove) + 19 integration (full coverage 401/403/204, cascade, ordering, validation). Total **92 unit + 103 e2e = 195 tests pass**.
- [T-032] [P1] [F1] [BE] SavedModule (`/posts/:id/save`, `/me/saved`) - DONE (2026-05-18)
  - 2 endpoints AUTH ONLY: POST /posts/:id/save toggle bookmark (composite key userId_postId), GET /me/saved paginated saved posts (sort savedAt DESC, default limit 10 max 50). Reuse `toPostView` + `POST_INCLUDE` từ PostsService (đã export thêm 2 symbols).
  - Tests: 6 unit (toggle 404/save/unsave, list empty/paginated/map fields) + 9 integration (auth 401, toggle on/off/on, 404, cascade Post delete xóa SavedPost, paginated 12 items, ordering DESC, isolation alice không thấy bob). Total **98 unit + 112 e2e = 210 tests pass**.
  - **M5 milestone close ✅** (T-030 Likes + T-031 Comments + T-032 Saved).

### Backlog — M6: BE Admin + WebSocket

> **M6 closed 2026-05-18 (partial 2/4 done):** T-040 + T-043 hoàn tất; T-041 + T-042 DEFERRED — realtime feature có thể implement sau hoặc skip tuỳ scope.

- [T-040] [P1] [F1] [BE] AdminModule — dashboard aggregations (stats / moods / heatmap) - DONE (2026-05-18)
  - 3 endpoints admin-only: GET /admin/stats (4 metrics totals + sparkline 12 daily buckets + deltaToday), GET /admin/moods (zero-filled 7 moods), GET /admin/heatmap (28-day post creation count). Helper `bucketByDay(rows, days)` UTC-based + zero-fill missing.
  - DROP /admin/users + /admin/users/:id/ban (overlap T-014), /admin/comments/pending (defer T-031 enhancement nếu cần cross-post badge), /admin/visitors (defer T-042 với AnonymousSession activity persist).
  - Tests: 6 unit (bucketByDay helper, getStats 4 metrics, getMoodDistribution 7 zero-fill, getHeatmap 28 entries) + 9 integration (401/403/200 cho 3 endpoints + zero-fill verify). Total **104 unit + 121 e2e = 225 tests pass**.
- [T-041] [P1] [F1] [BE] RealtimeGateway — Socket.io + rooms (`post:<id>`, `admin`) + lifecycle hooks - DEFERRED (2026-05-18)
  - Phụ thuộc quyết định scope realtime (sẽ làm hoặc không làm). FR-09 + WebSocket events catalog trong API_CONTRACT.md đã có spec sẵn nếu cần resume.
- [T-042] [P1] [F1] [BE] Activity log persist (PostView, AnonymousSession update) - DEFERRED (2026-05-18)
  - Gộp với T-041 vì phụ thuộc Socket.io gateway (heartbeat từ client populate AnonymousSession). Cũng kèm endpoint /admin/visitors.
- [T-043] [P2] [F1] [BE] Rate limiting (@nestjs/throttler) + per-endpoint limits - DONE (2026-05-18)
  - Global ThrottlerModule 100/60s/IP + APP_GUARD. Per-endpoint `@Throttle({ default: { limit: 10, ttl: 60_000 } })` cho POST /auth/register, /auth/login, /posts/:id/comments, /posts/:id/like, /comments/:id/like.
  - skipIf flag: `process.env.THROTTLE_DISABLED === '1'`. `.env.test` set `THROTTLE_DISABLED=1` để existing e2e không bị burst-fail. throttle.e2e-spec.ts opt-in (xoá flag trước createTestApp, restore sau).
  - Map `ThrottlerException` → `code: 'RATE_LIMITED'` trong `HttpExceptionFilter`. Match `ERROR_CODE_CATALOG`.
  - Tests: 2 integration (burst register 12 lần → request 11 trả 429; GET /posts 20 lần KHÔNG bị throttle vì dưới global limit). Total **104 unit + 123 e2e = 227 tests pass**.

### Backlog — M7: FE Layout

> **Scope refactor 2026-05-18:** M7 scope co lại còn 5 tasks (TopBar + StatusBar + CommandPalette + router + tokens). T-053 Sidebar và T-054 RightPanel đã DROPPED — design hiện tại (Feed.html) không còn global sidebar/rightpanel; aside content di chuyển sang per-page (Admin mood.distribution + activity.log, PostDetail post.meta/tags/share/related, CreatePost live.preview).

- [T-050] [P0] [F1] [FE] TopBar (logo + search + ⌘K hint + avatar dropdown) - DONE (2026-05-18)
- [T-051] [P0] [F1] [FE] StatusBar (fixed bottom 28px terminal) - DONE (2026-05-18)
- [T-052] [P1] [F1] [FE] CommandPalette (⌘K overlay với filter + keyboard nav) - DONE (2026-05-18)
- [T-053] [P1] [F1] [FE] Sidebar (admin only, 220px sticky) - DROPPED (2026-05-18) — design refactor: global sidebar removed, không còn applicable
- [T-054] [P2] [F1] [FE] RightPanel (mood distribution + activity heatmap + live visitors) - DROPPED (2026-05-18) — design refactor: rightpanel removed, content di chuyển sang Admin page (mood.distribution + activity.log)
- [T-055] [P0] [F1] [FE] App router (React Router v7 config + lazy load + ProtectedRoute) - DONE (2026-05-18)
- [T-056] [P0] [F7] [FE] Design tokens CSS variables in `styles/globals.css` + Tailwind config - DONE (2026-05-18)

### Backlog — M8: FE Feed + Post Detail

- [T-060] [P0] [F1] [FE] FeedPage — PostCard list + infinite scroll + FilterBar (mood/tag) - DONE (2026-05-18)
- [T-061] [P0] [F1] [FE] PostCard component (header + content + ImageGrid + FileAttachments + tags + actions) - DONE (2026-05-18)
- [T-062] [P0] [F1] [FE] PostContent markdown renderer (with code block syntax) - DONE (2026-05-18)
- [T-063] [P0] [F1] [FE] ImageGrid (1/2/3+ layout) - DONE (2026-05-18)
- [T-064] [P0] [F1] [FE] FileAttachments component - DONE (2026-05-18)
- [T-065] [P0] [F1] [FE] MoodBadge + TagPill + Avatar shared components - DONE (2026-05-18)
- [T-066] [P0] [F1] [FE] PostDetailPage — breadcrumb + ImageCarousel + comment list + form + MetaPanel - DONE (2026-05-18)
- [T-067] [P1] [F1] [FE] ImageCarousel (prev/next + dots + keyboard) - DONE (2026-05-18)
- [T-068] [P1] [F1] [FE] CommentForm + post-as-anon toggle - DONE (2026-05-18)
- [T-069] [P1] [F1] [FE] CommentItem + like + reply (defer) - DONE (2026-05-18)

### Backlog — M9: FE Create Post + Admin

- [T-070] [P1] [F1] [FE] CreatePostPage — split editor + preview pane + sub-toolbar - DONE (2026-05-18)
- [T-071] [P1] [F1] [FE] MoodPicker (7 emoji buttons) - DONE (2026-05-18)
- [T-072] [P1] [F1] [FE] MarkdownEditor (textarea + toolbar B/I/code/h/link) - DONE (2026-05-18)
- [T-073] [P1] [F1] [FE] UploadZone — drag-drop ảnh + file với progress - DONE (2026-05-18)
- [T-074] [P1] [F1] [FE] TagInput + per-tag color cycle - DONE (2026-05-18)
- [T-075] [P1] [F1] [FE] PostPreview live (right pane) - DONE (2026-05-18)
- [T-076] [P1] [F1] [FE] AdminPage — 4 StatCards + 2-col (mood/activity) + users table + comments moderation - DONE (2026-05-18)
- [T-077] [P1] [F1] [FE] StatCard + Sparkline SVG - DONE (2026-05-18)
- [T-078] [P1] [F1] [FE] MoodBar + ActivityLog item - DONE (2026-05-18)
- [T-079] [P1] [F1] [FE] UsersTable + ban/view actions - DONE (2026-05-18)
- [T-080] [P1] [F1] [FE] CommentsModeration queue (approve/delete) - TODO

### Backlog — M10: FE Login + Auth flow

- [T-090] [P0] [F1] [FE] LoginPage (terminal card + scan line + shake animation) - DONE (2026-05-18)
- [T-091] [P1] [F1] [FE] RegisterPage (defer scaffold pattern từ Login) - DONE (2026-05-18)
- [T-092] [P0] [F1] [FE] useAuth hook + TanStack Query refresh logic (catch 401 → refresh) - DONE (2026-05-18)
- [T-093] [P0] [F1] [FE] ProtectedRoute component (role check + redirect) - DONE (2026-05-18)
- [T-094] [P1] [F1] [FE] Avatar dropdown menu + Logout action - DONE (2026-05-18)

### Backlog — M11: Real-time

- [T-100] [P1] [F1] [FE] useWebSocket hook + Socket.io client setup - TODO
- [T-101] [P1] [F1] [FE] Activity log feed component (Admin) — subscribe events - TODO
- [T-102] [P1] [F1] [FE] Live visitors panel (Feed RightPanel) — subscribe events - TODO
- [T-103] [P1] [F1] [FE] Online count indicator (TopBar + StatusBar) - TODO
- [T-104] [P1] [F1] [FE] Comment hot-reload on Post Detail (WS event handler) - TODO

### Backlog — M12: Testing

- [T-110] [P1] [F1] [BE] Unit tests Jest cho mọi service - DONE 2026-05-18
- [T-111] [P1] [F1] [BE] Integration tests Supertest cho mọi endpoint - DONE 2026-05-18
- [T-112] [P1] [F1] [FE] Unit tests Vitest cho hooks + services + validators - DONE 2026-05-18
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
