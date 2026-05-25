# Progress Tracker

## Trạng thái tổng: 🟢 Implementation Phase (68% — 13/19)

## Milestone

| #     | Milestone                                                                                                                            | Trạng thái            | Ngày target |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ----------- |
| M1    | Setup SDD docs v2 (cyberpunk + monorepo stack)                                                                                       | ✅ Done               | 2026-05-17  |
| M2    | Monorepo scaffold (Turborepo + Docker + apps skeleton)                                                                               | ✅ Done               | 2026-05-17  |
| M3    | Backend NestJS — Auth (JWT) + Users + Prisma schema                                                                                  | ✅ Done               | 2026-05-17  |
| M4    | Backend — Posts + Files (Cloudinary signed upload) + Tags                                                                            | ✅ Done               | 2026-05-18  |
| M5    | Backend — Comments + Likes + CommentLikes + Saved                                                                                    | ✅ Done               | 2026-05-18  |
| M6    | Backend — Admin endpoints (stats, users, moderation) + WebSocket gateway                                                             | ✅ Done (partial 2/4) | 2026-05-18  |
| M7    | Frontend — Layout (TopBar, StatusBar, CommandPalette)                                                                                | ✅ Done               | 2026-05-18  |
| M8    | Frontend — Feed + Post Detail (ImageCarousel + file download)                                                                        | ✅ Done               | 2026-05-18  |
| M9    | Frontend — Create Post + Admin Dashboard                                                                                             | ✅ Done               | 2026-05-18  |
| M10   | Frontend — Login + auth flow + protected routes                                                                                      | ✅ Done               | 2026-05-18  |
| M11   | Real-time integration (Socket.io client + activity log + live visitors)                                                              | ⬜ Todo               |             |
| M11.5 | Tags / Profile / Search / Create Post enhance                                                                                        | ✅ Done               | 2026-05-19  |
| M11.6 | Activity Log (user-scope timeline) — F2 spec + F1 BE/FE                                                                              | ✅ Done               | 2026-05-19  |
| M12   | Testing — unit (FE Vitest + BE Jest) + integration (Supertest) + E2E (Playwright)                                                    | ✅ Done               | 2026-05-18  |
| M13   | Deploy — Vercel FE + Fly.io BE + Neon DB + CI/CD GitHub Actions                                                                      | ⬜ Todo               |             |
| M14   | Monitoring + observability (Sentry + Fly metrics + alert rules)                                                                      | ⬜ Todo               |             |
| M11.7 | Design v2 — Notifications + Admin Manage Posts + Multi-Reactions (FR-14/15/16)                                                       | 🟡 Doing              | 2026-06-05  |
| M11.8 | design-file 2026-05-24 sync + 5 FR amendments + 3 bug fixes (FR-17 AI / FR-03.6 reply / FR-04.7 modal / FR-12 search / FR-14 notifs) | 🟡 Doing              | 2026-06-12  |
| M11.9 | Design-file phase 2 polish — components + token system + page rewrites (18 tasks T-360→T-377; SUPERSEDES M11.7 T-321/322/323)        | ⬜ Todo               | 2026-06-26  |

## Tỉ lệ hoàn thành: 68% (13/19 milestone)

> ⬜ Todo | 🟡 Doing | ✅ Done | 🔴 Blocked

---

## Weekly Log

### 2026-05-25 (Week 2 — M11.8 kickoff)

- **Done (docs-only commits, no code changes):**
  - `24c040e` — design-file 2026-05-24 sync (DESIGN_SYSTEM.md + UI_DESIGN.md, +513/-129 dòng):
    - 10 NEW components grouped (ImageLightbox, PostActionMenu với Save, CommentsModal DEFINITIVE Feed pattern, ReactionIcon 6 SVG line-art, AvatarMenu 7-item, SubBar pattern, LoginCard refresh, Toast pattern, NotifRowBell + NotifRowPage split 2 variants).
    - 8 critical specs UPDATE (PostCard 💬→modal + bỏ SaveButton, NotificationBell SVG bell + threshold 9+, ReactionPicker panel + 250ms debounce, ProfileAvatar 6-bug flag, MOOD_CFG 2 outliers, Glitch 9s→8s).
    - Token system refinement: Z-index scale 9 tiers + Shadow recipes 10 tokens + Motion tokens expanded (5 new keyframes: borderRotate / liveDot / slideIn / slideDown / scanCard).
    - Token Change History entry 2026-05-24 v2.1 với full design-file/ references + 59 drift items flagged.
  - `f9f407a` — F2 amendments (REQUIREMENTS + DATA_MODEL + API_CONTRACT + DEPLOYMENT + BUGS + TASKS, +371/-56 dòng):
    - 5 FR amendments: FR-03.6 reply-to-comment MVP + FR-04.7 CommentsModal Feed pattern DEFINITIVE + FR-12.8-.12 SearchPage expanded scope + FR-14.7-.13 NotificationsPage expanded scope + NEW FR-17 AI Content Generation. NEW UC-22.
    - 4 new API endpoints: POST `/ai/generate` (admin rate-limit 10/min) + GET `/comments/:id/replies` (paginated) + PATCH `/notifications/bulk-read` (bulk action) + DELETE `/notifications/all` (clear all).
    - DATA_MODEL Comment thêm parentId + replyTo + self-relation + index ([parentId]).
    - DEPLOYMENT 4 new env vars (AI_PROVIDER + AI_API_KEY + AI_MODEL + AI_RATE_LIMIT_PER_MIN).
    - 3 user-reported bugs logged trong BUGS.md: BUG-001 ReactionPicker hover gap (High) + BUG-002 ProfileAvatar 6 visual bugs (High) + BUG-003 Login scanCard duration drift (Medium).
    - M11.8 backlog 20 tasks T-340 to T-359 trong TASKS.md (3 F3 bug fixes priority cao + 3 F2 BE prerequisites + 14 F1 implementations).
  - Follow-up commit này (3 audit findings fix): DATA_MODEL full Comment Prisma block sync với delta snippet + CHANGELOG [Unreleased] log toàn bộ amendments + PROGRESS milestone + weekly log.
- **Done thêm (2026-05-25, code):**
  - T-340 DONE: BUG-001 ReactionPicker hover gap fixed — CSS bridge instant close. 9/9 tests pass.
  - T-341 DONE: BUG-002 ProfileAvatar 6 visual bugs fixed (initial commit `4c9b622`). **Plus pixel-exact refinement round** (commits `b492c9d` + `b7b5524`) sau khi initial fix vẫn không match design-file 1:1 — viewBox→concrete sizing fix (stroke 1.76→2px, dash 5.28/3.52→6/4 chuẩn) + color corrections (#FF6E96 rose + #9ECE6A olive) + spacing 3px→4px + explicit `transformOrigin: 50% 50%` cho SVG ring rotation. 5/5 tests pass.
  - T-342 DONE: BUG-003 Login scanCard animation — tailwind cleanup `scan-line 6s` → `scan-card 4s` (TerminalCard đã dùng inline 4s trước). 3/3 tests pass.
  - T-378 DONE: BUG-004 [Low] ADMIN badge vertical alignment + undersized font ở 3 sites (ProfilePage + PostHeader/Feed + PostPreview/CreatePost). Apply `inline-flex items-center` + `leading-none` + `text-mono-sm` (11px, was 9px) + `padding: 1px 6px` + bg tint per `design-file/MyBlog Profile.html L488`. Pure CSS, no regression test. Initial commit `c97e1f0` chỉ fix ProfilePage layout/padding; `668101c` bump font 9→11px; next commit expand sang PostHeader + PostPreview sau user feedback "feed cũng bị".
  - T-360 PARTIAL: Typography base tokens + screen font-size audit sweep (9 commits `701c959`+`6b4f894`+`3c60c0f`+`02bf43f`+`e73b8a5`+`10c02c5`+`6669916`+`2398921`+docs). Add 7 base tokens (mono-md/small/body/h1/h2/h3/display) vào tailwind. Fix font-size drift trên 6 screens (Admin StatCard 24→28, TopBar shared 9→11, ProfilePage handle 18→14, PostContent body 14→15, TerminalCard Login header sizes, Search/Tags StatBox 20-24→28). 313/313 FE tests pass.
  - T-360 Wave 1-3 Full token migration sweep (4 more commits `b653d8a`/`b0ce57c`/`8e06e29`/`3e3f1e2`): full FE codebase swap text-mono-xs (9px) → text-mono-sm (11px) cho 31 files (keep PostCard hex deco), Login/Register form labels 10→11px, hardcoded text-[XYpx] → tokens (38+ occurrences). T-360 token migration ~85% done. Còn lại 19 arbitrary cases (status dots/icons/emoji — no clean token mapping). 313/313 FE tests pass. **Remaining T-360 scope:** Z-index 9 tiers + Shadow recipes 10 tokens + Letter-spacing + Line-height + v2.1 variant tokens (text-h1-hero 26, text-input-hero 18, text-display-sm 24, mono-tiny 7-8, display-glyph 32-48) — vẫn TODO.
- **Pending:** 17 M11.8/M11.9 tasks còn lại. All 4 bug fixes (BUG-001/002/003/004) done. T-361 animation registry now unblocked.
- **Next steps:** T-361 (animation registry verify + cursorBlink + fade-up split) hoặc T-343 BE migration reply comments.
- **Blockers:** Không có technical blocker. 5 FR amendments cần user confirm scope rõ ràng (đã spec đầy đủ trong REQUIREMENTS.md, chỉ chờ F1 task execute).

### 2026-05-24 (Week 2 — M11.7)

- **Done:**
  - T-330: Foundation v2 refresh (typography CSS vars, 5-tier breakpoints, StatusBadge component) — FE 296 tests pass.
  - T-316: BE Reactions — data-preserving migration Like → Reaction + ReactionsModule (upsert/remove/counts/list + 410 legacy) — BE 123 unit + 175 e2e pass.
  - T-310: BE Notifications migration — NotificationType enum + Notification model + 2 indexes — 123 unit pass, tsc clean.
  - T-311: BE NotificationsModule + createNotification() — hooks into ReactionsService (REACTION) + CommentsService (COMMENT), best-effort try-catch — 125 unit pass, tsc clean.
  - T-312: BE Notifications 6 REST endpoints (list/unread-count/mark-read/mark-all/delete/bulk-delete) — 186 e2e pass, tsc clean.
  - T-317: Reactions FE + BE PostView extend (myReaction + topReactions[3] viewer-aware aggregator) — ReactionPicker + ReactionList modal + ReactionButton (replace LikeButton); PostCounts.likes → reactions. 8 FE tests + 3 BE e2e tests added; openapi:sync run. Totals: BE 125 unit + 189 e2e + FE 300 unit = **614 tests**.
  - T-313: FE NotificationBell primitive — bell icon + unread badge (pulsing, 99+) + dropdown 360px (header, tabs All/Unread, time-grouped list, footer view-all link); `useUnreadCount()` polling 30s; wired into TopBar (authed-only). 6 FE tests; global MSW defaults added for notification endpoints. Totals: FE 306 unit = **619 tests**.

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
- **M8 complete ✅ (10/10 done):**
  - Phase A ✅: T-065 primitives, T-062 PostContent, T-063 ImageGrid, T-064 FileAttachments, T-060 FeedPage + foundation, T-061 PostCard full.
  - Phase B ✅: T-066 PostDetailPage + MetaPanel + useTrackView, T-067 ImageCarousel, T-068 CommentForm post-as-anon, T-069 CommentItem + CommentList wire vào PostDetailPage.
  - Total **103 FE tests pass** (BE 227 + FE 103 = 330 tests).
- **M9 Phase A complete ✅ (6/10 done):**
  - T-071 MoodPicker, T-072 MarkdownEditor + wrapSelection, T-073 UploadZone Cloudinary, T-074 TagInput, T-075 PostPreview.
  - ✅ **T-070** CreatePostPage assemble: 2-col split (editor flex-1 + preview 380px hidden < 900px) + sub-toolbar + 5 sections + useCreatePost POST /posts → navigate /post/:id + ⌘S/⌘↵ shortcuts + status state machine. 4 tests. Total **134 FE tests**.
- **M9 complete ✅ (10/10 done):**
  - Phase A ✅ (T-070/T-071/T-072/T-073/T-074/T-075): Create Post page + 5 components + Cloudinary direct upload.
  - Phase B ✅ (T-076/T-077/T-078/T-079): Admin dashboard + StatCard/Sparkline + MoodBar + ActivityLogItem + UsersTable + AdminPage.
  - Total **155 FE tests pass** (BE 227 + FE 155 = **382 tests** project-wide).
- **M10 complete ✅ (5/5 done):**
  - T-092 foundation auth store + 401 interceptor.
  - T-090 LoginPage terminal card.
  - T-093 ProtectedRoute hydrating-aware.
  - T-094 Avatar dropdown wire Logout + guest variant.
  - T-091 RegisterPage skeleton.
  - Total **181 FE tests pass** (BE 227 + FE 181 = **408 tests** project-wide).
- **M12 complete ✅ (5/5 done):**
  - T-110 BE unit audit + cloudinary gap-fill (112 BE unit).
  - T-111 BE integration audit (123 BE integration, 28 endpoints all happy+negative).
  - T-112 FE unit audit + use-like/use-save/saved.ts gap-fill (188 FE unit).
  - T-113 Playwright scaffolding + 13 specs (8 functional, 5 skip with reason) + `POST /admin/test-reset` endpoint env-gated.
  - T-114 GitHub Actions CI matrix 5 jobs (lint-typecheck + web-unit + api-unit + api-integration + e2e với postgres service + Playwright browser cache).
- **M11.5 complete ✅ (17/17 done, 2026-05-19):**
  - Wave 1 quick wins: T-200 Copy link · T-201 sort dropdown · T-202 moderation queue · T-203 `/saved` route.
  - Wave 2 Tags (FR-10): T-210 BE (description + sparkline + sort/q + force delete) · T-211 primitives · T-212 `/tags` page.
  - Wave 3 Profile (FR-11): T-220 BE (title/bio/skills migration + by-username + stats + change-password) · T-221 ProfilePage + ProfileAvatar/HeatmapGrid · T-222 EditProfileDrawer + SkillChipInput · T-223 `/me` + nav wire.
  - Wave 4 Search (FR-12): T-230 BE multi-table ILIKE + throttle · T-231 SearchPage + BigSearchInput + ResultCard · T-232 TopBar hideSearch · T-233 useRecentSearches · T-234 CommandPalette fix.
  - Wave 5 Emoji (FR-02.7): T-240 EmojiPicker popover 4×16 + insertAt cursor.
  - Tests: BE 119 unit + 161 integration + FE 285 unit = **565 total**.
  - Commits range: `39e8e03` → `ff93b0c`.
- **M11.6 complete ✅ (2/2 done, 2026-05-19):**
  - **F2 spec docs (6 file):** FR-13 Activity Log + UC-16 + Glossary admin vs user-scope (REQUIREMENTS); ActivityLog model + 2 enum + migration `add_activity_log` v0.3.1-alpha (DATA_MODEL); `GET /users/:id/activity` JwtAuthGuard + visibility + direction-aware response (API_CONTRACT); Profile Activity tab direction-aware text + infinite scroll + 403 fallback + deleted target degrade (UI_DESIGN); ProfileActivityItem variant của ActivityLogItem admin (DESIGN_SYSTEM); T-300 + T-301 backlog (TASKS).
  - **F1 BE (T-300):** migration `add_activity_log` + ActivityModule (service + controller + DTO) + 4 service hooks (Posts/Comments/Likes/Saved create events, skip anonymous + skip unlike/unsave) + GET /users/:id/activity endpoint. 7 unit + 8 integration = +15 BE tests (126 unit + 169 integration).
  - **F1 FE (T-301):** types thủ công trong api.ts (do T-302 deferred) + services/api/activity.ts + useUserActivity infinite query + qk.users.activity key + ProfileActivityList component + ProfilePage tab wire (canViewSaved gate). 5 FE tests (+5 → 290).
  - Tests total: 295 BE + 290 FE = **585 tests** (was 565).
  - Commits: `56f098d` (B1 F2 spec) + `a7b45e8` (B2 BE) + `4342973` (B3 FE).
- **T-009 partial (2026-05-19):** OpenAPI auto-gen scripts + CI drift check done (Wave A1+A3, commits `a48e8ac` + `10ec012`). Wave A2 cutover defer → T-302 (~6-9h) khi rảnh.
- **Next:**
  - M11 Real-time integration (Socket.io + live visitors + admin activity broadcast) — reopen T-041/T-042.
  - Hoặc M13 Deploy infra (Vercel + Fly.io + Neon).
  - Hoặc M14 Monitoring (Sentry + Fly metrics).
  - Tech debt: T-302 OpenAPI cutover (fix 15+ BE decorator gap + aliases.ts + migrate 38 imports).

### 2026-05-24 — F2 spec M11.7 + design v2 baseline

- **Done:**
  - ✅ Design v2 overhaul commit baseline `a56ee72`: 2 screen mới (Manage Posts, Notifications) + 8 screen cũ refresh + foundation (NotificationBell primitive, typography +1px, 5-tier responsive, image lightbox, status badge palette).
  - ✅ F2 docs spec done M11.7 (Notifications + Admin Manage Posts + Multi-Reactions):
    - REQUIREMENTS: FR-14 Notification System (6 sub) + FR-15 Admin Manage Posts (6 sub) + FR-16 Multi-Reaction System (6 sub) + NFR-06 Pagination (universal) + UC-17/18/19/20/21 + 6 glossary terms
    - DATA_MODEL v0.4.0-alpha: Notification entity + rename Like → Reaction (+ ReactionType 6 values) + Post.status (PostStatus enum) + 3 enum mới
    - API_CONTRACT: 6 Notifications + 4 Reactions + 3 Admin Posts endpoints + WS `notification:new` / `reaction:new`
    - UI_DESIGN screen 11 (Notifications) + screen 12 (Manage Posts)
    - DESIGN_SYSTEM v2.0: NotificationBell + ReactionPicker + ReactionList + StatusBadge PostStatus variant + typography v2 note + 5-tier breakpoint note
    - TASKS M11.7: 17 task T-310→T-334 (Foundation 1 + Reactions 2 + Notifications 6 + Admin Posts 4 + Polish 4)
- **Done thêm (2026-05-24):**
  - ✅ T-330 Foundation refresh — typography CSS vars v2 (`--fs-ui` 11px / `--fs-ui-text` 13px / `--fs-body` 15px) + Tailwind 5-tier max-width screens (`mx-980/760/640/480/420`) + StatusBadge component (variant `post`, palette PUBLISHED/DRAFT/ARCHIVED) + `status-config.ts`. Tests: 2 file (6 case) pass. M11.7 Foundation cleared cho downstream task.
- **Doing:** M11.7 F1 — 6/17 done (Foundation + BE Reactions + BE Notifications + FE Reactions T-317).
- **Next:** F1 order remaining: FE Notifications T-313/314 → BE Admin Posts T-320 → FE Admin Posts T-321/322/323 → Polish T-331/332/333/334. WS realtime T-315 defer-able.

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
