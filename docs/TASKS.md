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
- [T-009] [P1] [F7] [Infra] Setup openapi:generate workflow (NestJS Swagger → yaml + FE openapi-typescript) - PARTIAL 2026-05-19 (A1+A3 done — scripts + CI drift check + docs; A2 cutover deferred → T-302)
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
- [T-113] [P1] [F1] [Both] E2E tests Playwright (E2E-01 → E2E-13) - DONE 2026-05-18 (E2E-07/08/10/11/13 test.skip với reason — phụ thuộc UI/feature chưa wire)
- [T-114] [P2] [F7] [Infra] CI GitHub Actions matrix (FE unit + BE unit + BE integration + E2E) - DONE 2026-05-18

### Backlog — M11.5: Tags / Profile / Search / Create Post enhance

> F2 docs spec done 2026-05-18 + F1 execute done 2026-05-19. M11.5 CLOSED 17/17 tasks (commits `39e8e03` → `ff93b0c`).

#### Quick wins (parallel)

- [T-200] [P2] [F1] [FE] Wire `Copy link` button MetaPanel + toast (FR-05.2) - DONE 2026-05-19
- [T-201] [P2] [F1] [Both] FilterBar sort dropdown Latest/Oldest/Most liked + BE `GET /posts?sort=` (FR-04.6) - DONE 2026-05-19
- [T-202] [P2] [F1] [Both] Comment moderation queue UI + `GET /admin/comments?status=PENDING` (FR-07.4) - DONE 2026-05-19
- [T-203] [P2] [F1] [FE] `/saved` standalone route (authed only) + SavedPage layout (FR-03.3) - DONE 2026-05-19

#### F2-A: Tags Module (FR-10)

- [T-210] [P1] [F1] [BE] Tag.description + Tag.createdAt migration + PATCH/POST description + GET /tags response postCount + sparkline7d + sort/q query params + DELETE force=true (FR-10) - DONE 2026-05-19
- [T-211] [P1] [F1] [FE] TagCard + TagModal + ConfirmDialog + FilterChip + SegmentedToggle primitives (FR-10.3/10.4) - DONE 2026-05-19
- [T-212] [P1] [F1] [FE] `/tags` route page — 4 stat cards + toolbar + grid/list views + admin-conditional CRUD wire (FR-10.1/10.2) - DONE 2026-05-19

#### F2-B: Profile + Edit Profile (FR-11)

- [T-220] [P1] [F1] [BE] User.title/bio/skills migration (skills Json {name,color}[]) + PATCH /users/:id validators + GET /users/by-username/:username + GET /users/:id/stats + POST /auth/change-password (FR-11.6) - DONE 2026-05-19
- [T-221] [P1] [F1] [FE] ProfileAvatar (rotating ring) + HeatmapGrid + StatSparkline + TabButtons + ProfilePage layout (hero + 4 tabs + sidebar) (FR-11.1/11.4/11.5) - DONE 2026-05-19
- [T-222] [P1] [F1] [FE] EditProfileDrawer + SkillChipInput + useUpdateProfile + useChangePassword mutations (FR-11.3) - DONE 2026-05-19
- [T-223] [P1] [F1] [FE] `/me` redirect + Avatar dropdown wire Profile link (FR-11.2) - DONE 2026-05-19

#### F2-C: Search (FR-12)

- [T-230] [P1] [F1] [BE] `GET /search?q=&type=&mood=&page=&limit=` endpoint — Postgres ILIKE multi-table + throttle 30/min/IP (FR-12.1/12.2/12.3) - DONE 2026-05-19
- [T-231] [P1] [F1] [FE] BigSearchInput + ResultCard với highlight match + SearchPage layout (hero + filter chips + grid + sidebar) (FR-12.4/12.6/12.7) - DONE 2026-05-19
- [T-232] [P1] [F1] [FE] TopBar `hideSearch` prop + form onSubmit navigate + AppLayout sniff `/search` route (FR-12.5) - DONE 2026-05-19
- [T-233] [P2] [F1] [FE] `useRecentSearches` hook (localStorage 10 FIFO dedupe) + recent + browse.tags sidebar wire (FR-12.6) - DONE 2026-05-19
- [T-234] [P2] [F1] [FE] CommandPalette commands.ts fix routes + thêm n-tags/n-profile entries (FR-08.4) - DONE 2026-05-19

#### F2-D: Create Post enhance (FR-02.7)

- [T-240] [P2] [F1] [FE] EmojiPicker popover (4 tabs × 16 emoji) + insert-at-cursor wire trong MarkdownEditor 😀 button (FR-02.7) - DONE 2026-05-19

### Backlog — Tech debt

- [T-303] [P2] [F1] [Both] Amend FR-11.3 — relax change-password validation min length 8 → 5 cho cả `currentPassword` + `newPassword` (drop `MaxLength(128)`). FE EditProfileDrawer đồng bộ label/check/minLength. Test auth.e2e rename `400 < 8 chars` → `400 < 5 chars`. Motivation: error verbose UX xấu + policy 8-char không cần thiết cho personal blog (change request, không phải bug). - DONE 2026-05-19

- [T-302] [P2] [F7] [Both] OpenAPI cutover — fix 15+ BE decorator gap (nullable string `type: String`, skills `[SkillItemDto]`, nested stats DTO, search response DTO) + build `api.aliases.ts` re-export layer + migrate 38 import site (auth/users/posts/comments/likes/saved/tags/admin/search) + delete hand-typed `api.ts`. Update CI drift check target từ `api.generated.ts` sang `api.ts`. Ước 6-9h. - TODO

### Backlog — M11.6: Activity Log

> F2 docs spec done 2026-05-19 (FR-13 + UC-16 + DATA_MODEL + API_CONTRACT + UI_DESIGN + DESIGN_SYSTEM updated). Tasks below pending F1 execute.

- [T-300] [P1] [F1] [BE] ActivityLog migration (`add_activity_log`) + ActivityModule (service + controller + DTO) + hook `ActivityService.log()` vào PostsService.create / CommentsService.create / LikesService.togglePostLike (only on like=true) / SavedService.toggleSave (only on save=true) + `GET /users/:id/activity` endpoint với JwtAuthGuard + visibility check self/admin. KHÔNG hook `toggleCommentLike` (FR-13.6 v1 skip). Tests: activity.service.spec.ts (5 unit case) + activity.e2e-spec.ts (200 self / 401 anon / 403 other / 200 admin / pagination). (FR-13.1/13.2/13.3/13.6) - DONE 2026-05-19
- [T-301] [P1] [F1] [FE] Thêm types ActivityLog vào hand-typed api.ts (ActivityType / ActivityTargetType / ActivityDirection / ActivityLogItem / PaginatedActivity — vì T-302 cutover deferred) + services/api/activity.ts (listUserActivity) + useUserActivity hook (useInfiniteQuery) + qk.users.activity query key + ProfileActivityList component (icon + direction-aware text + relative time + truncate snippet + 403 fallback + IntersectionObserver infinite scroll) + wire ProfilePage Activity tab (visibility self/admin). Test 5 case (empty / 4 type icon / OUTGOING vs INCOMING text / pagination MSW / 403 hint). (FR-13.1) - DONE 2026-05-19

### Backlog — M11.7: Design v2 (Notifications + Admin Manage Posts + Reactions)

> F2 docs spec done 2026-05-24 (FR-14/15/16 + NFR-06 + UC-17/18/19/20/21 + DATA_MODEL v0.4.0-alpha + API_CONTRACT + UI_DESIGN screen 11/12 + DESIGN_SYSTEM v2.0). Design v2 baseline đã commit `a56ee72`. Tasks below pending F1 execute.

**Foundation (chạy TRƯỚC vì các task khác bám):**

- [T-330] [P1] [F1] [FE] Foundation refresh — typography token v2 (UI 11px, mono 13px, body 15px) + responsive 5-tier breakpoint utilities (980/760/640/480/420) trong globals.css + Tailwind config update + status badge palette (PUBLISHED/DRAFT/ARCHIVED) variant. Test: visual diff vài screen + token-resolution unit. (FR-15.x, NFR-02) - DONE (2026-05-24)

**Reactions (BE + FE — chạy trước Notifications vì REACTION event nguồn từ đây):**

- [T-316] [P1] [F1] [BE] Migration `rename_like_to_reaction_with_type`: RENAME table Like → Reaction + thêm `type ReactionType @default(LIKE)` + enum ReactionType (LIKE/LOVE/HAHA/WOW/SAD/ANGRY) + index `[postId, type]`. Backfill: existing rows = LIKE (data preserve). ReactionsModule (rename LikesModule) + service `upsertReaction(postId, actorId/anonymousId, type)` + 4 endpoints: POST `/posts/:id/reactions { type }`, DELETE `/posts/:id/reactions`, GET `/posts/:id/reactions/counts`, GET `/posts/:id/reactions?type=&page=&limit=`. Update PostsService.list include reactions counts. Legacy `POST /posts/:id/like` → return 410 Gone 1 release window. Tests: reactions.service.spec.ts (8 case) + reactions.e2e-spec.ts (14 case). (FR-16.x) - DONE (2026-05-24)
- [T-317] [P1] [F1] [Both] Reactions FE + BE PostView extend — BE: extend `toPostView` với `topReactions[3]` + `myReaction` (1 groupBy + 1 findMany per batch, viewer-aware) + controller `GET /posts`, `GET /posts/:id`, `GET /search` nhận viewer (auth user / anonymousId). FE: ReactionPicker primitive (popover 6 emoji) + ReactionList modal (tab All/6-type list), `useUpsertReaction` + `useRemoveReaction` + `useReactionCounts` + `useReactionList` hooks, qk.posts.reactionCounts/reactionList keys. ReactionButton (replace LikeButton) — local optimistic mirror + display top 3 emoji + total count, click count → modal. Handle 410 Gone từ legacy `/like` endpoint gracefully (disable button + inline error). PostCounts.likes → reactions; Post thêm `topReactions` + `myReaction`. Delete: `LikeButton.tsx`, `use-like.ts`, `use-like-save.test.tsx`. Tests: 8 FE case (picker hover/click/change-type/toggle-off + counts display + modal open/tab switch + 410 fallback) + 3 BE e2e case (empty reactions / multi-type top3 sorted + auth viewer myReaction / null viewer). (FR-16.4/16.5) - DONE (2026-05-24)

**Notifications (BE → FE):**

- [T-310] [P1] [F1] [BE] Migration `add_notification_table` + enum NotificationType (REACTION/COMMENT/REPLY/SHARE). Model Notification (id/userId/actorId/type/targetType/targetId/postId?/read/metadata?/createdAt) + 2 index `[userId, createdAt]` + `[userId, read]`. (FR-14.1) - DONE (2026-05-24)
- [T-311] [P1] [F1] [BE] NotificationsModule + service `createNotification()` (skip nếu actor anonymous hoặc self-action per FR-14.2) + hook vào ReactionsService.upsertReaction (REACTION + metadata.reactionType), CommentsService.create (COMMENT nếu comment trên post, REPLY nếu trên comment), ShareService (SHARE — defer nếu chưa có endpoint share). Best-effort try-catch (không break parent). Mocks NotificationsService trong service spec của các module hook. (FR-14.1/14.2) - DONE (2026-05-24)
- [T-312] [P1] [F1] [BE] Notifications endpoints: GET `/notifications?filter=&page=&limit=`, GET `/notifications/unread-count`, PATCH `/notifications/:id/read`, PATCH `/notifications/mark-all-read`, DELETE `/notifications/:id`, DELETE `/notifications/bulk`. JwtAuthGuard self-scope (403 nếu touch không phải của mình). Pagination per NFR-06. Tests: notifications.e2e-spec.ts (10 case: list filter all/unread, unread-count, read toggle, mark-all, delete single/bulk, 401 anon, 403 other user). (FR-14.3/14.4/14.5) - DONE (2026-05-24)
- [T-313] [P1] [F1] [FE] NotificationBell primitive vào TopBar — bell icon + badge unread pulsing + dropdown panel (tab All/Unread, group time, 10 items, "view all →" link). `useNotifications({ filter, limit: 10 })` + `useUnreadCount()` polling 30s. Tests: 6 case (badge hide/show/99+, dropdown toggle, tab switch, click item nav+mark-read). (FR-14.3) - DONE 2026-05-24
- [T-314] [P1] [F1] [FE] NotificationsPage `/notifications` route (ProtectedRoute authed). useInfiniteQuery list, group time render, bulk select state, mark/delete mutations, ConfirmDialog bulk delete, mark-all-read button, empty state. Tests: 8 case (loading/empty/list, tab filter, bulk select+delete, mark-all, mark individual, navigate). (FR-14.4) - TODO
- [T-315] [P2] [F1] [Both] WebSocket realtime — extend RealtimeGateway emit `notification:new` to room `user:<userId>` từ NotificationsService.create. FE: WS subscription trong NotificationBell + NotificationsPage → invalidate `qk.notifications.list` + `qk.notifications.unreadCount`. **DEFER** nếu phase 1 timeline tight — polling 30s đủ dùng. (FR-14.6) - TODO

**Admin Manage Posts:**

- [T-320] [P2] [F1] [BE] Migration `add_post_status_enum` + enum PostStatus (PUBLISHED/DRAFT/ARCHIVED) + Post.status field default PUBLISHED. Update PostsService.list query filter status (default PUBLISHED cho feed public). 3 admin endpoints: GET `/admin/posts?status=&mood=&sort=&q=&page=&limit=`, PATCH `/admin/posts/:id { content?, mood?, status?, tags? }`, DELETE `/admin/posts/:id` (cascade). Tests: 6 case (list filter status, default PUBLISHED feed, PATCH partial, DELETE cascade, 401, 403 non-admin). (FR-15.3/15.4/15.5) - TODO
- [T-321] [P2] [F1] [FE] ManagePostsPage `/admin/posts` route (ProtectedRoute requireRole=ADMIN). View toggle list/card (URL `?view=`), FilterChip status/mood, SegmentedToggle sort, search debounce 300ms. useInfiniteQuery + useAdminPosts hook. Tests: 7 case (list/card view toggle, filter status, sort change, search debounce, empty, 401, 403). (FR-15.1/15.2/15.3) - **SUPERSEDED** by T-372 (M11.9 — ManagePostsPage greenfield với design-file v2 spec đầy đủ thay vì basic CRUD).
- [T-322] [P2] [F1] [FE] QuickEditModal component — form (status dropdown + mood picker + content textarea + tag input) + optimistic patch + invalidate cache. Esc/Cancel/backdrop close. Tests: 5 case (open prefill, save patch, save error rollback, esc close, validation). (FR-15.4) - **SUPERSEDED** by T-372.
- [T-323] [P2] [F1] [FE] DeleteConfirm — reuse ConfirmDialog primitive T-211 với snippet (truncate 80) + destructive variant. Tests: 3 case (open snippet, confirm DELETE, cancel close). (FR-15.5) - **SUPERSEDED** by T-372 (DeleteConfirm Manage Posts variant gộp vào T-372).

**Polish (port foundation vào 8 màn cũ):**

- [T-331] [P2] [F1] [FE] ImageGrid `onImageClick` callback + ImageLightbox component (full-screen modal carousel + keyboard nav ←/→/Esc) port từ design-file/MyBlog Feed.html v2. Wire vào PostCard + PostDetail. Tests: 4 case (open/close/keyboard nav/multi-image). (Foundation) - TODO
- [T-332] [P2] [F1] [FE] PostContent typography sync (14→15px Feed, 15→16px PostDetail) + ImageCarousel nav buttons refined per design v2. (Foundation) - TODO
- [T-333] [P2] [F1] [FE] CreatePostPage — editor MonoSpace → Inter cho content prose (toggle var qua CSS class), image preview grid revamp giống Feed (1/2/3+ +N overlay), preview file attachment. (Foundation) - TODO
- [T-334] [P3] [F5] [FE] Responsive sweep 8 màn cũ — port v2 5-tier breakpoint CSS từ design-file (Feed/PostDetail/Profile/Admin/Search/Tags/Login/CreatePost). Pure CSS refactor, không đổi behavior. (Foundation, NFR-02) - TODO

### Backlog — M11.8: Design-file 2026-05-24 sync + 5 FR amendments + 3 bug fixes

> F2 docs amendments done 2026-05-25 (FR-03.6 reply-to-comment + FR-04.7 CommentsModal pattern + FR-12.8-.12 Search expanded + FR-14.7-.13 Notifications expanded + NEW FR-17 AI generation + UC-22). DESIGN_SYSTEM.md + UI_DESIGN.md design-file sync commit `24c040e` (2026-05-24). Tasks below pending F1/F3 execute. Priority order: **F3 bugs first** (user-blocking), then F2-prereq + F1 implementations.
>
> **Dependency note:** F1 tasks depending FR amendments cần F2 docs commit complete (BE migration plan + API_CONTRACT updates) trước khi start implementation. Order: F3 (parallel, no deps) → F1 BE migration tasks → F1 FE implementation tasks.

**🔴 F3 Bug fixes (priority CAO — user-reported, blocking core features):**

- [T-340] [P1] [F3] [FE] Fix BUG-001 ReactionPicker hover gap — thiếu 250ms close debounce. Refactor `apps/web/src/components/feed/ReactionButton.tsx`: thêm `hoverTimer` useRef + `openPicker = clearTimeout + setOpen(true)` + `closePicker = setTimeout(close, 250)`. Wire `onMouseEnter`/`onMouseLeave` trên container (KHÔNG check relatedTarget). Regression test: `apps/web/tests/components/feed/ReactionButton.test.tsx` case `it('regression BUG-001: ...')` — simulate hover button → wait 100ms → hover picker → verify still open. Diff < 30 dòng. (BUG-001, FR-16.5, [[DESIGN_SYSTEM.md > Hover-reveal popover with grace period]]) - DONE 2026-05-25
- [T-341] [P1] [F3] [FE] Fix BUG-002 ProfileAvatar 6 visual/animation bugs + tailwind config drift. Refactor `apps/web/src/components/shared/ProfileAvatar.tsx`: add `<linearGradient>` 3 stops + `strokeDasharray="6 4"` + 2px solid border + inner+text shadow + green online dot 12×12 với pulse animation. Update `apps/web/tailwind.config.ts`: bump `glitch 9s → 8s`; refactor `pulse-status` → match design-file `pulse` (opacity + drop-shadow glow, NOT scale); add 4 keyframes (`borderRotate 8s`, `liveDot 1.5s`, `slideIn .25s`, `slideDown .2s`). Regression test: `ProfileAvatar.test.tsx` case `it('regression BUG-002: ...')` assert linearGradient + dasharray + animation duration + online dot present. (BUG-002, FR-11.1, [[DESIGN_SYSTEM.md > ProfileAvatar]]) - DONE 2026-05-25
- [T-342] [P2] [F3] [FE] Fix BUG-003 Login scanCard animation drift (6s → 4s + rename). Update `apps/web/tailwind.config.ts`: rename `'scan-line'` → `'scan-card'` + duration 6s → 4s + keyframe `from { top: -100% } to { top: 200% }` (NOT translateY). Update consumer LoginCard component class `animate-scan-line` → `animate-scan-card`. Regression test: `LoginCard.test.tsx` case `it('regression BUG-003: ...')`. (BUG-003, FR-01.2, [[DESIGN_SYSTEM.md > Scan card animation (Login)]]) - DONE 2026-05-25

**🟡 F2 prerequisites (BE migration + API contract — chạy trước F1 FE):**

- [T-343] [P1] [F2] [BE] Migration `add_comment_parent_id_for_reply` (FR-03.6): Comment thêm `parentId String?` self-reference (FK Comment.id onDelete CASCADE) + `replyTo Json?` denorm. Add `@@index([parentId])`. Backfill: existing Comment rows giữ `parentId=null, replyTo=null`. Update CommentsService.create: nhận optional `parentId` → validate `parent.postId === current postId` + `parent.parentId === null` (depth 1 only) → reject 400 `INVALID_PARENT_DEPTH` nếu nested. Set `replyTo = { username: parent.user?.username || parent.anonymousName, isAnon: !parent.userId }` denorm. Tests: comments.service.spec.ts (4 case: insert reply happy + reject depth 2 + cascade delete + replyTo denorm) + e2e (3 case: POST reply 201 with replyTo, POST nested reply 400, DELETE parent → cascade replies). (FR-03.6) - DONE 2026-05-25
- [T-344] [P1] [F2] [BE] CommentsModule endpoint `GET /comments/:id/replies` (FR-03.6) — paginated list replies of a comment. Pagination per NFR-06 default `page=1&limit=20` max 50. Public role-aware (USER thấy APPROVED only). Tests: comments-replies.e2e-spec.ts (4 case: list happy + pagination + 404 comment + role-aware status filter). Update existing `GET /posts/:id/comments` extended response: top-level filter `parentId IS NULL` + include `replies: Comment[]` (max 3 first) + `replyCount`. (FR-03.6) - DONE 2026-05-25
- [T-345] [P2] [F2] [BE] Migration `add_notifications_bulk_endpoints` — KHÔNG cần migration DB (existing schema OK), chỉ add 2 endpoints (FR-14.10/.12): `PATCH /notifications/bulk-read { ids }` (mark multiple as read, self-scope, max 100 ids) + `DELETE /notifications/all` (clear all of current user). Update NotificationsService với 2 methods + controller routes. Tests: notifications.e2e-spec.ts thêm 4 case (bulk-read happy, bulk-read 400 >100 ids, clear-all happy, 401 anon). (FR-14.10/.12) - TODO

**🟢 F1 New implementations (sau khi F2 prereq done):**

_AI Content Generation (FR-17 NEW):_

- [T-346] [P2] [F1] [BE] AIModule (NEW) — `AIProviderInterface` abstract + `AnthropicProvider` impl (sử dụng `@anthropic-ai/sdk`). Service `aiService.generate(prompt: string): Promise<{ html: string }>` với prompt template FR-17.4 hard-coded. Strip ` ```html` markers từ response. Endpoint `POST /ai/generate` body `{ prompt }` Zod validate length 5-500. ThrottleGuard 10 req/min/admin (per FR-17.7). JwtAuthGuard + RolesGuard ADMIN. Sentry log mỗi request `{ promptLength, resultLength, model, latencyMs }`. Error mapping: 400 INVALID_PROMPT, 403 non-admin, 429 RATE_LIMITED, 500 PROVIDER_ERROR. Env vars (DEPLOYMENT.md): `AI_PROVIDER=anthropic`, `AI_API_KEY=<sk-ant-...>`, `AI_MODEL=claude-haiku-4-5`, `AI_RATE_LIMIT_PER_MIN=10`. Tests: ai.service.spec.ts (6 case: mock provider success + strip markers + length validation + provider error map + rate limit + log) + ai.e2e-spec.ts (4 case: 200 success, 400 length, 401 anon, 403 non-admin). (FR-17) - TODO
- [T-347] [P2] [F1] [FE] AISuggestModal component (FR-17.5/.6/.8) — 640px max-w 95vw modal portal vào body, purple theme `--pur` accent. Header `✨ ai.suggest` + path + close ×. Body: textarea + Generate button (cyan primary với braille spinner 80ms loading state) + ⌘↵ shortcut hint + error block + result preview editor-area với `dangerouslySetInnerHTML`. Footer: `✓ Replace content` cyan primary → `editorRef.current.innerHTML = aiResult` + close modal. Hook `useGenerateAI({ onSuccess, onError })` qua TanStack Query mutation. Integrate vào Create Post page button `✨ AI suggest` (purple) top-right của content section. Tests: AISuggestModal.test.tsx (5 case: open/close/generate/regenerate/replace content). (FR-17.5/.6) - TODO

_CommentsModal at Feed level (FR-04.7 — DEFINITIVE pattern):_

- [T-348] [P1] [F1] [FE] CommentsModal component (FR-04.7 NEW) — 640px modal portal vào body, infinite scroll (PAGE_SIZE 5) qua IntersectionObserver + AsciiSpinner loading + page indicator dots. Header avatar + admin + time + MoodBadge + close ×. Body: render `CommentItemRow` list. Footer: integrate `CommentForm` (textarea + anon toggle + ↵ Send). ReactDOM.createPortal vào `document.body`. Body scroll lock + Esc close + click backdrop close. Tests: CommentsModal.test.tsx (5 case: open/close/infinite scroll/comment submit/Esc). (FR-04.7, [[DESIGN_SYSTEM.md > CommentsModal]]) - TODO
- [T-349] [P1] [F1] [FE] Refactor `apps/web/src/components/feed/PostCard.tsx` — đổi `💬` button từ `<Link to="/post/:id">` → `<button onClick={() => setShowComments(true)}>` mở CommentsModal. Keep Post Detail page existing cho deep-link/SEO (direct URL access OK). Update ASCII test snapshots nếu có. Tests: PostCard.test.tsx update existing test cases về `💬 click → opens modal NOT navigates`. (FR-04.7, depends T-348) - TODO

_Reply to comment MVP (FR-03.6):_

- [T-350] [P1] [F1] [FE] ReplyForm + ReplyRow components (FR-03.6 NEW) — `ReplyForm` inline form mở khi click `↩ Reply` trên CommentItem, header `↩ replying to <user>` blu mono, textarea Inter 13 rows 2, anon toggle, ⌘↵ submit, Esc cancel. `ReplyRow` nested under parent comment indent 40px, avatar 24×24, like dùng `♡/❤` traditional (NOT reaction picker). Reuse `useCreateComment` mutation với `parentId` param. CommentItem refactor: thêm toggle `↩ Reply / Cancel` + show replies list (max 3 default + `↳ N replies (load more)` button qua `useReplies({commentId})`). Tests: 6 case (ReplyForm submit + Esc cancel + anon toggle + ReplyRow render + nested click reply on reply hidden + load more button). (FR-03.6, depends T-343/T-344) - TODO

_Search expanded (FR-12.8-.12):_

- [T-351] [P2] [F1] [FE] SearchPage rewrite (FR-12.8-.12) — Hero block với label `❯ search` + Big input **Inter 18** (NOT mono, NOT 22px như spec cũ) + ⌘K badge + × clear. Filter row: 3 chips (All/Saved/Files) + 7 mood emoji buttons + reset × red. 3 empty-state sections (recent.searches + browse.tags + all.posts preview). Results state với `<Highlight>` `<mark>` cyan/20. No-results: ◎ + bash hint + clear + try-recent. ResultCard refresh top accent line + post-id corner. Verify TopBar `hideSearch={true}` đã wire. Tests: SearchPage.test.tsx (8 case: hero render + filter chip click + mood filter + empty 3 sections + results highlight + no-results + clear filters + recent.searches localStorage). (FR-12.8-.12) - TODO

_Notifications expanded (FR-14.7-.13):_

- [T-352] [P2] [F1] [FE] NotificationsPage rewrite (FR-14.7-.13) — Replace 2 tabs (All/Unread) với 6 type tabs (All/Unread/Reactions/Comments/Replies/Shares) + count badges. Add search input `⌕ search by user, content, post id...` với 150ms debounce client-side filter. Bulk select bar (visible khi `selected.size > 0`): `N selected` + mark read + delete + clear. SubBar buttons: `✓ mark all read` + `✕ clear all`. Toast bottom-right slideDown 2500ms cho mọi action. Hook reuse `useNotifications` qua `useInfiniteQuery` + bulk hooks `useBulkMarkRead` + `useDeleteAllNotifications`. Tests: NotificationsPage.test.tsx (10 case: 6 tab switch + search filter + bulk select + bulk mark read + bulk delete + clear all confirm + toast trigger + sticky group label + empty state both variants + reply notification replyTo display). (FR-14.7-.13, depends T-345) - TODO
- [T-353] [P2] [F1] [FE] NotifRow split — Refactor existing NotifRow thành 2 components riêng: `NotifRowBell` (TopBar dropdown variant — 34×34/18×18/2px/4 legacy types like-comment-share-save) + `NotifRowPage` (Notifications page variant — 40×40/20×20/3px/4 new types reaction-comment-reply-share + checkbox column + replyTo field display + mark toggle + delete buttons). Files: `apps/web/src/components/layout/NotifRowBell.tsx` + `apps/web/src/pages/notifications/NotifRowPage.tsx`. Tests: 2 test files mỗi component (6 case mỗi: variant size, badge size, border-left thickness, type config, anon variant, hover state). (FR-14.13, [[DESIGN_SYSTEM.md > NotifRowBell + NotifRowPage]]) - TODO

_Design-file visual sync (PostCard action + new components):_

- [T-354] [P2] [F1] [FE] PostCard action row refactor (design-file 2026-05-24): bỏ SaveButton standalone khỏi action row (move sang PostActionMenu item `🔖 Save post`). Action row chỉ 3 button: `[React]` + `💬 N` + `↗ Share` + `(ml-auto) ⋯`. Tests: PostCard.test.tsx update existing case về action row buttons count + SaveButton absence. Depends T-356 (PostActionMenu). (Design sync, depends T-356) - TODO
- [T-355] [P2] [F1] [FE] ImageLightbox component (Gap 1) — full-screen overlay portal cho image click trong ImageGrid. Header (avatar+path+meta+counter+×) + image area (max 960×70vh diagonal stripe placeholder) + thumbnail strip (only `images>1`) + footer hint. Keyboard ← → Esc, body scroll lock. Wire vào PostCard `<ImageGrid onImageClick={(idx) => setLightboxIdx(idx)} />`. Tests: 4 case (open/close/keyboard nav/multi-image thumbnail). (Design sync, [[DESIGN_SYSTEM.md > ImageLightbox]]) - TODO
- [T-356] [P2] [F1] [FE] PostActionMenu component (Gap 2/8 hybrid) — context menu khi click `⋯` trên PostCard. 250px minWidth, header `// post.actions · #<id>`, items: user-actions (Open detail / Copy link / **🔖 Save post**) + separator `// admin` + admin-actions (Edit / Pin / Archive / Hide comments) + separator `// danger` + Delete. Click outside close. Copy link → `navigator.clipboard.writeText` + `Copied!` 900ms feedback. Admin items role-gated qua `user.role === ADMIN`. Tests: 6 case (open/close/copy link/admin gating/destructive confirm/click outside). (Design sync, [[DESIGN_SYSTEM.md > PostActionMenu]]) - TODO
- [T-357] [P2] [F1] [FE] ReactionIcon SVG component + REACTION_CONFIG migration (Gap 6) — Create `apps/web/src/components/feed/ReactionIcon.tsx` với 6 SVG line-art inline (like/love/haha/wow/sad/angry per design-file paths). Props `{ r: ReactionConfig, size?: 18, glow?: false }`. Update `lib/reaction-config.ts`: đổi field `emoji: string` → `iconPath: (color) => JSX.Element` (hoặc inline SVG defs). Refactor ReactionButton + ReactionPicker dùng `<ReactionIcon>` thay emoji rendering. Tests: 3 case (render 6 variants + glow filter + size prop). (Design sync, [[DESIGN_SYSTEM.md > ReactionIcon]]) - TODO
- [T-358] [P2] [F1] [FE] ReactionPicker container refactor (Gap 6) — đổi container từ pill (`rounded-full`) sang panel (`rounded-lg` 8px) + 40×40 buttons (KHÔNG 36×36) + hover `translateY(-2px) + per-color glow` (KHÔNG `scale-125`). Active state SVG icon với drop-shadow filter. Wire 250ms hover debounce (BUG-001 đã fix trong T-340, verify consistent). Tests: 4 case (panel shape NOT pill + 40×40 button + translateY hover + active glow). Depends T-357. (Design sync, [[DESIGN_SYSTEM.md > ReactionPicker]]) - TODO
- [T-359] [P2] [F1] [FE] NotificationBell visual refactor (Gap 5) — Replace `🔔` emoji với inline SVG bell (15×15 stroke=currentColor 2px, 2 paths body+clapper). Button 32×32 với border `1px --b2` + bg `--elev` (KHÔNG no-border). Badge: ring `1.5px solid --surf` + threshold `> 9 → "9+"` (NOT 99+) + color `--bg` (NOT white). Tests: update existing NotificationBell.test.tsx (5 case: SVG render + threshold 9+/9+ display + bordered button + badge ring). (Design sync, [[DESIGN_SYSTEM.md > NotificationBell]]) - TODO

**Out of M11.8 scope:**

→ 19 deferred items đã được mở thành M11.9 backlog (18 tasks T-360 → T-377, ImageCarousel + CommandPalette + StatusBar + EditProfileDrawer + ProfilePage + AdminPage + ManagePostsPage + TagsPage + LoginCard + AvatarMenu + PostMiniCard + EmojiPicker + TagPickerDropdown + UploadZone + RichTextEditor + LinkInsertModal + Toast + Token system + Animation registry). StatusBar bị drop khỏi backlog vì FE component đã có props `path`/`info`/`online` ✓ — chỉ wire per-page (handled inline trong page rewrites). See `### Backlog — M11.9` dưới.

### Backlog — M11.9: Design-file phase 2 polish (components + token system + page rewrites)

> Convert "Out of M11.8 scope (defer phase 2)" items thành proper T-XXX backlog tasks. Pure FE refactor — KHÔNG touch BE / KHÔNG cần FR amendment (specs đã có trong DESIGN_SYSTEM.md + UI_DESIGN.md commit `24c040e`). Target milestone date 2026-06-26. M11.7 T-321/T-322/T-323 SUPERSEDED by T-372 (ManagePostsPage greenfield với design-file v2 spec đầy đủ).
>
> **Dependency order:** Foundation tasks (T-360 token system + T-361 animation registry + T-362 Toast) chạy trước → unblock visual polish trong page rewrites.

**🔵 Theme A: Token foundation (P1 — chạy trước):**

- [T-360] [P1] [F5] [FE] Token system implementation — Update `apps/web/src/styles/globals.css` + `apps/web/tailwind.config.ts`: Z-index scale 9 tiers (`--z-base` 0-3 / `--z-popover` 50-60 / `--z-subbar` 90 / `--z-topbar` 100 / `--z-dropdown` 200 / `--z-modal` 300 / `--z-modal-stacked` 400 / `--z-lightbox` 500 / `--z-dev-tweaks` 9999) + Shadow recipes 10 named tokens (`--shadow-glow-cyan-xs/sm/md/lg` + per-color template + `--shadow-drop-sm/md/lg/xl` + `--shadow-stack`) + Typography refinement (text-brand 17/15 split + text-h1-hero 26 SG + text-input-hero 18 Inter + text-display-sm 24 + text-mono-tiny 7-8 + text-display-glyph 32-48) + Letter-spacing (.05/.06/.08em) + Line-height (1.75/1.8/1.9). **Plus base tokens missing (M11.8 sub-audit findings 2026-05-25):** `text-mono-md 13px` + `text-small 13px` + `text-body 15px` + `text-h1 22px` + `text-h2 18px` + `text-h3 14px` + `text-display 28px` (đã spec trong DESIGN_SYSTEM Typography table nhưng chưa implement). Plus screen-by-screen font drift fix (~18 items: 3 HIGH/10 MEDIUM/5 LOW) across 8 implemented screens. Defer Notifications (skeleton, T-314/T-352) + Manage Posts (greenfield T-372). Tests: 3 case (Z-index resolution + shadow class + typography size). ([[DESIGN_SYSTEM.md > Z-index scale]] + [[Shadow recipes]] + [[Typography]]) - TODO

> **Status note 2026-05-25:** Phase 1 (base tokens + screen font sync) DONE — 9 commits implement 7 base tokens + fix font drift trên 6 screens (Admin/TopBar/Profile/PostContent/TerminalCard/Search+Tags). Plus Wave 1-3 full migration sweep DONE (4 more commits `b653d8a`/`b0ce57c`/`8e06e29`/`3e3f1e2`): text-mono-xs migrate 31 files, Login/Register form labels 10→11px, hardcoded text-[XYpx] → tokens 38+. T-360 token migration ~85% done (19 arbitrary cases legitimate). Remaining scope vẫn TODO: Z-index 9 tiers + Shadow recipes 10 tokens + Letter-spacing + Line-height + v2.1 variant tokens (text-h1-hero/input-hero/display-sm/mono-tiny/display-glyph).

- [T-361] [P1] [F5] [FE] Animation registry tailwind config consolidation — **Verify** 4 keyframes đã added trong T-341 (`borderRotate 8s linear`, `liveDot 1.5s scale+opacity`, `slideIn 250ms translateX`, `slideDown 200ms translateY+opacity`) + 1 verify từ T-342 (`scanCard 4s linear` renamed từ scan-line). **Add 1 missing keyframe** (`cursorBlink 1s steps(2)` cho Search caret blink). **Split `fade-up 300ms`** thành 5 variants (`fade-up-xs 120ms` cho picker / `fade-up-sm 150ms` cho default modal / `fade-up 200ms` cho DeleteConfirm / `fade-up-md 250ms` cho drawer / `fade-up-lg 350ms` cho Login card). Plus verify existing 7 base keyframes (glitch 8s after T-341, pulse drop-shadow after T-341, blink, shake, scan-card after T-342, pulse-status restored to design-file pulse semantics after T-341). Tests: animation class snapshot 12 case. **Depends T-341 + T-342** (BUG fixes complete trước — KHÔNG overlap edit `tailwind.config.ts`; T-361 chỉ ADD `cursorBlink` + fade-up split + VERIFY existing). ([[DESIGN_SYSTEM.md > Motion]] + [[Animation registry]]) - TODO

**🟢 Theme B: Shared components extract (P1/P2):**

- [T-362] [P1] [F1] [FE] Toast shared component + `useToast` hook + `<ToastProvider>` context — `apps/web/src/components/shared/Toast.tsx` + `hooks/use-toast.ts` (NEW). 3 variants (success grn ✓ / error red ✕ / info cyan ℹ) + position fixed bottom-right 44/20 + auto-dismiss 2500ms + slideDown 200ms anim. API `showToast(msg, type?)`. Provider wrap trong AppLayout. Tests: 4 case (3 variants + auto-dismiss timer). ([[DESIGN_SYSTEM.md > Toast notification pattern]]) - TODO
- [T-363] [P2] [F5] [FE] UploadZone extract to shared — Move `apps/web/src/components/create-post/UploadZone.tsx` → `components/shared/UploadZone.tsx`. Add `accept` + `maxSizeMB` + `hint` props for reuse. Update Create Post imports. Tests: 3 case (render hint / accept prop / file callback). - TODO

**🟣 Theme C: TopBar + shared layout refactor (P2):**

- [T-364] [P2] [F1] [FE] AvatarMenu 7-item refactor — Extract from `TopBar.tsx` inline → `components/layout/AvatarMenu.tsx`. 7 items theo design-file order: Manage Posts (blu) / Admin Dashboard (pur ⌘3) / Manage Tags (yel) / System Settings (grn) / **separator** / Profile (default) / Logout (red ⌘Q). Header với mini avatar 28 + `~/<user>` + `[ ADMIN ]` badge (admin only). Avatar status dot 8×8 green bottom-right + pulse. Hover bg `cyan/8`. Click outside (mousedown) close. Tests: 5 case (7 items render + admin/non-admin filter + click outside close + avatar status dot + per-item color). ([[DESIGN_SYSTEM.md > AvatarMenu]]) - TODO
- [T-365] [P2] [F1] [FE] CommandPalette full refactor — `apps/web/src/components/command-palette/CommandPalette.tsx` 8 commands grouped 3 sections (`navigate`: Feed ⌘1 / Saved ⌘2 / Create Post ⌘N / Admin ⌘3 / Tags ⌘4 + `actions`: Toggle theme ⌘T / Logout ⌘Q + `recent` placeholder). ⌘K global keyboard handler wire trong `AppLayout.tsx` (currently each page có own handler — extract). Empty state `// no results for "<q>"`. Tests: 6 case (open ⌘K / search filter / group sections / click navigate / Esc close / arrow nav). ([[DESIGN_SYSTEM.md > CommandPalette]]) - TODO

**🟡 Theme D: Create Post enhancements (P2):**

- [T-366] [P2] [F1] [FE] EmojiPicker inline refactor — `apps/web/src/components/create-post/EmojiPicker.tsx` đổi từ popup floating sang inline (pushes editor down, NOT absolute). 4 groups (faces/hands/dev/nature) × 16 emojis. Group label mono 10 muted + buttons 28×28 hover bg `#232936`. Replace consumer trong CreatePostPage. Tests: 4 case (4 groups render + 16 emojis per group + click insert at cursor + close button). - TODO
- [T-367] [P2] [F1] [FE] TagPickerDropdown master-data picker — `apps/web/src/components/create-post/TagPickerDropdown.tsx` (NEW). `+ add tag` dashed button → dropdown shows available system tags (filter ra tags đã chọn). Each chip `+ <name> N` với per-color. Footer link `// can't find your tag? manage tags →` → `/tags`. Replace free-form tag input trong CreatePostPage. Reuse `useTags`. Tests: 5 case (open dropdown / filter excluded / click add chip / system tags only / footer link). - TODO
- [T-368] [P2] [F1] [FE] RichTextEditor contentEditable refactor — Replace `apps/web/src/components/create-post/MarkdownEditor.tsx` với new `RichTextEditor.tsx`: contentEditable div + 5 patterns (`exec(cmd, val)` / `insertAtCursor(text)` / `insertHTML(html)` / `saveSelection()` / `restoreSelection()` qua Range API). 11 toolbar buttons (B/I/U/S/🖍/H1/H2/•/1./🔗/✕) với visual styling per button. 2 popovers inline (TEXT_COLORS 7 swatches + HIGHLIGHT_COLORS 7 với `/40`). Keyboard shortcuts ⌘B/⌘I/⌘U/⌘K. **Large task ~3-4h** — có thể break vào 2 sub-tasks. Tests: 8 case (each toolbar action + popover render + keyboard shortcut + save/restore selection). ([[DESIGN_SYSTEM.md > RichTextToolbar]] + [[RichTextEditor]]) - TODO
- [T-369] [P2] [F1] [FE] LinkInsertModal + saveSelection/restoreSelection — `apps/web/src/components/create-post/LinkInsertModal.tsx` (NEW). 420px modal mở khi click 🔗 toolbar button (hoặc ⌘K shortcut). 2 input (text label + URL), Save selection trước open + restore khi apply → `exec('createLink', url)` hoặc `insertHTML('<a href=url>display</a>')` nếu no selection. Esc close + Cancel + ↵ Insert. Tests: 4 case (open/close/insert with selection/insert without selection). **Depends T-368**. - TODO

**🔴 Theme E: Page rewrites — visual sync (P2):**

- [T-370] [P2] [F1] [FE] LoginCard polish refresh — `apps/web/src/pages/LoginPage.tsx` polish: Anonymous link `Continue as anonymous →` (bg `pur/5` border `pur/20` radius 6 padding 9 mono 13 pur — NEW) + Register link `// no account? ❯ register here` mono 12 muted + blu link (NEW) + Bracket logo SVG 16×16 (2 polylines `<` cyan + `>` pur) trong terminal header thay logo current + Bottom mini status (`● connected to server` pulse green + `build: a1b2c3` right). Verify scanCard 4s + braille spinner. Tests: 4 case (anonymous link navigate / register link / bracket logo SVG / bottom status). **Depends T-342 + T-361**. - TODO
- [T-371] [P2] [F1] [FE] AdminPage rewrite — `apps/web/src/pages/AdminPage.tsx` rewrite per design-file: SubBar 40px (`~/admin/dashboard · ● live mode · last update · (right) actions`) với `liveDot 1.5s` + 4 StatCards spark (POSTS/LIKES/COMMENTS/VIEWS — border-left 3px accent + label + delta + value SG 28 + Sparkline 80×24) + 2-col grid (Mood distribution MoodBar list + Activity log card icon+msg+time muted maxH 320 scroll) + Users table 5-col (Username + Role badge + Last seen + Posts + Actions Ban/View — `.tbl-row` grid) + Comments moderation card (pending count badge + Approve/Delete buttons). Reuse existing `useAdminStats` / `useAdminMoods` / `useAdminHeatmap` / `useAdminComments` hooks. Tests: 8 case (SubBar render + StatCards + 2-col layout + users table actions + comments moderation). **Depends T-360 + T-361**. ([[UI_DESIGN.md > Screen 7 Admin Dashboard]]) - TODO
- [T-372] [P2] [F1] [FE] ManagePostsPage + QuickEditModal greenfield — **SUPERSEDES M11.7 T-321 + T-322 + T-323** (mark superseded, redirect to T-372). `apps/web/src/pages/ManagePostsPage.tsx` (NEW) + `components/admin/QuickEditModal.tsx` (NEW) + `PostRow.tsx` (NEW) + `PostCardMng.tsx` (NEW). Route `/admin/posts` (ProtectedRoute requireRole=ADMIN). SubBar 44px + 4 StatCards (TOTAL/PUBLISHED/DRAFTS/ARCHIVED border-left accent) + Toolbar (search + status 4 filter + mood 7 emoji + sort + view toggle list/card) + List view PostRow 6-col grid + Card view PostCardMng + QuickEditModal 560px (STATUS dropdown + MOOD 7-emoji picker + CONTENT textarea + TAGS chip input) + DeleteConfirm Posts variant 400px with content preview + stats line + Bulk select column + bulk delete bar + Toast feedback. BE reuse M11.7 T-320 endpoints (GET `/admin/posts` + PATCH/DELETE). Tests: 15 case (list view + card view toggle + each filter + bulk select + QuickEditModal save + DeleteConfirm + role-gate 403 + toast). **Depends T-320 + T-360 + T-361 + T-362. Large task ~6-8h** — có thể break vào 3 sub-tasks (T-372a Page shell + filters, T-372b list/card view, T-372c QuickEditModal + bulk + delete). ([[UI_DESIGN.md > Screen 12 Manage Posts]] + [[DESIGN_SYSTEM.md > QuickEditModal]] + [[PostRow + PostCardMng]]) - TODO
- [T-373] [P2] [F1] [FE] TagsPage + TagModal NEON_COLORS refactor — `apps/web/src/components/tags/TagModal.tsx` refactor 440px modal centered (header `// create.tag` / `// edit.tag` + path muted + close × + Live preview row top `#<name>` mono 17 với text-shadow glow + `// live preview` muted + Name input với `#` prefix in tag.color + Color picker 8 NEON_COLORS swatches 28×28 active = white border + scale 1.15 + glow + native `<input type="color">` + hex display + Description textarea rows 2 + Error block red mono 12). Esc close + Enter save + Tab navigation + body scroll lock. Plus TagsPage polish: TagCard hover animation top accent line + progress bar 2px bottom + fadeUp stagger delay. Reuse existing `useTags` + mutations. Tests: 7 case (NEON_COLORS 8 swatches + live preview update + name with # prefix + native color picker + error display + Enter save + Esc close). **Depends T-360**. ([[DESIGN_SYSTEM.md > TagCard]] + [[TagModal]]) - TODO
- [T-374] [P2] [F1] [FE] ProfilePage hero rewrite — `apps/web/src/pages/ProfilePage.tsx` (311 lines) rewrite: Hero banner (gradient bg `linear-gradient(180deg, #0F1525, #0A0E1A)` + hex deco corner top-right binary/UID/PID muted mono 11 deep + ProfileAvatar size 88 + glitch name H1 26 + `[ ADMIN ]` badge + handle mono 14 cyan + title + bio + meta row + action buttons right `✏️ New Post` cyan + `⚙️ Settings` muted) + 4 tabs với count badges (Posts/Saved/Activity/About) + Main content per-tab (Posts/Saved tabs `PostMiniCard` list / Activity tab 28-day HeatmapGrid large + activity list / About tab Bio card + Skills + Info grid 8 k-v) + Right sidebar 280px hidden `<1024px` (Skills.top 6 chips + Mood breakdown 5 MoodBar + Activity 28d mini + Tags used list). Reuse existing hooks. Tests: 10 case. **Depends T-341 + T-361 + T-375. Large task ~4-5h** — có thể break vào 2 sub-tasks (T-374a Hero + tabs, T-374b Sidebar + content). ([[UI_DESIGN.md > Screen 7 Profile]] + [[DESIGN_SYSTEM.md > ProfileAvatar]]) - TODO
- [T-375] [P2] [F1] [FE] PostMiniCard component (Profile variant) — `apps/web/src/components/profile/PostMiniCard.tsx` (NEW). Smaller than PostCard: bg `--surf` border `--b2` radius 8 padding 14/16 + `#<id>` corner mono 10 deep muted + header (ts mono 12 + MoodBadge) + content 3-line clamp + image mini thumbs (40×30 max 3 + `+N` overlay) + tags + action row border-top (♡/❤ toggle + count, 💬 + count, `read →` cyan link). Tests: 4 case (render + image thumbs limit + read link navigate + like toggle). - TODO
- [T-376] [P2] [F1] [FE] EditProfileDrawer 4-section redesign — `apps/web/src/components/profile/EditProfileDrawer.tsx` (243 lines) refactor từ 2 sections (Profile + Security) → 4 sections (basic.info 2-col Full name + Handle + Title + Bio textarea / contact.links 2-col Location + Born year + GitHub + Website / skills.stack SkillChipInput refactor với SKILL_COLORS 8 cycle + `❯ add skill...` Enter/comma to add / security New password + Confirm — existing keep). slideIn animation 250ms. Each section header `// <section-name>` sb-lbl + horizontal divider. Header sticky + footer `✓ Save Changes` cyan primary + Cancel. Tests: 8 case. **Depends T-361**. ([[DESIGN_SYSTEM.md > EditProfileDrawer]]) - TODO
- [T-377] [P2] [F1] [FE] ImageCarousel Post Detail refresh — `apps/web/src/components/post/ImageCarousel.tsx` refresh per design-file: 280px height single-image-at-a-time (NOT grid pattern) + Repeating stripe placeholder per cycle 4 colors + ← → nav arrows 44px round bg `rgba(10,14,26,.75) + backdrop-filter blur(4px)` border `--b2` + Pagination dots (active 18×6 cyan + glow `0 0 6px cyan`, inactive 6×6 gray + click to jump) + Counter `1/N` mono 11 muted bottom-right + Keyboard ← → nav. Tests: 5 case (single image + multi-image arrows + pagination dots + click dot jump + keyboard nav). ([[DESIGN_SYSTEM.md > ImageCarousel (Post Detail)]]) - TODO
- [T-378] [P3] [F3] [FE] Fix BUG-004 ADMIN role badge vertical alignment + undersized font ở 3 sites: `ProfilePage.tsx` L93-103 + `PostHeader.tsx` L24-31 (Feed PostCard + PostDetail) + `PostPreview.tsx` L40-46 (Create Post preview). Apply `inline-flex items-center` + `leading-none` + `text-mono-sm` (11px, was 9px) + `padding: 1px 6px` + `border-ora/50 bg-ora/[0.06]` (ADMIN) hoặc `red` variant (BANNED) per `design-file/MyBlog Profile.html L488` spec. Pure CSS — không có regression test (visual styling). Commits `c97e1f0` + `668101c` + (next). (BUG-004, FR-11.1, FR-02.x) - DONE 2026-05-25

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
