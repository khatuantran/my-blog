# Changelog

Tuân theo [Keep a Changelog](https://keepachangelog.com/) + [SemVer](https://semver.org/).

## [Unreleased]

### Added

- **T-064** FileAttachments + FILE_CFG (M8): port từ design-file/myblog-components.jsx:339-371. Header `// attachments [N]` + rows: type badge (color theo FILE_CFG: PDF red, DOC/DOCX blue, XLS/XLSX green, TXT muted, CSV yellow) + filename ellipsis + size formatted + download link (`<a download href={file.url} target="_blank" rel="noopener">`). `lib/file-config.ts`: `FILE_CFG` 7 types match BE Prisma enum + `getFileConfig(type)` case-insensitive fallback + `formatBytes(n)` helper (B/KB/MB với 1 decimal khi MB < 10). 9 unit tests (4 formatBytes + 4 getFileConfig + 2 component empty/render).
- **T-063** ImageGrid + ImgSlot fallback (M8): responsive grid layout 1/2/3+ images match design-file/myblog-components.jsx:161-188. 1 → single 200px; 2 → 2-col 160px; 3+ → 2-col left-big + right stacked; `+N` overlay trên cell cuối nếu count > 4. `<ImageCell>` wraps `<img>` với `onError` swap sang `<ImgSlot>` fallback. `ImgSlot` cyberpunk placeholder (striped diagonal bg + ⬡ glyph + `photo.NN` label, 4 color variants cycle theo idx). `loading="lazy"`. 7 unit tests (empty/1/2/3/5 layouts + image url thiếu + onError fallback).
- **T-062** PostContent markdown renderer (M8): port custom parser từ design-file/MyBlog Feed.html:161-184 — chỉ split `fenced code blocks` + paragraph (`\n\n` boundary). Pure `parsePostContent(content)` trong `lib/markdown.ts` (separation for fast-refresh compat); strip optional language hint `^[a-zA-Z]+\n`. `<PostContent>` component: code blocks render `<pre>` với cyberpunk theme (bg #070A14 + border-l green + green text monospace); paragraphs `<p>` mb-2. Props `variant: 'card' | 'detail'` adjust font-size 14px/15px + line-height. Zero deps. 7 unit tests (4 parser + 3 component variants).
- **T-065** Shared primitives MoodBadge + TagPill + Avatar (M8 start): port từ design-file/myblog-components.jsx. MoodBadge inline-flex pill emoji+label với background/border/glow theo MOOD_CFG (7 moods). TagPill chip với hover shift bg + glow shadow; auto `#` prefix nếu thiếu; optional onClick → role=button. Avatar circle 3 sizes (sm 28px / md 36px / lg 52px), gradient cyan→purple bg + cyan border + initial uppercase fallback hoặc `<img src={avatarUrl}>`, optional online dot bottom-right. `lib/mood-config.ts` MOOD_CFG full 7 moods + MOOD_KEYS readonly array. 11 unit tests pass.
- **T-052** CommandPalette ⌘K (close M7): createPortal overlay match design-file/MyBlog Feed.html:302-379. Backdrop `bg-black/70 backdrop-blur-md`, surface 560px max-w (90vw) top 100px, cyan border + glow shadow. Input `~$ type a command...` JetBrains Mono + Esc button right. 8 commands registry trong `commands.ts` (3 groups recent/navigate/actions): Go to feed / Search posts / Create new post / ~/feed / ~/saved / ~/admin / Toggle theme / Logout. Realtime filter substring match trên `label` + `desc`. Empty state `// no results for "<q>"`. Keyboard nav: ↑↓ select (clamp), ↵ navigate (useNavigate) + onClose, Esc close, click backdrop close. Mouse enter row → select (sync với keyboard). Items render `role="option" aria-selected`. Zustand store `use-command-palette.ts` `{ open, setOpen, toggle }`. Global ⌘K/Ctrl+K listener installed trong AppLayout (toggle). FR-08 implemented. 9 unit tests (null khi closed + render groups + filter + empty + Esc key + Esc button + Enter navigate + ArrowDown selection + click navigate). M7 đóng — **26 FE tests pass** (5 routes + 5 TopBar + 5 StatusBar + 9 CP).
- **T-051** StatusBar (M7): fixed-bottom 28px terminal-style match design-file/MyBlog Feed.html:461-480. `bg-[#070A14]` + `border-t border-b1`, JetBrains Mono 11px. Props `path` (default `~/feed`, cyan highlight bg), `info?` conditional, `online?` (default 3, green pulse dot). Sections cách `border-r border-b1`: path | info | `──────` (td color) | `build: {sha}` | spacer | `● N online` | `[ v0.1.0 ]`. Build hash đọc từ `VITE_BUILD_SHA.slice(0,6)` fallback `'a1b2c3'`. Wire vào AppLayout với `pathLabel(pathname)` helper map URL → terminal path (e.g. `/admin/create` → `~/admin/create-post`, `/post/abc123` → `~/post/abc123`). 5 unit tests (default render + custom path + conditional info + custom online + build hash).
- **T-050** TopBar (M7): fixed-top 52px shell match design-file/MyBlog Feed.html:382-458. Logo SVG `< >` brackets cyan+purple polylines (strokeWidth 2.2) + text "kha.blog" Space Grotesk 700 với `.cyan` separator + `.blog` muted 500, glitch animation 9s (text-shadow chroma split). Centered search input 440px max-w (hidden < md breakpoint), JetBrains Mono 13px, focus → cyan border + glow shadow, `⌕` left icon + `⌘K` right hint button. Right cluster: `[ v0.1.0 ]` badge + `● 3` online (green pulse) + Avatar 32px circle (gradient cyan→purple bg, online dot bottom-right). Avatar dropdown 5 menu items (Create Post cyan ⌘N / Admin Dashboard purple ⌘3 / System Settings yellow / Profile separator / Logout red ⌘Q), fade-up animation + click-outside close. `Logo.tsx` extracted reusable cho Login. AppLayout wire TopBar slot + stub `onOpenCommandPalette` (TODO T-052). useAuth stub providing admin role để dropdown hiển thị `[ ADMIN ]` badge. 5 unit tests pass (render + ⌘K callback + dropdown open + click-outside close + username display).
- **T-055** App router + layout shells (M7): rewrite `routes.tsx` với 6 routes (/, /post/:id, /admin, /admin/create, /auth/login, \*) + lazy load + 2 layouts (AppLayout shell với TopBar/StatusBar slot placeholders cho T-050/T-051 fill, AuthLayout minimal cho Login). ProtectedRoute component check role + Navigate redirect (`requireRole` prop, query `?next=` preserve). `useAuth` hook stub hardcode admin (wire thật M10 với Zustand + cookie session). 5 placeholder pages (PostDetail/Admin/CreatePost/Login + HomePage refactor). 7 integration tests pass (routes.test.tsx — memory router navigate qua mọi path + verify AppLayout vs AuthLayout shell). Xóa `App.tsx` (replaced by AppLayout).
- **T-056** Design tokens alignment với design-file specs (M7 start): fix `glitch` keyframe → text-shadow chroma split (cyan/mag/purple/orange) + skewX transform match Feed.html:55-60 (thay vì translate đơn giản); thêm `scan-line` keyframe 6s linear infinite cho CRT vertical scan effect; bổ sung `::-webkit-scrollbar` rules (5px width, b2 thumb, bg track); thêm utility class `.sb-lbl` (section label `// label` + flex-1 hr line) trong `@layer components` cho aside/panel sections.
- **T-002** Monorepo skeleton: `package.json` + `pnpm-workspace.yaml` + `turbo.json` + `.npmrc` + `.nvmrc` + `packages/`. Turborepo 2.9.14, pnpm 9.15.0, Node 24 LTS. Pipeline tasks build/dev/lint/test/typecheck.
- **T-003** `docker-compose.yml`: 2x Postgres 16-alpine (`postgres-main` :5432 persistent volume, `postgres-test` :5433 tmpfs in-memory) + healthcheck.
- **T-004** Scaffold `apps/api` NestJS skeleton: bootstrap (helmet/compression/cookie-parser/CORS/ValidationPipe/Swagger dev), `common/` (HttpExceptionFilter + Transform/Logging interceptors), `config/env.schema.ts` (Zod fail-fast validate), `prisma/` (nestjs-prisma + Placeholder model). NestJS 10.4, Prisma 5.22, @nestjs/swagger 7.4, helmet 8.
- **T-005** Scaffold `apps/web` Vite + React 19 skeleton: RouterProvider (RR v7 + lazy + Suspense) + QueryClient (TanStack Query 5 + DevTools dev-only) + Tailwind 3.4 (cyberpunk tokens) + shadcn/ui init + Zod env validation + fetch client wrapper + Vitest smoke test.
- **T-006** ESLint 9 flat config + Prettier 3 + Husky 9 + lint-staged + commitlint. Root `eslint.config.mjs` shared base (no-console, no-explicit-any, typescript-eslint) + per-app extends (NestJS, React hooks+refresh). Pre-commit: lint-staged auto-fix + format. Commit-msg: commitlint enforce Conventional Commits. Format baseline áp dụng 28 files.
- `.vscode/` workspace config: `extensions.json` recommend 14 extensions (ESLint, Prettier, Tailwind CSS, Prisma, Vitest, pretty-ts-errors, dotenv, cSpell EN+VI, Docker, YAML, TOML, GitHub PR); `settings.json` (format-on-save + ESLint flat config + Tailwind cva/cn regex + Prisma formatter + file/search excludes + cSpell custom words). `.editorconfig` cross-editor (LF, 2 spaces, max 100). Update `.gitignore` allow track `.vscode/{extensions,settings,launch}.json`.
- **T-007** đóng task: env validation đã có qua Zod (BE `config/env.schema.ts` T-004 + FE `lib/env.ts` T-005). `dotenv-safe` defer permanent — Zod cover cả 2 use case (existence + type/format).
- **M2 milestone hoàn tất** (T-002 → T-007): monorepo scaffold + Docker compose + NestJS skeleton + Vite skeleton + ESLint/Prettier/husky + env Zod validation.
- **T-010** Prisma schema initial migration `20260517165932_init`: 14 entities (User/Post/Image/File/Comment/Like/CommentLike/Tag/PostTag/SavedPost/PostView/AnonymousSession/RefreshToken) + 4 enums (Role/Mood/FileType/CommentStatus). Composite unique constraints (Like/CommentLike per user+post), composite PK (PostTag/SavedPost), indexes feed sort + post view dedup. Add `dotenv-cli` cho `pnpm --filter api prisma:migrate` auto-load `.env.local`. Docker postgres-main port `:5432` → `:5434` (tránh conflict local postgres). M3 started.
- **T-011** Seed scripts: `prisma/seed.ts` (admin upsert + 2 tags + 3 sample posts khác mood + 1 anon comment, idempotent) + `prisma/seed-test.ts` (admin only). Scripts `db:seed` + `db:seed:test` qua dotenv-cli. Deps: `bcrypt 5.1`, `tsx 4.19`. ESLint allow `no-console` cho `prisma/seed*.ts` + `scripts/**` (CLI output).
- **T-012 + T-013** AuthModule full feature (gộp): JwtModule + PassportModule + AuthService (bcrypt + JWT issue/verify + refresh rotation với reuse detection family revoke) + 2 strategies (Jwt + JwtRefresh từ cookie) + 2 guards + DTOs (Register/Login/AuthUser) + Controller 5 endpoints (POST /auth/register|login|refresh|logout, GET /auth/me) + cookie httpOnly setup (sameSite lax dev / none+secure prod). RefreshToken DB hash SHA-256 + tid trong JWT payload. Deps: @nestjs/jwt 10.2, @nestjs/passport 10.0, passport 0.7, passport-jwt 4.0. Smoke test 10 cases pass.
- **T-014 + T-015** UsersModule + common infrastructure (gộp): 4 decorators (@Public/@Roles/@CurrentUser/@AnonymousId) + RolesGuard + AnonymousIdMiddleware (`anon_id` cookie hex `0x7F4A2C` 1yr TTL) + JwtAuthGuard refactor (Reflector-aware @Public skip). UsersService + Controller 5 endpoints: GET /users admin pagination, GET /users/:id (email ẩn cho non-admin/non-self), PATCH /users/:id (admin or self), POST /users/:id/ban (admin, revoke refresh tokens, không ban self/admin), POST /users/:id/unban. Smoke test 10 cases pass (ban kick session ✓).
- **Test infra + retroactive M3 tests** (T-012/13/14/15): BE test pyramid Jest unit (mocked Prisma) + Supertest integration (real postgres-test :5433). Helpers: `tests/_helpers/{test-app,db-reset,factory,auth}.ts` + `jest-global-{setup,teardown}.ts` (migrate + seed test-admin). 47 tests pass (27 unit AuthService/UsersService + 20 integration auth.e2e/users.e2e). Env simplify: rename `apps/api/.env.local` → `apps/api/.env` + new `apps/api/.env.test`. Scripts: `test:e2e` + `test:e2e:migrate` (dotenv-cli wrap .env.test).
- **T-043** Rate limiting (@nestjs/throttler): Global 100/60s/IP + per-endpoint @Throttle 10/min cho POST /auth/register, /auth/login, /posts/:id/comments, /posts/:id/like, /comments/:id/like (NFR-04). skipIf flag `THROTTLE_DISABLED=1` (set trong .env.test) để existing e2e không bị burst-fail. Map ThrottlerException → `RATE_LIMITED` 429 trong HttpExceptionFilter. 2 integration tests (burst verify 429 + global limit không throttle GET browse).
- **T-040** AdminModule (M6 start): 3 endpoints admin-only — GET /admin/stats (4 metrics + 12-day sparkline + deltaToday), GET /admin/moods (zero-filled 7 moods), GET /admin/heatmap (28-day post creation). Helper `bucketByDay` UTC-based zero-fill. Drop overlap với T-014 Users (skip /admin/users + /admin/users/:id/ban), defer /admin/comments/pending + /admin/visitors. 6 unit + 9 integration tests.
- **T-032** SavedModule bookmark (close M5): 2 endpoints auth-only — POST /posts/:id/save toggle, GET /me/saved paginated (sort savedAt DESC). Composite key (userId, postId). Reuse `toPostView` + `POST_INCLUDE` từ PostsService (export thêm 2 symbols). 6 unit + 9 integration tests.
- **T-031** CommentsModule + admin moderation: 4 endpoints (GET role-aware public APPROVED/admin all status, POST optional auth với anonymousName, DELETE admin cascade CommentLike, PATCH /:id/status admin APPROVED|REJECTED). Status default APPROVED. Single controller `@Controller()` no base + per-method guards mix optional/admin (pattern reuse từ LikesController). 15 unit + 19 integration tests.
- **T-030** LikesModule (M5 start): 2 endpoints POST /posts/:id/like + POST /comments/:id/like với JwtOptionalAuthGuard (reuse từ T-021). Identity prefer userId (auth) hoặc anonymousId (anon cookie). Toggle idempotent qua unique constraint Like (postId, userId|anonymousId) + CommentLike. Comment likes chỉ APPROVED, PENDING/REJECTED → 404. Response `{ liked, count }`. 11 unit + 10 integration tests.
- **T-023** TagsModule CRUD + color rotation (close M4): 4 endpoints (GET public top N + POST/PATCH/DELETE admin). `TAG_COLORS` palette 7 cyberpunk colors (DESIGN_SYSTEM.md), cycle theo `tag.count() % 7` khi auto-create. Refactor PostsService inline `tag.upsert` → delegate sang `TagsService.upsertMany(names, tx?)` áp dụng color nhất quán + transaction-aware. 16 unit + 18 integration tests (CRUD + color cycle wrap-around + cascade PostTag + auto-create via Posts).
- **T-022** FilesModule — Cloudinary signed upload + delete: 2 endpoints (POST /files/sign + DELETE /files/:id, admin-only). Dep `cloudinary ^2.10` SDK. `CloudinaryService` wrapper (sign + `destroyMany` best-effort). **Cascade Cloudinary cleanup** hook vào `PostsService.remove()` + `update()` (replace images/files) — fix image/file leak khi T-020 hard delete cascade DB rows. `createTestApp()` override CloudinaryService provider với mock cho integration tests. 3 unit + 9 integration tests.
- **T-021** View tracking POST /posts/:id/view: optional auth via new `JwtOptionalAuthGuard` (reusable cho likes/comments sau). Dedup 30 phút theo userId (auth) hoặc anonymousId (anon, cookie từ AnonymousIdMiddleware). PostView record + Post.viewCount increment trong `$transaction`. Response `{ viewCount, counted }`. 5 unit + 5 integration tests.
- **T-020** PostsModule CRUD (M4 start): 5 endpoints (GET /posts public paginated + mood/tag filter, GET /posts/:id public, POST /posts admin, PATCH /posts/:id admin, DELETE /posts/:id admin hard-cascade). DTOs CreatePostDto/UpdatePostDto (PartialType từ @nestjs/swagger)/ListPostsDto/PostResponseDto + nested ImageInputDto/FileInputDto. Service auto-upsert Tag (lowercase + strip `#` prefix); `$transaction` cho create/update (atomic tag/image/file replace). 14 unit (mock Prisma) + 20 integration (Supertest auth 401/403, validation 400, 404, cascade verify). View tracking defer T-021; Cloudinary signing defer T-022; Tag color rotation defer T-023.
- **CLAUDE.md enforcement**: F1 step 5 strengthened (BẮT BUỘC trước commit, smoke KHÔNG đủ) + Pre-flight Checklist 2 items mới (test paths + test DB infra) + Do NOT bullet cấm commit F1/F2 thiếu test.
- Init git repository (default branch `main`) + `.gitignore` (Node + Turborepo + Vite + NestJS + env secret + IDE + OS). Trunk-based workflow chính thức bắt đầu.

### Changed

- **UI design refactor 2026-05-18** — Global Sidebar (admin nav 220px) và RightPanel (mood.distribution + activity.heatmap + live.visitors) removed khỏi shared layout shell. Feed page giờ centered max-width 820px, không còn 3-col. Aside content di chuyển sang per-page: Admin Dashboard nhận mood.distribution + activity.log, PostDetail nhận post.meta/tags/share/related, CreatePost nhận live.preview. M7 scope co từ 7 → 5 tasks: T-053 Sidebar và T-054 RightPanel DROPPED. Updated `docs/UI_DESIGN.md` (Feed layout + Components + Responsive + Real-time sections), `docs/DESIGN_SYSTEM.md` (Sidebar + RightPanel sections collapsed to DROPPED note; primitives MoodBar / Activity Heatmap / Anonymous Visitor Card vẫn giữ cho consumer pages), `docs/ARCHITECTURE.md` (FE folder structure), `docs/TASKS.md` (T-053/T-054 status + M7 scope note).
- **M6 milestone closed partial (2026-05-18)** — T-040 AdminModule + T-043 Rate limiting hoàn tất; T-041 RealtimeGateway Socket.io + T-042 Activity log persist deferred vào backlog (realtime feature có thể làm hoặc skip tuỳ scope sau). Tỉ lệ tổng: 5/14 → 6/14 milestones (43%).
- Add 2 convention rules vào CODING_CONVENTION.md: (1) cấm string literal union làm enum ảo — define Prisma `enum` (BE) hoặc `as const` + `z.nativeEnum` (FE); (2) cấm `console.*` — dùng NestJS `Logger` (BE) hoặc `loglevel` qua `@/lib/logger` (FE). Refactor `apps/api/src/main.ts` + `apps/web/src/lib/env.ts` xóa console. Cross-ref CLAUDE.md Do NOT + Pre-flight Checklist.
- **Convention change**: test files PHẢI tách khỏi src — chuyển sang `apps/<app>/tests/` (mirror src structure). Move `apps/web/src/App.test.tsx` → `apps/web/tests/App.test.tsx`, `apps/web/src/test/setup.ts` → `apps/web/tests/setup.ts`, `apps/api/test/` → `apps/api/tests/`. Update vitest + jest configs + tsconfig include + e2e config rootDir. Helpers/factories/setup vào `tests/_helpers/`. Imports test → source dùng alias `@/*` (KHÔNG relative). Update CODING_CONVENTION.md + TESTING_STRATEGY.md.
- Split root `.env.example` thành `apps/api/.env.example` (BE vars) + `apps/web/.env.example` (FE `VITE_*` vars). Root file đã xóa — per-app convention chuẩn Turborepo, dễ maintain khi scaffold M2. Update `README.md` + `docs/DEPLOYMENT.md` Quick Start bỏ dòng `cp .env.example .env.local` root.

---

## [0.2.0-alpha] - 2026-05-17

### BREAKING — Migration v1 → v2 (docs + stack)

Major restructure: tech stack chuyển từ Next.js full-stack → monorepo Turborepo (Vite React FE + NestJS BE) + design overhaul cyberpunk theme + SDD docs theo new framework. **Codebase v1 chưa init**, nên không có breaking deps update — chỉ docs refactor + design retarget.

### Changed

- **Tech stack:** Next.js full-stack → Monorepo Turborepo
  - FE: `Vite + React 19 + React Router v7 + TanStack Query + Zustand` (thay Next.js App Router)
  - BE: `NestJS + Passport JWT + bcrypt + class-validator` (thay Next.js API routes + NextAuth)
  - DB: PostgreSQL via `Prisma` qua `nestjs-prisma` (giữ ORM)
  - Storage: Cloudinary signed upload (giữ)
  - Real-time: `WebSocket via @nestjs/websockets + Socket.io` (thay SSE)
  - API contract: OpenAPI 3.0 auto-gen từ `@nestjs/swagger` (thay narrative markdown)
  - Testing: `Vitest (FE) + Jest (BE) + Supertest + Playwright` (thay Vitest + Playwright)
  - Deploy: Vercel (FE static SPA) + Fly.io free tier (BE) + Neon free tier (DB)
  - Local dev: Docker Compose 2 Postgres (main + test)
- **Docs structure** restructure theo SDD principles:
  - REQUIREMENTS.md: thêm Vision + Personas (P1/P2/P3) + Glossary + Use Cases (UC-01→UC-12) + Acceptance Criteria (Given/When/Then) + Traceability mini-matrix
  - ARCHITECTURE.md: C4 diagrams (Context/Container/Component) + 8 ADRs + Security policy + Operations runbook
  - DATA_MODEL.md (rename từ DATABASE_SCHEMA.md): Prisma snippet đầy đủ + migration log summary strategy (chi tiết → `apps/api/docs/MIGRATIONS.md`)
  - API_CONTRACT.md (rename từ API.md): narrative + error catalog + WebSocket events catalog + link tới `contracts/openapi.yaml`
  - UI_DESIGN.md: 5 screens chi tiết theo design source cyberpunk (Feed/Post Detail/Create Post/Admin/Login) + Shared Layout
  - DESIGN_SYSTEM.md: dark-only cyberpunk theme rewrite hoàn toàn — tokens (color/typo/spacing/radius/shadow/motion) + ~25 component primitives + Mood/File color maps + Token versioning
  - CODING_CONVENTION.md: split Universal + Frontend + Backend sections + Security & Performance checklists
  - DEPLOYMENT.md: Vercel + Fly.io + Neon + Docker local + env matrix
  - INDEX.md: navigation updated cho 14 file mới + Doc Update Trigger table
  - PROGRESS.md, TASKS.md, BUGS.md: update template với `Affected layer` field + flow mapping
- **Design system overhaul:** Pastel notebook → Cyberpunk / terminal dark theme (per `design-file/`)
  - Color: deep navy `#0A0E1A` background + cyan `#00FFE5` accent + 8 accent colors
  - Typography: Space Grotesk (brand/heading) + Inter (body) + JetBrains Mono (terminal/code) — thay Plus Jakarta Sans
  - Motion: glitch (9s logo), pulse (online dot), scan line (Login card), CRT scanline overlay
  - Mood emoji EXCITED: 🎉 → ⚡; mood colors update theo design source
  - Light mode removed (TBD)

### Added

- **FR-06: File Attachments** — Admin upload PDF/DOC/DOCX/XLS/XLSX/TXT/CSV (max 20/post, ≤ 20MB) qua Cloudinary signed URL. Hiển thị + download trong PostCard/Post Detail.
- **FR-07: Admin Dashboard** — 4 stat cards với sparkline + mood distribution + users table (ban/view) + comments moderation (approve/delete) + activity log real-time.
- **FR-08: Command Palette** — ⌘K overlay global navigation/actions với filter + keyboard nav.
- **FR-09: Real-time** — WebSocket activity log feed + live visitors panel + online count + comment hot-reload + 28-day activity heatmap.
- Extended: FR-02.5 (file upload), FR-03.5 (comment likes), FR-04.5 (view tracking), FR-04.6 (post views), FR-04.7 (anonymous naming format).
- **8 ADRs** (ARCHITECTURE.md):
  - ADR-001: Monorepo Turborepo
  - ADR-002: NestJS cho backend
  - ADR-003: React Router v7
  - ADR-004: WebSocket via Socket.io
  - ADR-005: Prisma ORM (giữ)
  - ADR-006: JWT trong httpOnly cookie
  - ADR-007: Fly.io BE deploy
  - ADR-008: OpenAPI auto-gen từ NestJS
- **New entities (DATA_MODEL.md):** `File`, `CommentLike`, `PostView`, `AnonymousSession`, `RefreshToken`
- **New enums:** `FileType` (7 values), `CommentStatus` (3 values); extended `Role` với `BANNED`
- **`docs/TESTING_STRATEGY.md`** — extract từ CLAUDE.md + expand đầy đủ test pyramid + tools + data strategy + E2E catalog (E2E-01→E2E-13) + CI plan
- **`docs/contracts/openapi.yaml`** — placeholder (sẽ auto-gen sau khi BE scaffold)
- **Root `README.md`** — quick start + stack overview + link docs/INDEX.md
- **Root `.env.example`** — env matrix theo DEPLOYMENT.md

### Removed

- **`docs/PROMPT.md`** — spec gốc obsolete sau khi đổi stack + theme + features. `REQUIREMENTS.md` mới là single source of truth (Vision + Personas + Use Cases + FR + NFR + Traceability)
- **`docs/DATABASE_SCHEMA.md`** (renamed → `docs/DATA_MODEL.md`)
- **`docs/API.md`** (renamed → `docs/API_CONTRACT.md`)
- **Light mode spec** trong DESIGN_SYSTEM.md (TBD — sẽ document khi có yêu cầu)

### Migration notes

- v1 codebase chưa init → no breaking deps update
- v2 docs là source of truth cho mọi implementation tasks sau này
- Recovery: nếu cần spec gốc cũ, recover từ git history `git show <commit>:docs/PROMPT.md`
- Light mode: recover từ git history khi cần

---

## Template thêm release mới

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- ...

### Changed

- ...

### Deprecated

- ...

### Removed

- ...

### Fixed

- ...

### Security

- ...
```
