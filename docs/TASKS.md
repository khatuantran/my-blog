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
- [T-314] [P1] [F1] [FE] NotificationsPage `/notifications` route (ProtectedRoute authed). useInfiniteQuery list, group time render, bulk select state, mark/delete mutations, ConfirmDialog bulk delete, mark-all-read button, empty state. Tests: 8 case (loading/empty/list, tab filter, bulk select+delete, mark-all, mark individual, navigate). (FR-14.4) - SUPERSEDED by T-352 (T-352 covers full scope + expands to FR-14.7-.13)
- [T-315] [P2] [F1] [Both] WebSocket realtime — extend RealtimeGateway emit `notification:new` to room `user:<userId>` từ NotificationsService.create. FE: WS subscription trong NotificationBell + NotificationsPage → invalidate `qk.notifications.list` + `qk.notifications.unreadCount`. **DEFER** nếu phase 1 timeline tight — polling 30s đủ dùng. (FR-14.6) - TODO

**Admin Manage Posts:**

- [T-320] [P2] [F1] [BE] Migration `add_post_status_enum` + enum PostStatus (PUBLISHED/DRAFT/ARCHIVED) + Post.status field default PUBLISHED. Update PostsService.list query filter status (default PUBLISHED cho feed public). 3 admin endpoints: GET `/admin/posts?status=&mood=&sort=&q=&page=&limit=`, PATCH `/admin/posts/:id { content?, mood?, status?, tags? }`, DELETE `/admin/posts/:id` (cascade). Tests: 6 case (list filter status, default PUBLISHED feed, PATCH partial, DELETE cascade, 401, 403 non-admin). (FR-15.3/15.4/15.5) - DONE 2026-05-26
- [T-321] [P2] [F1] [FE] ManagePostsPage `/admin/posts` route (ProtectedRoute requireRole=ADMIN). View toggle list/card (URL `?view=`), FilterChip status/mood, SegmentedToggle sort, search debounce 300ms. useInfiniteQuery + useAdminPosts hook. Tests: 7 case (list/card view toggle, filter status, sort change, search debounce, empty, 401, 403). (FR-15.1/15.2/15.3) - **SUPERSEDED** by T-372 (M11.9 — ManagePostsPage greenfield với design-file v2 spec đầy đủ thay vì basic CRUD).
- [T-322] [P2] [F1] [FE] QuickEditModal component — form (status dropdown + mood picker + content textarea + tag input) + optimistic patch + invalidate cache. Esc/Cancel/backdrop close. Tests: 5 case (open prefill, save patch, save error rollback, esc close, validation). (FR-15.4) - **SUPERSEDED** by T-372.
- [T-323] [P2] [F1] [FE] DeleteConfirm — reuse ConfirmDialog primitive T-211 với snippet (truncate 80) + destructive variant. Tests: 3 case (open snippet, confirm DELETE, cancel close). (FR-15.5) - **SUPERSEDED** by T-372 (DeleteConfirm Manage Posts variant gộp vào T-372).

**Polish (port foundation vào 8 màn cũ):**

- [T-331] [P2] [F1] [FE] ImageGrid `onImageClick` callback + ImageLightbox component (full-screen modal carousel + keyboard nav ←/→/Esc) port từ design-file/MyBlog Feed.html v2. Wire vào PostCard + PostDetail. Tests: 4 case (open/close/keyboard nav/multi-image). (Foundation) - DONE 2026-05-27 (PostCard + ImageGrid + Lightbox component cover bởi T-355 2026-05-25; gap PostDetail wire ImageCarousel→Lightbox closed bởi commit 2026-05-27 — onImageClick prop + 2 regression test)
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
- [T-345] [P2] [F2] [BE] Migration `add_notifications_bulk_endpoints` — KHÔNG cần migration DB (existing schema OK), chỉ add 2 endpoints (FR-14.10/.12): `PATCH /notifications/bulk-read { ids }` (mark multiple as read, self-scope, max 100 ids) + `DELETE /notifications/all` (clear all of current user). Update NotificationsService với 2 methods + controller routes. Tests: notifications.e2e-spec.ts thêm 4 case (bulk-read happy, bulk-read 400 >100 ids, clear-all happy, 401 anon). (FR-14.10/.12) - DONE 2026-05-26

**🟢 F1 New implementations (sau khi F2 prereq done):**

_AI Content Generation (FR-17 NEW):_

- [T-346] [P2] [F1] [BE] AIModule (NEW) — `AIProviderInterface` abstract + `AnthropicProvider` impl (sử dụng `@anthropic-ai/sdk`). Service `aiService.generate(prompt: string): Promise<{ html: string }>` với prompt template FR-17.4 hard-coded. Strip ` ```html` markers từ response. Endpoint `POST /ai/generate` body `{ prompt }` Zod validate length 5-500. ThrottleGuard 10 req/min/admin (per FR-17.7). JwtAuthGuard + RolesGuard ADMIN. Sentry log mỗi request `{ promptLength, resultLength, model, latencyMs }`. Error mapping: 400 INVALID_PROMPT, 403 non-admin, 429 RATE_LIMITED, 500 PROVIDER_ERROR. Env vars (DEPLOYMENT.md): `AI_PROVIDER=anthropic`, `AI_API_KEY=<sk-ant-...>`, `AI_MODEL=claude-haiku-4-5`, `AI_RATE_LIMIT_PER_MIN=10`. Tests: ai.service.spec.ts (6 case: mock provider success + strip markers + length validation + provider error map + rate limit + log) + ai.e2e-spec.ts (4 case: 200 success, 400 length, 401 anon, 403 non-admin). (FR-17) - TODO
- [T-347] [P2] [F1] [FE] AISuggestModal component (FR-17.5/.6/.8) — 640px max-w 95vw modal portal vào body, purple theme `--pur` accent. Header `✨ ai.suggest` + path + close ×. Body: textarea + Generate button (cyan primary với braille spinner 80ms loading state) + ⌘↵ shortcut hint + error block + result preview editor-area với `dangerouslySetInnerHTML`. Footer: `✓ Replace content` cyan primary → `editorRef.current.innerHTML = aiResult` + close modal. Hook `useGenerateAI({ onSuccess, onError })` qua TanStack Query mutation. Integrate vào Create Post page button `✨ AI suggest` (purple) top-right của content section. Tests: AISuggestModal.test.tsx (5 case: open/close/generate/regenerate/replace content). (FR-17.5/.6) - TODO

_CommentsModal at Feed level (FR-04.7 — DEFINITIVE pattern):_

- [T-348] [P1] [F1] [FE] CommentsModal component (FR-04.7 NEW) — 640px modal portal vào body, infinite scroll (PAGE_SIZE 5) qua IntersectionObserver + AsciiSpinner loading + page indicator dots. Header avatar + admin + time + MoodBadge + close ×. Body: render `CommentItemRow` list. Footer: integrate `CommentForm` (textarea + anon toggle + ↵ Send). ReactDOM.createPortal vào `document.body`. Body scroll lock + Esc close + click backdrop close. Tests: CommentsModal.test.tsx (5 case: open/close/infinite scroll/comment submit/Esc). (FR-04.7, [[DESIGN_SYSTEM.md > CommentsModal]]) - DONE 2026-05-25 (MVP — infinite scroll defer, render full list)
- [T-349] [P1] [F1] [FE] Refactor `apps/web/src/components/feed/PostCard.tsx` — đổi `💬` button từ `<Link to="/post/:id">` → `<button onClick={() => setShowComments(true)}>` mở CommentsModal. Keep Post Detail page existing cho deep-link/SEO (direct URL access OK). Update ASCII test snapshots nếu có. Tests: PostCard.test.tsx update existing test cases về `💬 click → opens modal NOT navigates`. (FR-04.7, depends T-348) - DONE 2026-05-25

_Reply to comment MVP (FR-03.6):_

- [T-350] [P1] [F1] [FE] ReplyForm + ReplyRow components (FR-03.6 NEW) — `ReplyForm` inline form mở khi click `↩ Reply` trên CommentItem, header `↩ replying to <user>` blu mono, textarea Inter 13 rows 2, anon toggle, ⌘↵ submit, Esc cancel. `ReplyRow` nested under parent comment indent 40px, avatar 24×24, like dùng `♡/❤` traditional (NOT reaction picker). Reuse `useCreateComment` mutation với `parentId` param. CommentItem refactor: thêm toggle `↩ Reply / Cancel` + show replies list (max 3 default + `↳ N replies (load more)` button qua `useReplies({commentId})`). Tests: 6 case (ReplyForm submit + Esc cancel + anon toggle + ReplyRow render + nested click reply on reply hidden + load more button). (FR-03.6, depends T-343/T-344) - DONE 2026-05-25

_Search expanded (FR-12.8-.12):_

- [T-381] [P2] [F1] [BE] Search add `saved` type filter — extend `SearchType` enum DTO add `'saved'`. `SearchService.search()` khi `type=saved`: require authed user, join `SavedPost` where `userId=req.user.id`, return user's saved posts trong `posts.items` (apply `mood` filter nếu có), `files=[]` + `tags=[]`. Anonymous request với `type=saved` → 401 UNAUTHORIZED. Update OpenAPI yaml + api.generated.ts. Tests: search.e2e-spec.ts (+3 case: 200 returns user's saved + 401 anon + mood narrow). (FR-12.9, blocks T-351) - DONE 2026-05-27
- [T-351] [P2] [F1] [FE] SearchPage rewrite (FR-12.8-.12) — Hero block với label `❯ search` + Big input **Inter 18** (NOT mono, NOT 22px như spec cũ) + ⌘K badge + × clear. Filter row: 3 chips (All/Saved/Files) + 7 mood emoji buttons + reset × red. 3 empty-state sections (recent.searches + browse.tags + all.posts preview qua `/posts` recent 10). Results state với `<Highlight>` `<mark>` cyan/20. No-results: ◎ + bash hint + clear + try-recent (top 3 recent searches as quick-try buttons). ResultCard refresh top accent line + post-id corner. Verify TopBar `hideSearch={true}` đã wire. Tests: SearchPage.test.tsx (8 case: hero render + filter chip click + mood filter + empty 3 sections + results highlight + no-results + clear filters + recent.searches localStorage). Depends on T-381 (BE saved type). (FR-12.8-.12) - DONE 2026-05-27

_Notifications expanded (FR-14.7-.13):_

- [T-352] [P2] [F1] [FE] NotificationsPage rewrite (FR-14.7-.13) — Replace 2 tabs (All/Unread) với 6 type tabs (All/Unread/Reactions/Comments/Replies/Shares) + count badges. Add search input `⌕ search by user, content, post id...` với 150ms debounce client-side filter. Bulk select bar (visible khi `selected.size > 0`): `N selected` + mark read + delete + clear. SubBar buttons: `✓ mark all read` + `✕ clear all`. Toast bottom-right slideDown 2500ms cho mọi action. Hook reuse `useNotifications` qua `useInfiniteQuery` + bulk hooks `useBulkMarkRead` + `useDeleteAllNotifications`. Tests: NotificationsPage.test.tsx (10 case: 6 tab switch + search filter + bulk select + bulk mark read + bulk delete + clear all confirm + toast trigger + sticky group label + empty state both variants + reply notification replyTo display). (FR-14.7-.13, depends T-345) - DONE 2026-05-26
- [T-353] [P2] [F1] [FE] NotifRow split — Refactor existing NotifRow thành 2 components riêng: `NotifRowBell` (TopBar dropdown — 34×34/18×18/2px) + `NotifRowPage` (Notifications page — 40×40/20×20/3px + checkbox + replyTo + mark toggle + delete). Cả 2 dùng cùng 4 type REACTION/COMMENT/REPLY/SHARE (đồng bộ NotificationType enum, KHÔNG legacy like/save). Files: `apps/web/src/components/layout/NotifRowBell.tsx` + `apps/web/src/pages/notifications/NotifRowPage.tsx`. Tests: 2 test files mỗi component (6 case mỗi: variant size, badge size, border-left thickness, type config, anon variant, hover state). (FR-14.13, [[DESIGN_SYSTEM.md > NotifRowBell + NotifRowPage]]) - DONE 2026-05-27

_Design-file visual sync (PostCard action + new components):_

- [T-354] [P2] [F1] [FE] PostCard action row refactor (design-file 2026-05-24): bỏ SaveButton standalone khỏi action row (move sang PostActionMenu item `🔖 Save post`). Action row chỉ 3 button: `[React]` + `💬 N` + `↗ Share` + `(ml-auto) ⋯`. Tests: PostCard.test.tsx update existing case về action row buttons count + SaveButton absence. Depends T-356 (PostActionMenu). (Design sync, depends T-356) - DONE 2026-05-25
- [T-355] [P2] [F1] [FE] ImageLightbox component (Gap 1) — full-screen overlay portal cho image click trong ImageGrid. Header (avatar+path+meta+counter+×) + image area (max 960×70vh diagonal stripe placeholder) + thumbnail strip (only `images>1`) + footer hint. Keyboard ← → Esc, body scroll lock. Wire vào PostCard `<ImageGrid onImageClick={(idx) => setLightboxIdx(idx)} />`. Tests: 4 case (open/close/keyboard nav/multi-image thumbnail). (Design sync, [[DESIGN_SYSTEM.md > ImageLightbox]]) - DONE 2026-05-25
- [T-356] [P2] [F1] [FE] PostActionMenu component (Gap 2/8 hybrid) — context menu khi click `⋯` trên PostCard. 250px minWidth, header `// post.actions · #<id>`, items: user-actions (Open detail / Copy link / **🔖 Save post**) + separator `// admin` + admin-actions (Edit / Pin / Archive / Hide comments) + separator `// danger` + Delete. Click outside close. Copy link → `navigator.clipboard.writeText` + `Copied!` 900ms feedback. Admin items role-gated qua `user.role === ADMIN`. Tests: 6 case (open/close/copy link/admin gating/destructive confirm/click outside). (Design sync, [[DESIGN_SYSTEM.md > PostActionMenu]]) - DONE 2026-05-25
- [T-357] [P2] [F1] [FE] ReactionIcon SVG component + REACTION_CONFIG migration — NEW `apps/web/src/components/feed/ReactionIcon.tsx` (~110 lines) renders 6 line-art SVG variants (LIKE/LOVE/HAHA/WOW/SAD/ANGRY) directly from design-file/MyBlog Feed.html L718-723 path data. Props `{ r: ReactionConfig | ReactionType, size?: 18, glow?: false }`; `glow=true` applies `drop-shadow(0 0 4px <color>)` filter. **REACTION_CONFIG migration:** drop `emoji: string` field; switch `color` từ CSS var tokens → hex literals (SVG stroke/fill không resolve `var()` reliably). Colors realigned per design-file palette: LIKE blu `#7DCFFF` (was cyan), LOVE mag `#FF6E96` (was red), WOW pur `#BB9AF7` (was ora). Refactor 3 consumers: ReactionButton (default trigger icon + active state + topReactions stack), ReactionPicker (panel buttons), ReactionList (tab labels + row icons). Tests: 3 new cases `tests/components/feed/ReactionIcon.test.tsx`. 357/357 FE pass. ([[DESIGN_SYSTEM.md > ReactionIcon]] + design-file Feed.html L718-723) - DONE 2026-05-26
- [T-358] [P2] [F1] [FE] ReactionPicker container refactor — Container đổi từ pill `rounded-full` border `--b2` shadow-glow-cyan-lg → panel `rounded-lg` (8px) border `cyan/35` shadow-glow-cyan-md + `z-popover` + `animate-fade-up-xs` (T-360 tokens). Buttons đổi từ `h-9 w-9` (36×36) → `h-10 w-10` (40×40). Hover transform đổi từ `scale-125` → `-translate-y-0.5` (translateY -2px) + per-color drop-shadow glow via CSS var (`--rx-color`) set inline với `r.color`, applied through Tailwind arbitrary `[filter:...]` on hover (group-hover descendant). Active state retain ReactionIcon `glow` filter. 250ms hover-close grace đã ở ReactionButton container (BUG-001/T-340) — verify intact. Tests: 4 new cases trong `tests/components/feed/ReactionPicker.test.tsx` (rounded-lg NOT rounded-full + h-10/w-10 NOT h-9/w-9 + translateY NOT scale + active glow drop-shadow color tint). 361/361 FE pass. **Depends T-357 ✓.** ([[DESIGN_SYSTEM.md > ReactionPicker]] + design-file Feed.html L717-758) - DONE 2026-05-26
- [T-359] [P2] [F1] [FE] NotificationBell visual refactor (Gap 5) — Replace `🔔` emoji với inline SVG bell (15×15 stroke=currentColor 2px, 2 paths body+clapper). Button 32×32 với border `1px --b2` + bg `--elev` (KHÔNG no-border). Badge: ring `1.5px solid --surf` + threshold `> 9 → "9+"` (NOT 99+) + color `--bg` (NOT white). Tests: update existing NotificationBell.test.tsx (5 case: SVG render + threshold 9+/9+ display + bordered button + badge ring). (Design sync, [[DESIGN_SYSTEM.md > NotificationBell]]) - DONE 2026-05-27

**Out of M11.8 scope:**

→ 19 deferred items đã được mở thành M11.9 backlog (18 tasks T-360 → T-377, ImageCarousel + CommandPalette + StatusBar + EditProfileDrawer + ProfilePage + AdminPage + ManagePostsPage + TagsPage + LoginCard + AvatarMenu + PostMiniCard + EmojiPicker + TagPickerDropdown + UploadZone + RichTextEditor + LinkInsertModal + Toast + Token system + Animation registry). StatusBar bị drop khỏi backlog vì FE component đã có props `path`/`info`/`online` ✓ — chỉ wire per-page (handled inline trong page rewrites). See `### Backlog — M11.9` dưới.

### Backlog — M11.9: Design-file phase 2 polish (components + token system + page rewrites)

> Convert "Out of M11.8 scope (defer phase 2)" items thành proper T-XXX backlog tasks. Pure FE refactor — KHÔNG touch BE / KHÔNG cần FR amendment (specs đã có trong DESIGN_SYSTEM.md + UI_DESIGN.md commit `24c040e`). Target milestone date 2026-06-26. M11.7 T-321/T-322/T-323 SUPERSEDED by T-372 (ManagePostsPage greenfield với design-file v2 spec đầy đủ).
>
> **Dependency order:** Foundation tasks (T-360 token system + T-361 animation registry + T-362 Toast) chạy trước → unblock visual polish trong page rewrites.

**🔵 Theme A: Token foundation (P1 — chạy trước):**

- [T-360] [P1] [F5] [FE] Token system implementation — Update `apps/web/src/styles/globals.css` + `apps/web/tailwind.config.ts`: Z-index scale 9 tiers (`--z-base` 0-3 / `--z-popover` 50-60 / `--z-subbar` 90 / `--z-topbar` 100 / `--z-dropdown` 200 / `--z-modal` 300 / `--z-modal-stacked` 400 / `--z-lightbox` 500 / `--z-dev-tweaks` 9999) + Shadow recipes 10 named tokens (`--shadow-glow-cyan-xs/sm/md/lg` + per-color template + `--shadow-drop-sm/md/lg/xl` + `--shadow-stack`) + Typography refinement (text-brand 17/15 split + text-h1-hero 26 SG + text-input-hero 18 Inter + text-display-sm 24 + text-mono-tiny 7-8 + text-display-glyph 32-48) + Letter-spacing (.05/.06/.08em) + Line-height (1.75/1.8/1.9). **Plus base tokens missing (M11.8 sub-audit findings 2026-05-25):** `text-mono-md 13px` + `text-small 13px` + `text-body 15px` + `text-h1 22px` + `text-h2 18px` + `text-h3 14px` + `text-display 28px` (đã spec trong DESIGN_SYSTEM Typography table nhưng chưa implement). Plus screen-by-screen font drift fix (~18 items: 3 HIGH/10 MEDIUM/5 LOW) across 8 implemented screens. Defer Notifications (skeleton, T-314/T-352) + Manage Posts (greenfield T-372). Tests: 3 case (Z-index resolution + shadow class + typography size). ([[DESIGN_SYSTEM.md > Z-index scale]] + [[Shadow recipes]] + [[Typography]]) - DONE 2026-05-26 (Phase 2 — remaining tokens implemented: 10 z-index tiers in globals.css :root + tailwind zIndex extend; 5 cyan glow tiers + 7 per-color glow-md + 4 drop variants + 1 stack compound shadow; 5 typography v2.1 variants `h1-hero` 26 / `input-hero` 18 / `display-sm` 24 / `mono-tiny` 8 / `display-glyph` 40; 3 letterSpacing tokens `wide-1/2/3` (.05/.06/.08em); 3 lineHeight tokens `relaxed-1/2/3` (1.75/1.8/1.9). Test file `apps/web/tests/styles/design-tokens.test.ts` — 3 case asserts config + globals.css. 344/344 FE pass. Tokens additive — chưa có consumer call-site refactor, defer cho các page rewrite tasks T-371/T-373/T-374/T-377)

> **Status note 2026-05-25:** Phase 1 (base tokens + screen font sync) DONE — 9 commits implement 7 base tokens + fix font drift trên 6 screens (Admin/TopBar/Profile/PostContent/TerminalCard/Search+Tags). Plus Wave 1-3 full migration sweep DONE (4 more commits `b653d8a`/`b0ce57c`/`8e06e29`/`3e3f1e2`): text-mono-xs migrate 31 files, Login/Register form labels 10→11px, hardcoded text-[XYpx] → tokens 38+. T-360 token migration ~85% done (19 arbitrary cases legitimate). Remaining scope vẫn TODO: Z-index 9 tiers + Shadow recipes 10 tokens + Letter-spacing + Line-height + v2.1 variant tokens (text-h1-hero/input-hero/display-sm/mono-tiny/display-glyph).

- [T-361] [P1] [F5] [FE] Animation registry tailwind config consolidation — **Verify** 4 keyframes đã added trong T-341 (`borderRotate 8s linear`, `liveDot 1.5s scale+opacity`, `slideIn 250ms translateX`, `slideDown 200ms translateY+opacity`) + 1 verify từ T-342 (`scanCard 4s linear` renamed từ scan-line). **Add 1 missing keyframe** (`cursorBlink 1s steps(2)` cho Search caret blink). **Split `fade-up 300ms`** thành 5 variants (`fade-up-xs 120ms` cho picker / `fade-up-sm 150ms` cho default modal / `fade-up 200ms` cho DeleteConfirm / `fade-up-md 250ms` cho drawer / `fade-up-lg 350ms` cho Login card). Plus verify existing 7 base keyframes (glitch 8s after T-341, pulse drop-shadow after T-341, blink, shake, scan-card after T-342, pulse-status restored to design-file pulse semantics after T-341). Tests: animation class snapshot 12 case. **Depends T-341 + T-342** (BUG fixes complete trước — KHÔNG overlap edit `tailwind.config.ts`; T-361 chỉ ADD `cursorBlink` + fade-up split + VERIFY existing). ([[DESIGN_SYSTEM.md > Motion]] + [[Animation registry]]) - DONE 2026-05-25

**🟢 Theme B: Shared components extract (P1/P2):**

- [T-362] [P1] [F1] [FE] Toast shared component + `useToast` hook + `<ToastProvider>` context — `apps/web/src/components/shared/Toast.tsx` + `hooks/use-toast.ts` (NEW). 3 variants (success grn ✓ / error red ✕ / info cyan ℹ) + position fixed bottom-right 44/20 + auto-dismiss 2500ms + slideDown 200ms anim. API `showToast(msg, type?)`. Provider wrap trong AppLayout. Tests: 4 case (3 variants + auto-dismiss timer). ([[DESIGN_SYSTEM.md > Toast notification pattern]]) - DONE 2026-05-25
- [T-363] [P2] [F5] [FE] UploadZone extract to shared — Move trio (`UploadZone.tsx` + sibling `ImageThumb.tsx` + `FileItem.tsx`) từ `apps/web/src/components/create-post/` → `components/shared/`. Add `hint?: string` prop override default slot-count text + `maxSizeMB?: number` client-side file size filter (Infinity if unset). CreatePostPage import path updated. Test file moved `tests/components/create-post/UploadZone.test.tsx` → `tests/components/shared/UploadZone.test.tsx` + 3 new cases (hint render override / accept attr wired / maxSizeMB rejects oversized). 8/8 UploadZone + 347/347 FE pass. - DONE 2026-05-26

**🟣 Theme C: TopBar + shared layout refactor (P2):**

- [T-364] [P2] [F1] [FE] AvatarMenu 7-item refactor — Extract from `TopBar.tsx` inline → `components/layout/AvatarMenu.tsx` (NEW, 168 lines). 5 entries trong AUTHED_MENU (Manage Posts blu /admin/posts adminOnly, Admin Dashboard pur ⌘3 adminOnly, Manage Tags yel, System Settings grn disabled `// TBD`, Profile ts separator-before /me) + Logout red ⌘Q rendered separately. GUEST_MENU 2 items (Login/Register). Header với mini avatar 28 + `~/<user>` blu + `[ ADMIN ]` ora (admin only). Status dot 8×8 grn `animate-pulse-status` (per-T-360 token). Click outside (mousedown) close. Uses `z-dropdown` + `animate-fade-up-xs` tokens. TopBar shrunk 226 → 82 lines. Tests: 5 cases trong `tests/components/layout/AvatarMenu.test.tsx` (7 items render admin + admin/non-admin filter + click outside close + status dot pulse + per-item color classes). Plus TopBar test 4 stale-assumption updates (Create Post/Saved → Manage Posts/Manage Tags). 352/352 FE pass. ([[DESIGN_SYSTEM.md > AvatarMenu]]) - DONE 2026-05-26
- [T-365] [P2] [F1] [FE] CommandPalette full refactor — Refactor `commands.ts` từ 11 commands xuống 8 entries grouped 3 sections per design v2: navigate (5: Feed ⌘1 / Saved ⌘2 / Create Post ⌘N / Admin ⌘3 / Tags ⌘4) + actions (2: Toggle theme ⌘T / Logout ⌘Q) + recent (placeholder `// no recent activity yet` italic muted, no tracking yet). `groupCommands(cmds, hasQuery)` updated — recent group always rendered when no query, hidden when filtering. CommandPalette migrate hardcoded `z-[200]` → `z-dropdown` token + `animate-fade-up` → `animate-fade-up-sm` (T-360/T-361 tokens). ⌘K global handler đã wired trong AppLayout.tsx từ trước (spec note outdated). Test update: 4 stale-assumption fixes (Profile + Search removed, Create Post moved from recent → navigate, recent placeholder testid). 351/351 FE pass. ([[DESIGN_SYSTEM.md > CommandPalette L237]]) - DONE 2026-05-26

**🟡 Theme D: Create Post enhancements (P2):**

- [T-366] [P2] [F1] [FE] EmojiPicker inline refactor — `apps/web/src/components/create-post/EmojiPicker.tsx` rewrite từ tabbed popup (absolute) → inline 4-group stack (pushes content down). All 4 groups (faces/hands/dev/nature) × 16 emojis = 64 cells render simultaneously (no tabs/active state). Group label `// {label}` font-mono text-mono-tiny uppercase tracking-wide-2 muted + buttons 28×28 (h-7 w-7) hover bg `--over`. Header `// pick an emoji` mono-tiny tracking-wide-3 + × close button. MarkdownEditor consumer moves `<EmojiPicker>` from inside flex toolbar div → below toolbar (inline flow). Esc + × close (no outside-click — inline persistent). Tests rewrite từ 7 case tabbed → 6 case inline (4 groups render + 16/group × 4 = 64 cells + click insert + × close + Esc close + open=false null). 350/350 FE pass. ([[DESIGN_SYSTEM.md > EmojiPicker L510]]) - DONE 2026-05-26
- [T-367] [P2] [F1] [FE] TagPickerDropdown master-data picker — NEW `apps/web/src/components/create-post/TagPickerDropdown.tsx` (132 lines). `+ add tag` dashed border button (text-mono-sm muted, hover cyan) → opens dropdown listbox below field (`z-popover` + `animate-fade-up-xs` + `shadow-drop-md` per-T-360). Available system tags fetched từ `useTags({ sort: 'top', limit: 30 })`, filter ra tags đã selected. Each chip `+ <name> N` với inline-style color (tag.color or default) + `postCount`. Footer divider + `// can't find your tag? manage tags →` blu Link → `/tags`. Replace `TagInput` consumer trong CreatePostPage + PostPreview (TagDraft type moved). **Delete** dead `TagInput.tsx` + `TagInput.test.tsx` (7 tests obsoleted — free-form input removed per spec). Tests: 5 cases (open dropdown / filter excluded selected / click chip adds + removes from list / no free-form input / footer link `/tags`). 349/349 FE pass. - DONE 2026-05-26
- [T-368] [P2] [F1] [FE] RichTextEditor contentEditable refactor — NEW `apps/web/src/components/create-post/RichTextEditor.tsx` (~280 lines) replacing MarkdownEditor. contentEditable div + 5 Range API patterns (`exec(cmd, val)` / `insertAtCursor(text)` / `insertHTML(html)` / `saveSelection()` / `restoreSelection()`). 11-button toolbar `[B I U S A 🖍 H1 H2 • 1. 🔗 ✕]` với per-button visual styling (weight/italic/underline/strike/mono/fontSize). 2 inline color popovers: TEXT_COLORS 7 swatches (default/pink/cyan/green/yellow/purple/blue) + HIGHLIGHT_COLORS 7 (yellow/pink/cyan/green/purple/orange/blue with `/40` alpha) — mutually exclusive. Keyboard shortcuts ⌘B/I/U/K khi editor focused. ToolbarBtn `onMouseDown preventDefault` để giữ selection. 🔗 button accepts `onRequestLink?` prop (T-369 LinkInsertModal sẽ wire); fallback `window.prompt`. **Migration:** PostContent thêm `isHtmlContent(content)` heuristic (`/^\s*<[a-z]/i.test`) → `dangerouslySetInnerHTML` cho new HTML format, parsePostContent markdown cho legacy posts. CreatePostPage swap import + JSX `MarkdownEditor` → `RichTextEditor`. Delete `MarkdownEditor.tsx` + `MarkdownEditor.test.tsx` (4 tests obsolete — markdown-wrap pattern replaced). Tests: 9 cases trong `tests/components/create-post/RichTextEditor.test.tsx` (toolbar 11 buttons render + click bold/H1 → exec + textcolor/highlight popover open + popover mutually exclusive + ⌘B shortcut + 🔗 onRequestLink callback + saveSelection/restoreSelection swatch apply). Stub `document.execCommand` (JSDOM doesn't implement). 354/354 FE pass. **Note:** Admin-only content trust HTML directly — DOMPurify sanitizer defer cho khi public posting opens. ([[DESIGN_SYSTEM.md > RichTextEditor patterns]] + design-file/MyBlog Create Post.html L322-441) - DONE 2026-05-26
- [T-369] [P2] [F1] [FE] LinkInsertModal + saveSelection/restoreSelection — `apps/web/src/components/create-post/LinkInsertModal.tsx` (NEW). 420px modal mở khi click 🔗 toolbar button (hoặc ⌘K shortcut). 2 input (text label + URL), Save selection trước open + restore khi apply → `exec('createLink', url)` hoặc `insertHTML('<a href=url>display</a>')` nếu no selection. Esc close + Cancel + ↵ Insert. **Integration:** RichTextEditor refactored to `forwardRef` exposing `RichTextEditorHandle.applyLink(url, label)`; `onRequestLink` now passes `selectedText: string` to caller. CreatePostPage manages `showLinkModal` + `linkInitialText` state, wires `editorRef.current.applyLink` as modal `onApply`. autoFocus pattern (no setTimeout) prevents focus-steal during test typing. Tests: 4 case (open/close/insert with selection/insert without selection) trong `tests/components/create-post/LinkInsertModal.test.tsx`. 365/365 FE pass. - DONE 2026-05-26

**🔴 Theme E: Page rewrites — visual sync (P2):**

- [T-370] [P2] [F1] [FE] LoginCard polish refresh — `apps/web/src/pages/LoginPage.tsx` polish: Anonymous link tweaks: add `font-mono` + `text-[13px]` (was 12) + `py-[9px]` (was 2.5) per spec. Register link + Bracket logo SVG + bottom status already implemented; added `data-testid` attrs for test selectors. Tests: 4 new cases (anon-link href / register-link href / 2 SVG polylines stroke colors / bottom status pulse dot + build sha). 369/369 FE pass. - DONE 2026-05-26
- [T-371] [P2] [F1] [FE] AdminPage rewrite — DONE 2026-05-26 — `apps/web/src/pages/AdminPage.tsx` rewrite per design-file: SubBar 40px (`~/admin/dashboard · ● live mode · last update · (right) actions`) với `liveDot 1.5s` + 4 StatCards spark (POSTS/LIKES/COMMENTS/VIEWS — border-left 3px accent + label + delta + value SG 28 + Sparkline 80×24) + 2-col grid (Mood distribution MoodBar list + Activity log card icon+msg+time muted maxH 320 scroll) + Users table 5-col (Username + Role badge + Last seen + Posts + Actions Ban/View — `.tbl-row` grid) + Comments moderation card (pending count badge + Approve/Delete buttons). Reuse existing `useAdminStats` / `useAdminMoods` / `useAdminHeatmap` / `useAdminComments` hooks. Tests: 8 case (SubBar render + StatCards + 2-col layout + users table actions + comments moderation). **Depends T-360 + T-361**. ([[UI_DESIGN.md > Screen 7 Admin Dashboard]]) - DONE 2026-05-26
- [T-372] [P2] [F1] [FE] ManagePostsPage + QuickEditModal greenfield — **SUPERSEDES M11.7 T-321 + T-322 + T-323** (mark superseded, redirect to T-372). `apps/web/src/pages/ManagePostsPage.tsx` (NEW) + `components/admin/QuickEditModal.tsx` (NEW) + `PostRow.tsx` (NEW) + `PostCardMng.tsx` (NEW). Route `/admin/posts` (ProtectedRoute requireRole=ADMIN). SubBar 44px + 4 StatCards (TOTAL/PUBLISHED/DRAFTS/ARCHIVED border-left accent) + Toolbar (search + status 4 filter + mood 7 emoji + sort + view toggle list/card) + List view PostRow 6-col grid + Card view PostCardMng + QuickEditModal 560px (STATUS dropdown + MOOD 7-emoji picker + CONTENT textarea + TAGS chip input) + DeleteConfirm Posts variant 400px with content preview + stats line + Bulk select column + bulk delete bar + Toast feedback. BE reuse M11.7 T-320 endpoints (GET `/admin/posts` + PATCH/DELETE). Tests: 15 case (list view + card view toggle + each filter + bulk select + QuickEditModal save + DeleteConfirm + role-gate 403 + toast). **Depends T-320 + T-360 + T-361 + T-362. Large task ~6-8h** — có thể break vào 3 sub-tasks (T-372a Page shell + filters, T-372b list/card view, T-372c QuickEditModal + bulk + delete). ([[UI_DESIGN.md > Screen 12 Manage Posts]] + [[DESIGN_SYSTEM.md > QuickEditModal]] + [[PostRow + PostCardMng]]) - DONE 2026-05-26
- [T-373] [P2] [F1] [FE] TagsPage + TagModal NEON_COLORS refactor — `apps/web/src/components/tags/TagModal.tsx` refactor 440px modal centered (header `// create.tag` / `// edit.tag` + path muted + close × + Live preview row top `#<name>` mono 17 với text-shadow glow + `// live preview` muted + Name input với `#` prefix in tag.color + Color picker 8 NEON_COLORS swatches 28×28 active = white border + scale 1.15 + glow + native `<input type="color">` + hex display + Description textarea rows 2 + Error block red mono 12). Esc close + Enter save + Tab navigation + body scroll lock. Plus TagsPage polish: TagCard hover animation top accent line + progress bar 2px bottom + fadeUp stagger delay. Reuse existing `useTags` + mutations. Tests: 7 case (NEON_COLORS 8 swatches + live preview update + name with # prefix + native color picker + error display + Enter save + Esc close). **Depends T-360**. ([[DESIGN_SYSTEM.md > TagCard]] + [[TagModal]]) - DONE 2026-05-26
- [T-374] [P2] [F1] [FE] ProfilePage hero rewrite — `apps/web/src/pages/ProfilePage.tsx` (311 lines) rewrite: Hero banner (gradient bg `linear-gradient(180deg, #0F1525, #0A0E1A)` + hex deco corner top-right binary/UID/PID muted mono 11 deep + ProfileAvatar size 88 + glitch name H1 26 + `[ ADMIN ]` badge + handle mono 14 cyan + title + bio + meta row + action buttons right `✏️ New Post` cyan + `⚙️ Settings` muted) + 4 tabs với count badges (Posts/Saved/Activity/About) + Main content per-tab (Posts/Saved tabs `PostMiniCard` list / Activity tab 28-day HeatmapGrid large + activity list / About tab Bio card + Skills + Info grid 8 k-v) + Right sidebar 280px hidden `<1024px` (Skills.top 6 chips + Mood breakdown 5 MoodBar + Activity 28d mini + Tags used list). Reuse existing hooks. Tests: 10 case. **Depends T-341 + T-361 + T-375. Large task ~4-5h** — có thể break vào 2 sub-tasks (T-374a Hero + tabs, T-374b Sidebar + content). ([[UI_DESIGN.md > Screen 7 Profile]] + [[DESIGN_SYSTEM.md > ProfileAvatar]]) - DONE 2026-05-26
- [T-375] [P2] [F1] [FE] PostMiniCard component (Profile variant) — `apps/web/src/components/profile/PostMiniCard.tsx` (NEW). Smaller than PostCard: bg `--surf` border `--b2` radius 8 padding 14/16 + `#<id>` corner mono 10 deep muted + header (ts mono 12 + MoodBadge) + content 3-line clamp + image mini thumbs (40×30 max 3 + `+N` overlay) + tags + action row border-top (♡/❤ toggle + count, 💬 + count, `read →` cyan link). Tests: 4 case (render + image thumbs limit + read link navigate + like toggle). - DONE 2026-05-26
- [T-376] [P2] [F1] [FE] EditProfileDrawer 4-section redesign — `apps/web/src/components/profile/EditProfileDrawer.tsx` (243 lines) refactor từ 2 sections (Profile + Security) → 4 sections (basic.info 2-col Full name + Handle + Title + Bio textarea / contact.links 2-col Location + Born year + GitHub + Website / skills.stack SkillChipInput refactor với SKILL_COLORS 8 cycle + `❯ add skill...` Enter/comma to add / security New password + Confirm — existing keep). slideIn animation 250ms. Each section header `// <section-name>` sb-lbl + horizontal divider. Header sticky + footer `✓ Save Changes` cyan primary + Cancel. Tests: 8 case. **Depends T-361**. ([[DESIGN_SYSTEM.md > EditProfileDrawer]]) - DONE 2026-05-26
- [T-377] [P2] [F1] [FE] ImageCarousel Post Detail refresh — `apps/web/src/components/post/ImageCarousel.tsx` refresh per design-file: 280px height single-image-at-a-time (NOT grid pattern) + Repeating stripe placeholder per cycle 4 colors + ← → nav arrows 44px round bg `rgba(10,14,26,.75) + backdrop-filter blur(4px)` border `--b2` + Pagination dots (active 18×6 cyan + glow `0 0 6px cyan`, inactive 6×6 gray + click to jump) + Counter `1/N` mono 11 muted bottom-right + Keyboard ← → nav. Tests: 5 case (single image + multi-image arrows + pagination dots + click dot jump + keyboard nav). ([[DESIGN_SYSTEM.md > ImageCarousel (Post Detail)]]) - DONE 2026-05-26
- [T-378] [P3] [F3] [FE] Fix BUG-004 ADMIN role badge vertical alignment + undersized font ở 3 sites: `ProfilePage.tsx` L93-103 + `PostHeader.tsx` L24-31 (Feed PostCard + PostDetail) + `PostPreview.tsx` L40-46 (Create Post preview). Apply `inline-flex items-center` + `leading-none` + `text-mono-sm` (11px, was 9px) + `padding: 1px 6px` + `border-ora/50 bg-ora/[0.06]` (ADMIN) hoặc `red` variant (BANNED) per `design-file/MyBlog Profile.html L488` spec. Pure CSS — không có regression test (visual styling). Commits `c97e1f0` + `668101c` + (next). (BUG-004, FR-11.1, FR-02.x) - DONE 2026-05-25
- [T-379] [P1] [F3] [BE] Fix BUG-005 REPLY notification hook gap (T-343 follow-up audit). `comments.service.ts` create() branch logic: `dto.parentId` set → `NotificationType.REPLY` to parent comment author với `metadata.replyTo: { username }`. Skip nếu parent anonymous (userId null) hoặc self-reply. Tests: 2 unit cases trong `comments.service.spec.ts` (REPLY trigger + anon parent skip). Plus fix stale list() tests (T-344 added `parentId: null` filter + `_count.replies` — 3 existing test mocks need update). (BUG-005, FR-14.1, FR-03.6) - DONE 2026-05-25
- [T-380] [P0] [F3] [FE] Fix BUG-006 AdminPage `/admin` TypeError crash — `Cannot read properties of undefined (reading 'total')`. **Root cause confirmed:** BE/FE contract drift từ M11.7 multi-reaction migration. BE [admin-response.dto.ts:20](apps/api/src/admin/dto/admin-response.dto.ts#L20) + openapi.yaml dùng `reactions`; FE [admin.ts:21](apps/web/src/services/api/admin.ts#L21) + [AdminPage.tsx:69](apps/web/src/pages/AdminPage.tsx#L69) vẫn dùng `likes` (stale). MSW test mock cũng copy FE bug → drift escape detection. **Fix:** rename FE `likes` → `reactions` 3 sites (admin.ts type + AdminPage.tsx STAT_COLORS+JSX+label "LIKES"→"REACTIONS" + AdminPage.test.tsx MSW mock). Regression test new case `regression BUG-006: reads stats.reactions (not stats.likes)` assert REACTIONS label + value 287 render + no crash. 5/5 AdminPage + 341/341 full FE suite pass. **Follow-up (defer):** T-302 OpenAPI cutover sẽ eliminate hand-typed drift fundamentally. (BUG-006, FR-07) - DONE 2026-05-26

### Backlog — M11.10: Design fidelity 100% sweep (audit-driven)

> Source: [docs/audits/DESIGN_FIDELITY_2026-05-28.md](audits/DESIGN_FIDELITY_2026-05-28.md) — code-level diff design-file vs FE, 11 screen, ~20 Critical thật + 75 Minor. Fix theo 6 wave systemic-theme. User decisions 2026-05-28: Profile hero → full name; Minor typography 1px → fix triệt để. Pure FE visual sync (specs đã có trong DESIGN_SYSTEM.md + audit catalog). Login (~100% match) làm reference chuẩn.

- [T-390] [P1] [F5] [FE] Wave 1 — THEME-1 cyan-vs-blue active states. Fix active/accent state dùng blue `#7DCFFF` (`--blu`) sai chỗ → cyan `#00FFE5` (`--cyan`) theo design. Sites đã biết: `ResultCard.tsx` hover accent gradient (`rgba(125,207,255,.3)` → `rgba(0,255,229,.3)`); `NotificationsPage.tsx` active tab bg+border+count badge (`--blu` → `--cyan`). Grep toàn bộ `text-blu`/`border-blu`/`bg-blu` ở active/selected state để bắt site còn lại. Tests: update existing assertion (ResultCard accent color + NotificationsPage tab active). (Audit THEME-1) - DONE 2026-05-28 (5 site: ResultCard accent gradient, NotificationsPage active tab bg+border+badge, NotifRowBell avatar gradient stop, NotifRowPage selected bgTint, NotificationBell open glow shadow — tất cả `rgba(125,207,255)` → `rgba(0,255,229)`. text-blu ở links giữ nguyên intentional. 40/40 affected tests pass)
- [T-391] [P1] [F5] [FE] Wave 2 — THEME-3 cyan glow shadow hover/focus + modal shadow recipe. Add hover glow cho card thiếu: Admin StatCard (`0 0 20px rgba(0,255,229,.06)`), Tags TagCard (`0 0 18px ${color}10` dynamic), Manage Posts PostCardMng (`0 0 18px rgba(0,255,229,.08)`). Add focus glow: Tags search/modal input, Notifications search (`shadow-glow-cyan-sm/md`). New modal shadow recipe (`shadow-glow-cyan-modal` = `0 0 50px rgba(0,255,229,.08) + 0 24px 60px rgba(0,0,0,.7)`) thay `shadow-xl` ở: Tags TagModal, Manage Posts QuickEditModal, NotificationBell, CommandPalette. PostCard (Feed) hover glow làm reference. Tests: update existing assertions. (Audit THEME-3) - DONE 2026-05-28 (3 token mới `shadow-glow-cyan-modal/panel/input`; StatCard + PostCardMng hover glow + border-cyan; focus glow Notifications search + Tags search → glow-cyan-input; modal shadow TagModal + QuickEditModal → glow-cyan-modal + border-cyan/25, NotificationBell → glow-cyan-panel; CommandPalette đã có inline cyan glow sẵn — skip. TagCard dynamic per-color glow → defer T-394 W5. 57/57 affected tests pass)
- [T-392] [P1] [F5] [FE] Wave 3 — THEME-2 mono font size mapping. Map `text-mono-sm` (11px) → `text-mono` (12px) hoặc `text-mono-md` (13px) đúng theo design per element. Sites: Feed (username/timestamp/badge/filter/mood), Post Detail (breadcrumb/comment/timestamp/meta), Tags (desc), Notifications (tab 12 / search 13 / action btn 9→11), Login (input 14→15), Shared (mark-all/tab count). Fix triệt để mọi Minor typography 1-2px (user decision). Audit từng element: design size → token đúng. Tests: update assertions nơi check font class. (Audit THEME-2) - DONE 2026-05-29 (Option A token-based normalize — user chọn giữ token scale T-360 thay vì pixel-exact raw px. Verify design-file: phần lớn THEME-2 là 1px token-noise + design tự inconsistent (username xuất hiện 11/12/14px khác screen). Fix 2 high-confidence: PostHeader username `text-mono-sm`→`text-mono` 11→12px (shared Feed+PostDetail), Login 2 input `text-mono-lg`→`text-[15px]` 14→15px. Accepted-noise (giữ nguyên, no exact token / design ambiguous / prior intentional): timestamp 10px, [ADMIN] badge 10px (T-378 chốt 11px), comment body 13px mono vs design 15px Inter — terminal-aesthetic choice. 432/435 FE pass — 3 pre-existing ManagePostsPage)
- [T-393] [P2] [F5] [FE] Wave 4 — THEME-4 fadeUp timing + stagger. Đổi card/row fadeUp `200ms` → `250ms` (`fade-up` → `fade-up-md`) ở Feed/Tags/Notifications/Manage Posts. Add missing Search ResultCard fadeUp stagger (`animationDelay` cascade ~50ms/card). Sửa stagger timing Tags/Manage Posts 60ms → 30ms. Tests: animation class assertions. (Audit THEME-4) - DONE 2026-05-29 (Verify design duration thật: Feed card `.3s`, TagCard `.25s`+stagger`i*20`, Search ResultCard `.2s`+cascade FE thiếu hẳn. Fix: Search ResultCard thêm `animate-fade-up` + `index` prop stagger 50ms/card (2 map site SearchPage); TagCard `animate-fade-up`→`animate-fade-up-md` (250ms) + stagger 60→20ms; Feed PostCard `animate-fade-up`→`animate-fade-up-md` (250, design 300 không có token — halve gap). Notifications + ManagePosts rows: FE KHÔNG có entry animation (audit over-stated) — defer thêm vì risk jank trên infinite-scroll. 432/435 FE pass)
- [T-394] [P2] [F1] [FE] Wave 5 — per-screen specific. (1) Notifications avatar gradient `linear-gradient(135deg,#00FFE520,#BB9AF720)` + text cyan (đang solid `--elev`); (2) Tags TagCard top accent gradient (đang solid) + dynamic per-color glow (THEME-5); (3) Profile heatmap legend row (less/4-color/more) + PostMiniCard hover `::before` top-edge glow; (4) **Profile hero full name** (đổi `~/username` → full name — verify Profile data field `name`, nếu BE thiếu → spawn task BE con); (5) Create Post EmojiPicker wire vào toolbar (🙂 button) + UploadZone dashedPulse animation + publish button glow; (6) Login cursor blink 1.06s→530ms + shake 450→400ms; (7) NotificationBell mark-all-read `text-grn`→`text-cyan`. Tests: per-component update/new. (Audit THEME-5 + per-screen) - DONE 2026-05-29 (6/7 nhóm: NotifRowPage avatar cyan/pur gradient + text cyan; Login TerminalCard cursor 1.06s→530ms + shake .45s→.4s; TagCard accent solid→gradient + per-color hover glow (onMouseEnter/Leave) + progress bar glow `${color}80`; HeatmapGrid legend row (less/4-color/more); PostMiniCard `::before` cyan top-edge glow + hover shadow; ProfilePage hero `~/username`→`{name||username}`; NotificationBell mark-all `text-grn`→`text-cyan`; UploadZone `animate-dashed-pulse` keyframe; CreatePost publish button cyan glow. **EmojiPicker wire DEFER → T-397** (feature work + cursor insertion + tests, không phải CSS polish). Profile name là FE-only — field `name` đã có sẵn. ProfilePage test updated (stale-assumption: hero full name). 432/435 FE pass)
- [T-397] [P2] [F1] [FE] Create Post — wire EmojiPicker vào RichTextEditor toolbar (🙂 button). Component `EmojiPicker.tsx` đã tồn tại nhưng chưa integrate. Add toolbar button toggle inline picker + insert emoji at cursor trong contentEditable (reuse `lib/insert-at-cursor.ts`). Tests: AISuggestModal-style — open/close/insert emoji. (Audit Create Post THEME, tách từ T-394 vì là feature) - TODO
- [T-395] [P3] [F5] [FE] Wave 6 — minor cleanup. Opacity/blur deltas còn lại: Feed PostCard hover glow `45px/.12`→`24px/.1`, code block border opacity, Notifications unread tint `0f`→`06` + checkbox radius 3→2px, dropdown widths (NotificationBell 360→380, CommandPalette 560→540), mood button glow brightness Search (`66`→`30`). Tests: existing pass. (Audit minor scattered) - TODO
- [T-396] [P1] [F6] [Docs] Re-audit verification — sau khi T-390→T-395 DONE, chạy lại code-level diff (hoặc ui-design-review skill) toàn 11 screen, confirm 0 Critical còn lại. Update catalog `docs/audits/DESIGN_FIDELITY_2026-05-28.md` với cột "Fixed" + log screen nào đạt chuẩn. Depends on T-390+T-391+T-392+T-393+T-394+T-395. (Verification gate user-requested) - TODO

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
