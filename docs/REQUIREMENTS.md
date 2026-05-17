# Product Requirements

> Single source of truth cho **WHAT** & **WHY** của MyBlog. Cho **HOW**: xem [ARCHITECTURE.md](./ARCHITECTURE.md), [DATA_MODEL.md](./DATA_MODEL.md), [API_CONTRACT.md](./API_CONTRACT.md).

## Vision

MyBlog là **social blog cá nhân** của 1 admin (chủ sở hữu) — nơi admin đăng bài (text + ảnh + file + mood + tag) như một sổ tay digital, bạn bè (auth user) và khách (anonymous) có thể đọc, like, comment, save, share.

Khác biệt so với MXH thường: **single-author** (không phải user-generated content rộng), **terminal/cyberpunk aesthetic** (developer-centric), **trải nghiệm minh bạch** (admin dashboard real-time, command palette quick nav).

## Personas

### P1: Admin (Chủ sở hữu)

- 1 người duy nhất
- Mục tiêu: post content cá nhân, theo dõi tương tác, moderate comment, quản lý user
- Nhu cầu: tạo bài nhanh (markdown + drag-drop ảnh/file), xem stats, ban troll, ⌘K shortcut

### P2: Auth User (Bạn bè / Subscriber)

- Đăng ký account (username + password)
- Mục tiêu: theo dõi bài viết admin, lưu bài hay, comment dưới tên thật, like
- Nhu cầu: feed sạch, profile cá nhân, saved list

### P3: Anonymous (Khách)

- KHÔNG đăng ký
- Mục tiêu: đọc bài, like, comment với tên tự nhập, share
- Nhu cầu: zero-friction (không cần đăng ký), được tôn trọng (không bị track quá mức)

## Glossary

| Term            | Definition                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Mood            | Trạng thái cảm xúc của bài viết (1 trong 7: HAPPY, EXCITED, THOUGHTFUL, CALM, SAD, GRATEFUL, ANGRY) |
| Tag             | Hashtag user-generated (`#travel`, `#code`) — Admin gắn vào bài                                     |
| Anonymous ID    | UUID/hex ID lưu trong cookie để track anonymous user (vd: `Anon#7`, `0x7F·4A2C`)                    |
| Session         | Connection của user/anonymous từ browser → server (track cho live visitors)                         |
| Activity        | Sự kiện như like/comment/save/new-session — hiển thị trong Admin activity log                       |
| Command Palette | Overlay ⌘K cho quick navigation/actions                                                             |
| Affected layer  | Phân loại task: `FE` (frontend) / `BE` (backend) / `Both` / `Infra`                                 |

## Use Cases

> Mỗi UC có: actor, precondition, main flow, alternative, postcondition.

### UC-01: Admin tạo bài viết

- **Actor:** Admin (P1)
- **Precondition:** Đã đăng nhập với role ADMIN
- **Main flow:**
  1. Vào `/admin/create`
  2. Chọn mood (1 trong 7 emoji)
  3. Viết content (markdown — support text + code block)
  4. (Optional) Upload ảnh (max 10, ≤ 5MB each)
  5. (Optional) Upload file (max 20, ≤ 20MB each, PDF/DOC/DOCX/XLS/XLSX/TXT/CSV)
  6. (Optional) Thêm tag (`#xxx`)
  7. Click "⌘↵ Publish"
- **Alternative:** Save Draft (⌘S) — chưa publish, lưu local
- **Postcondition:** Bài hiển thị ở top Feed; admin redirect tới `/post/[id]`

### UC-02: User xem feed

- **Actor:** Tất cả (P1, P2, P3)
- **Precondition:** —
- **Main flow:**
  1. Vào `/` (Feed)
  2. Xem danh sách bài (sort by `createdAt DESC`)
  3. Scroll xuống → auto load thêm (infinite scroll, 10 bài/lần)
  4. (Optional) Filter theo mood / tag
- **Postcondition:** —

### UC-03: User/Anonymous xem chi tiết bài

- **Actor:** Tất cả
- **Precondition:** Bài tồn tại
- **Main flow:**
  1. Click PostCard hoặc vào `/post/[id]`
  2. Xem full content + image carousel + file attachments + tags
  3. View count tăng (debounce, 1 lần / 30 phút / session)
- **Postcondition:** `Post.viewCount` tăng

### UC-04: Anonymous like + comment

- **Actor:** Anonymous (P3)
- **Precondition:** Bài tồn tại
- **Main flow (like):**
  1. Click ❤ → cookie `anonymousId` track
  2. Like count tăng, button đổi state
  3. Click lại → unlike (toggle)
- **Main flow (comment):**
  1. Vào `/post/[id]`
  2. Nhập content, (optional) nhập tên hiển thị (`anonymousName`)
  3. Click Send → comment hiển thị (status `PENDING` chờ admin approve hoặc `APPROVED` tự động tuỳ config)
- **Alternative (comment):** Toggle "post as anon" off → comment với role anon mặc định
- **Postcondition:** Like/Comment được lưu DB; hiển thị real-time qua WebSocket cho mọi viewer

### UC-05: Auth user save bài

- **Actor:** Auth User (P2)
- **Precondition:** Đã đăng nhập
- **Main flow:**
  1. Click 🔖 trên PostCard hoặc Post Detail
  2. Bài được lưu vào `SavedPost` table
  3. Truy cập `/me/saved` để xem list
- **Postcondition:** `SavedPost` record tạo; UI button đổi state `saved`

### UC-06: User share bài

- **Actor:** Tất cả
- **Precondition:** —
- **Main flow:**
  1. Click ↗ Share trên PostCard hoặc Post Detail
  2. Chọn target: Facebook / X / Telegram / Copy Link
  3. Open share dialog của MXH OR copy URL vào clipboard
- **Postcondition:** —

### UC-07: Admin moderate comment

- **Actor:** Admin (P1)
- **Precondition:** Có comment status `PENDING`
- **Main flow:**
  1. Vào `/admin`
  2. Xem section Comments Moderation (số pending hiển thị badge)
  3. Click ✓ Approve hoặc ✕ Delete trên từng comment
- **Postcondition:** Comment đổi status `APPROVED` hoặc bị xóa

### UC-08: Admin quản lý user

- **Actor:** Admin (P1)
- **Precondition:** Có user trong DB
- **Main flow:**
  1. Vào `/admin`
  2. Xem Users table (username, role, last seen, posts count)
  3. Click Ban → user role bị mark `BANNED` (không login được)
  4. Click View → xem profile + lịch sử comment
- **Postcondition:** User status update; KHÔNG được ban role ADMIN

### UC-09: Anonymous đăng ký thành Auth User

- **Actor:** Anonymous → Auth User
- **Precondition:** —
- **Main flow:**
  1. Vào `/auth/register` (link từ Login page)
  2. Nhập username + password (+ optional email)
  3. Submit
  4. Auto redirect tới `/` với session
- **Postcondition:** User record tạo với role `USER`

### UC-10: User đăng nhập

- **Actor:** Anonymous → Admin/Auth User
- **Precondition:** Có account
- **Main flow:**
  1. Vào `/auth/login`
  2. Nhập username + password
  3. Submit → BE issue JWT access (15min) + refresh (30d) trong httpOnly cookie
  4. Redirect `/` (hoặc `?next=...` redirect target)
- **Alternative:** Click "Continue as anonymous" → redirect `/` không tạo session

### UC-11: Real-time activity (Admin)

- **Actor:** Admin (P1)
- **Precondition:** Admin xem `/admin`, WebSocket connected
- **Main flow:**
  1. WS event `like:new` / `comment:new` / `save:new` / `visitor:join` → activity log feed update real-time
  2. Live visitors panel update khi anonymous user truy cập (Feed RightPanel)
  3. Online count update trên TopBar/StatusBar
- **Postcondition:** —

### UC-12: ⌘K Command Palette

- **Actor:** Tất cả (auth role tương ứng)
- **Precondition:** Trên bất kỳ trang nào
- **Main flow:**
  1. Press ⌘K (hoặc Ctrl+K)
  2. Overlay xuất hiện
  3. Type query → filter actions/nav
  4. Press ↵ chọn → execute (navigate hoặc action)
- **Postcondition:** Navigate hoặc trigger action

## Functional Requirements

### FR-01: Quản lý người dùng

- **FR-01.1:** Đăng ký user mới (username + password, optional email)
- **FR-01.2:** Đăng nhập qua JWT (access 15min + refresh 30d)
- **FR-01.3:** 3 role: `ADMIN`, `USER`, `ANONYMOUS`. Anonymous KHÔNG có record User table — track qua cookie ID
- **FR-01.4:** Admin được khởi tạo qua seed script (env `ADMIN_USERNAME`, `ADMIN_PASSWORD`)
- **FR-01.5:** Admin có thể ban user (role `USER` → `BANNED`). KHÔNG được ban admin
- **Acceptance Criteria (Given/When/Then):**
  - Given user submit valid credentials → When click Login → Then nhận httpOnly cookie với JWT, redirect `/`
  - Given user submit invalid credentials → When click Login → Then nhận error `[ERROR] invalid credentials`, KHÔNG có cookie
  - Given admin ban user X → When user X login → Then bị reject với error `account banned`
- **Linked UCs:** UC-09, UC-10, UC-08
- **Linked Tests:** E2E-01, E2E-09 (xem [TESTING_STRATEGY.md](./TESTING_STRATEGY.md))

### FR-02: Bài viết (Post)

- **FR-02.1:** Chỉ ADMIN đăng/sửa/xóa bài
- **FR-02.2:** Bài viết có: `content` (markdown text), `images[]`, `files[]`, `mood`, `tags[]`
- **FR-02.3:** Upload ảnh: max 10 ảnh/bài, ≤ 5MB each, format PNG/JPG/WebP (Cloudinary)
- **FR-02.4:** `mood` ∈ {HAPPY, EXCITED, THOUGHTFUL, CALM, SAD, GRATEFUL, ANGRY}
- **FR-02.5:** Upload file: max 20 files/bài, ≤ 20MB each, format PDF/DOC/DOCX/XLS/XLSX/TXT/CSV (Cloudinary signed upload)
- **FR-02.6:** Content support markdown (paragraph, bold, italic, code block, link, heading)
- **Acceptance:**
  - Given admin có bài với 10 ảnh + 20 file + 5 tag + content 10000 ký tự → When publish → Then bài hiển thị đầy đủ ở Feed
  - Given non-admin user → When call `POST /posts` → Then nhận 403 FORBIDDEN
- **Linked UCs:** UC-01
- **Linked Tests:** E2E-02, E2E-03, E2E-11

### FR-03: Tương tác (Like, Comment, Save)

- **FR-03.1:** Like cho post — cho cả auth user lẫn anonymous (anonymous track qua cookie `anonymousId`). Unique `(postId, userId)` HOẶC `(postId, anonymousId)`
- **FR-03.2:** Comment cho post — auth user dùng tên user; anonymous nhập `anonymousName`. Status mặc định `APPROVED` (configurable: nếu admin bật moderation queue → mặc định `PENDING`)
- **FR-03.3:** Save bài — CHỈ auth user, lưu vào `SavedPost`. Xem ở `/me/saved`
- **FR-03.4:** Admin có thể xóa hoặc moderate (approve/reject) comment
- **FR-03.5:** Like cho comment — tương tự like cho post (auth + anonymous), bảng `CommentLike` riêng
- **Acceptance:**
  - Given anonymous đã like post X → When click lại → Then unlike, count giảm
  - Given auth user save post X → When vào `/me/saved` → Then thấy post X
  - Given admin xóa comment Y → When user khác load lại → Then không thấy comment Y
- **Linked UCs:** UC-04, UC-05, UC-07
- **Linked Tests:** E2E-04, E2E-05, E2E-10

### FR-04: Hiển thị (Feed, Detail, Filter)

- **FR-04.1:** Feed sort `createdAt DESC`
- **FR-04.2:** Infinite scroll — page size 10
- **FR-04.3:** Filter theo mood (single select) hoặc tag (click vào TagPill)
- **FR-04.4:** Post Detail tại `/post/[id]` — full content + ImageCarousel (prev/next + dot indicator)
- **FR-04.5:** View tracking — increment `Post.viewCount` 1 lần / 30 phút / session (dedupe via cookie hoặc userId)
- **Acceptance:**
  - Given feed có 25 bài → When load → Then 10 bài đầu hiển thị, scroll → load 10 tiếp
  - Given filter `mood=HAPPY` → Then chỉ hiển thị bài mood HAPPY
  - Given user xem post 5 lần trong 30 phút → Then viewCount chỉ +1
- **Linked UCs:** UC-02, UC-03
- **Linked Tests:** E2E-04, E2E-06

### FR-05: Share

- **FR-05.1:** Share lên Facebook, X (Twitter), Telegram
- **FR-05.2:** Copy link clipboard
- **FR-05.3:** Open Graph meta tags cho preview link (title, description, image, type)
- **Acceptance:**
  - Given click "Copy link" → Then clipboard chứa URL `https://<domain>/post/<id>`
  - Given paste link vào Facebook/X → Then preview hiển thị title + image
- **Linked UCs:** UC-06
- **Linked Tests:** E2E-07

### FR-06: File Attachments

- **FR-06.1:** Admin upload file (PDF/DOC/DOCX/XLS/XLSX/TXT/CSV) khi tạo bài, max 20 files/bài, ≤ 20MB each
- **FR-06.2:** File hiển thị trong PostCard (Feed) + Post Detail dưới dạng card với type badge + name + size + download button
- **FR-06.3:** Download link (signed URL từ Cloudinary)
- **FR-06.4:** Delete file (admin only) — soft delete trong DB + remove from Cloudinary
- **Acceptance:**
  - Given admin upload 20 file PDF → When publish → Then 20 file hiển thị
  - Given user click download → Then file tải về với name gốc
  - Given file 25MB → When upload → Then BE reject với error `[ERROR] file size exceeds 20MB limit`
- **Linked UCs:** UC-01
- **Linked Tests:** E2E-11

### FR-07: Admin Dashboard

- **FR-07.1:** Stats cards (4 metrics: posts/likes/comments/views) với sparkline 12 buckets + delta today
- **FR-07.2:** Mood distribution chart — bar chart % theo từng mood
- **FR-07.3:** Users table (username, role, last seen, posts count) với Ban/Unban + View actions
- **FR-07.4:** Comments moderation queue (status PENDING/APPROVED) với Approve/Delete actions + badge số pending
- **FR-07.5:** Activity log feed (likes/comments/saves/new-sessions) — real-time qua WebSocket
- **Acceptance:**
  - Given có 5 comment status PENDING → When admin vào `/admin` → Then thấy badge "5 pending"
  - Given admin click Approve cho comment Y → Then status đổi `APPROVED`, badge giảm
- **Linked UCs:** UC-07, UC-08, UC-11
- **Linked Tests:** E2E-09, E2E-10, E2E-12

### FR-08: Command Palette (⌘K)

- **FR-08.1:** Press ⌘K (Mac) hoặc Ctrl+K (Win/Linux) → overlay xuất hiện
- **FR-08.2:** Filter actions/nav theo query string
- **FR-08.3:** Keyboard navigation (↑↓ + ↵ + Esc)
- **FR-08.4:** Groups: `navigate` (Feed, Saved, Tags, Admin, Create Post) + `actions` (Toggle theme, Logout)
- **Acceptance:**
  - Given user trên `/` → When press ⌘K → Then overlay xuất hiện trong < 100ms
  - Given query "post" → Then chỉ items match được show
  - Given press Esc → Then overlay đóng
- **Linked UCs:** UC-12
- **Linked Tests:** E2E-13

### FR-09: Real-time (WebSocket)

- **FR-09.1:** Activity log feed (Admin) update real-time khi có like/comment/save/new-session event
- **FR-09.2:** Live visitors panel (Feed RightPanel) update khi anonymous join/leave session
- **FR-09.3:** Activity heatmap (28-day grid post count per day) update khi có post mới
- **FR-09.4:** Online users count (TopBar badge + StatusBar) update real-time
- **FR-09.5:** Comment mới hiển thị trên Post Detail của mọi viewer connected (không cần refresh)
- **Acceptance:**
  - Given admin xem `/admin`, anonymous A like post X → Within 2s admin thấy event trong activity log
  - Given anonymous mới truy cập `/` → Within 2s online count tăng cho mọi viewer
- **Linked UCs:** UC-04, UC-11
- **Linked Tests:** E2E-12

## Non-Functional Requirements

- **NFR-01: Performance API** — Response time p95 < 500ms. Measurement: Sentry transactions, Fly metrics.
- **NFR-02: Responsive UI** — Mobile-first, ≥ 320px không overflow horizontal. Breakpoints: mobile (< 640), tablet (640-1024), desktop (> 1024). Measurement: manual + Playwright viewport tests.
- **NFR-03: Lighthouse score** — Performance ≥ 85, Accessibility ≥ 85, SEO ≥ 90 cho mỗi public page (`/`, `/post/:id`, `/auth/login`). Measurement: `pnpm dlx unlighthouse --site <url>` weekly.
- **NFR-04: Security** — bcrypt cost ≥ 10, CSRF protection (httpOnly cookie + SameSite=Strict), rate limit 10 req/min/IP cho register/comment/like, input validation (class-validator BE + Zod FE), XSS sanitization (DOMPurify), CORS chỉ allow FE origin. Measurement: [CODING_CONVENTION.md > Security Checklist](./CODING_CONVENTION.md) + Sentry alerts.
- **NFR-05: SEO** — Meta tags (title, description, OG, Twitter Card), sitemap.xml, robots.txt, structured data JSON-LD cho Post. Measurement: Google Search Console index + Lighthouse SEO.

## Out of Scope

- **Multi-author / multi-tenant** — chỉ 1 admin
- **Email notification** — không gửi email khi có comment/like
- **Push notification** — không có WebPush hay native
- **Real-time edit collaborative** (Google Docs style)
- **Video upload** — chỉ ảnh + file document
- **Search full-text engine** (Elasticsearch) — dùng Postgres LIKE/ILIKE đơn giản
- **i18n (multi-language)** — chỉ Tiếng Việt + tech terms tiếng Anh
- **Mobile native app** — chỉ web responsive
- **Light mode UI** — chỉ dark theme (TBD: sẽ document khi có yêu cầu)

## Traceability Mini-Matrix

| FR    | Linked UCs          | E2E Test               | BE Module                    | FE Page/Component                               |
| ----- | ------------------- | ---------------------- | ---------------------------- | ----------------------------------------------- |
| FR-01 | UC-09, UC-10, UC-08 | E2E-01, E2E-09         | AuthModule, UsersModule      | LoginPage, RegisterPage, AdminPage > UsersTable |
| FR-02 | UC-01               | E2E-02, E2E-03         | PostsModule, FilesModule     | CreatePostPage                                  |
| FR-03 | UC-04, UC-05, UC-07 | E2E-04, E2E-05, E2E-10 | LikesModule, CommentsModule  | PostCard, CommentItem                           |
| FR-04 | UC-02, UC-03        | E2E-04, E2E-06         | PostsModule                  | FeedPage, PostDetailPage                        |
| FR-05 | UC-06               | E2E-07                 | (BE: OG meta in SSR/sitemap) | SharePanel                                      |
| FR-06 | UC-01               | E2E-11                 | FilesModule                  | UploadZone, FileAttachments                     |
| FR-07 | UC-07, UC-08, UC-11 | E2E-09, E2E-10, E2E-12 | AdminModule                  | AdminPage                                       |
| FR-08 | UC-12               | E2E-13                 | — (pure FE)                  | CommandPalette                                  |
| FR-09 | UC-04, UC-11        | E2E-12                 | RealtimeGateway              | useWebSocket hook, Activity feed components     |

---

## Template thêm FR mới

```markdown
### FR-XX: <Nhóm chức năng>

- **FR-XX.1:** <yêu cầu cụ thể>
- **FR-XX.2:** ...
- **Acceptance Criteria (Given/When/Then):**
  - Given ... → When ... → Then ...
- **Linked UCs:** UC-YY
- **Linked Tests:** E2E-ZZ, unit `path/to/test.spec.ts`
```

## Template thêm NFR mới

```markdown
- **NFR-XX:** <yêu cầu phi chức năng> — Measurement: <metric + công cụ đo>
```

## Template thêm Use Case mới

```markdown
### UC-XX: <Tên use case>

- **Actor:** <Pn>
- **Precondition:** ...
- **Main flow:**
  1. ...
- **Alternative:** ...
- **Postcondition:** ...
```
