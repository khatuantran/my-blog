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

| Term             | Definition                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mood             | Trạng thái cảm xúc của bài viết (1 trong 7: HAPPY, EXCITED, THOUGHTFUL, CALM, SAD, GRATEFUL, ANGRY)                                                                                                 |
| Tag              | Hashtag user-generated (`#travel`, `#code`) — Admin gắn vào bài                                                                                                                                     |
| Anonymous ID     | UUID/hex ID lưu trong cookie để track anonymous user (vd: `Anon#7`, `0x7F·4A2C`)                                                                                                                    |
| Session          | Connection của user/anonymous từ browser → server (track cho live visitors)                                                                                                                         |
| Activity         | Sự kiện như like/comment/save/new-session. **Admin-scope** (FR-07.5): toàn-cục real-time. **User-scope** (FR-13): per-user persistent log (POST/COMMENT/LIKE/SAVE created) cho Profile Activity tab |
| Command Palette  | Overlay ⌘K cho quick navigation/actions                                                                                                                                                             |
| Affected layer   | Phân loại task: `FE` (frontend) / `BE` (backend) / `Both` / `Infra`                                                                                                                                 |
| Skill            | Item kỹ năng trong profile user — `{ name: string, color: string }` (vd `{ name:'TypeScript', color:'#7DCFFF' }`)                                                                                   |
| Heatmap          | Grid 28 ô (4 tuần × 7 ngày) biểu diễn count theo ngày (post creation hoặc activity). Intensity 4 mức opacity                                                                                        |
| Notification     | Tin báo cho user khi có engagement event trên post của mình. Recipient = user nhận, Actor = user gây event. Stored append-only với flag `read` toggle                                               |
| Engagement event | Hành động tạo notification: REACTION (react post), COMMENT (comment trên post của mình), REPLY (reply comment của mình), SHARE. KHÔNG tính remove-reaction/uncomment/unsave                         |
| NotificationBell | UI primitive trong TopBar — bell icon + badge unread pulsing + dropdown 10 items gần nhất + link "view all →" sang `/notifications`                                                                 |
| PostStatus       | Trạng thái bài viết: `PUBLISHED` (hiện feed), `DRAFT` (chỉ admin thấy trong Manage Posts), `ARCHIVED` (ẩn feed nhưng còn nav trực tiếp được)                                                        |
| Reaction         | Multi-type interaction trên post (thay binary Like cũ). User chọn 1 trong 6 type; chọn lại type khác = đổi; chọn cùng type = remove (toggle off)                                                    |
| ReactionType     | Enum 6 giá trị: LIKE 👍, LOVE ❤️, HAHA 😆, WOW 😮, SAD 😢, ANGRY 😡                                                                                                                                 |

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
  1. WS event `reaction:new` / `comment:new` / `save:new` / `visitor:join` → activity log feed update real-time
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

### UC-13: Browse tags + Admin quản lý tag

- **Actor:** USER/ANON (browse) + ADMIN (manage)
- **Precondition:** Có ≥1 tag trong DB
- **Main flow:**
  1. Click "Tags" trong CommandPalette hoặc trực tiếp `/tags`
  2. Trang hiển thị 4 stat cards (Total tags / Tagged posts / Most used / Recently added) + toolbar (search + sort + grid/list toggle)
  3. Grid TagCard hiển thị: name + color swatch + description + post count + 7-day sparkline + progress bar
  4. Click TagCard → navigate `/?tag=name` (Feed filtered)
- **Alternative (ADMIN):**
  - Click `[ + New Tag ]` → TagModal (name + color picker + description) → submit POST /tags
  - Hover TagCard → `✎ Edit` / `🗑 Delete` actions
  - Delete: nếu tag đã gán post → cảnh báo count, double-confirm
- **Postcondition:** Tag list cập nhật + cache invalidate

### UC-14: User xem profile + edit own profile

- **Actor:** Tất cả role (xem) + Self (edit)
- **Precondition:** User tồn tại
- **Main flow:**
  1. Navigate `/profile/:username` hoặc `/me` (auto-redirect tới `/profile/:ownUsername`)
  2. Trang render hero (avatar rotating ring + name + role + title + bio + stats inline) + 4 tabs (Posts/Saved/Activity/About) + right sidebar (about + skills + mood.breakdown + heatmap28d + tags.used)
  3. Self: click `[ ✎ Edit Profile ]` → drawer slide-in (title + bio + skills chip input + change password section)
  4. Submit profile section → PATCH /users/:selfId
  5. Submit security section → POST /auth/change-password (verify current pw + token rotation)
- **Alternative:**
  - Saved tab: chỉ self/admin thấy (privacy)
  - Tab state qua `?tab=` query param
- **Postcondition:** Profile mới sync hiển thị

### UC-15: Anonymous/User search bài viết

- **Actor:** Tất cả role
- **Precondition:** Bài viết có content khớp query
- **Main flow:**
  1. Type query vào TopBar search input → Enter
  2. Navigate `/search?q=…` (TopBar tự ẩn search input trên trang Search để tránh duplicate)
  3. Hero search input + filter chips (All/Saved/Files + 5 mood emoji)
  4. Postgres ILIKE multi-table → result cards với highlight match
  5. Right sidebar: 4 stat cards + mood shortcuts + recent.searches + browse.tags
  6. Click tag pivot → navigate `/?tag=` feed
- **Alternative:** Empty query → default browse view với stats only
- **Postcondition:** Recent searches lưu localStorage (max 10, FIFO dedupe)

### UC-16: User xem activity timeline (self/admin)

- **Actor:** Authed user (self) hoặc Admin (xem bất kỳ user)
- **Precondition:** Đã login + đứng tại `/profile/:username`
- **Main flow:**
  1. Click tab "Activity" trong ProfilePage (tab chỉ visible với self hoặc admin)
  2. FE call `GET /users/:id/activity?page=1&limit=20`
  3. List ProfileActivityItem hiển thị: icon per type + text direction-aware (OUTGOING `You liked <post snippet>` / INCOMING `<actor> commented on your post`) + relative time
  4. Scroll xuống → IntersectionObserver sentinel → load page tiếp
  5. Click vào target snippet → navigate `/post/:id`
- **Alternative:** Target đã bị xoá → snippet = `[deleted post]`, link disabled
- **Postcondition:** Activity timeline cập nhật real-time khi user/others tạo event mới (defer M11 WebSocket — v1 chỉ refresh khi reload)

### UC-17: Receive notification

- **Actor:** Authed user (recipient)
- **Precondition:** Có post của user; user khác (actor) thực hiện engagement event lên post đó
- **Main flow:**
  1. Actor react/comment/reply/share post của recipient
  2. BE service hook tạo row Notification `{userId=recipient, actorId, type, targetType/Id, postId, read=false, metadata: { reactionType? }}`
  3. NotificationBell badge unread count +1 (FE polling 30s hoặc WS push T-315)
  4. User click bell → dropdown 10 items gần nhất, group time (today/yesterday/older)
  5. Click 1 item → navigate target (post detail / comment anchor) + auto mark read
- **Alternative:** Anonymous engagement (anonymous react/comment) → KHÔNG tạo notification (cần actorId là user thật)
- **Postcondition:** Notification persist; badge count decrease khi user mark read hoặc đọc

### UC-18: Manage notifications

- **Actor:** Authed user (recipient)
- **Precondition:** Đã login, đứng tại `/notifications`
- **Main flow:**
  1. Click bell footer "view all →" hoặc navigate trực tiếp `/notifications`
  2. Header hiện unread count + button `✓ mark all read` (visible khi unread > 0)
  3. Tab `All (N)` / `Unread (N)` filter
  4. List group time, mỗi row có checkbox + avatar actor + verb + snippet + meta + actions (mark read/unread toggle + delete)
  5. Bulk: tick nhiều checkbox → toolbar `delete N` xuất hiện → confirm → DELETE bulk
- **Alternative:** Empty list → ASCII empty state `◎ // no notifications yet`
- **Postcondition:** Notification table updated; bell badge sync

### UC-19: Admin quick-edit post

- **Actor:** Admin
- **Precondition:** Đã login admin, đứng tại `/admin/posts`
- **Main flow:**
  1. List/card row → click `✎ Edit` action
  2. QuickEditModal mở (inline trong dashboard, không navigate)
  3. Form fields: status dropdown (PUBLISHED/DRAFT/ARCHIVED), mood picker, content textarea, tag input (Enter/comma add)
  4. Click `Save` → optimistic PATCH `/admin/posts/:id` → invalidate `['posts']` + `['admin','posts']`
  5. Modal close khi 200; hiện error banner khi 4xx/5xx
- **Alternative:** Click Cancel / Esc / backdrop → đóng modal, không gọi API
- **Postcondition:** Post updated; list refresh; admin không rời dashboard

### UC-20: Admin browse/filter posts

- **Actor:** Admin
- **Precondition:** Đã login admin
- **Main flow:**
  1. Navigate `/admin/posts` → ManagePostsPage
  2. Header: search input + filter bar (status PUBLISHED/DRAFT/ARCHIVED + mood + sort latest/oldest/likes) + view toggle list/card + `[+ New Post]` link `/admin/create`
  3. Query refetch khi filter/sort/search đổi (reuse pattern FR-04.6 sort + FR-10.2 search) + pagination NFR-06
  4. Click row Delete → DeleteConfirm modal hiện snippet content (truncate 80) + warning destructive → confirm → DELETE
- **Alternative:** Bulk select hint (defer bulk delete endpoint phase sau)
- **Postcondition:** List reflect filter state; URL query params sync (`?status=DRAFT&sort=oldest&page=1`)

### UC-21: User/Anonymous react to post

- **Actor:** Authed user hoặc Anonymous (track qua anonymousId)
- **Precondition:** Đang xem PostCard/PostDetail có reaction button
- **Main flow:**
  1. Hover reaction button (👍) → popover picker hiện 6 emoji (LIKE/LOVE/HAHA/WOW/SAD/ANGRY)
  2. Click 1 emoji → POST `/posts/:id/reactions { type }` (upsert)
  3. UI optimistic flip: button icon đổi sang type vừa chọn, top 3 emoji + total count hiển thị dưới button
- **Alternative:**
  - Click cùng type đang có → DELETE `/posts/:id/reactions` (toggle off) — count −1
  - Click type khác → upsert đổi type — count không đổi
- **Postcondition:** Reaction lưu DB; nếu actor là authed + post owner khác actor → trigger Notification REACTION event (xem FR-14)

### UC-22: Admin generate blog content with AI suggest (NEW 2026-05-25)

- **Actor:** ADMIN
- **Precondition:** Admin đang ở Create Post page (`/admin/create`) hoặc Quick Edit modal (`/admin/posts/:id` edit flow)
- **Main flow:**
  1. Click `✨ AI suggest` button (purple, top-right của content section toolbar) → mở AISuggestModal overlay
  2. Nhập ý tưởng ngắn (5-500 chars) vào textarea, vd: "deploy MyBlog lên Vercel với GitHub Actions"
  3. Click `✨ Generate` button (hoặc `⌘↵` shortcut) → loading state với braille spinner 80ms frame
  4. POST `/ai/generate { prompt }` → AI provider (Claude API) → response `{ html }` clean HTML 200-400 từ tiếng Việt
  5. Preview HTML render trong editor-area của modal với `dangerouslySetInnerHTML`
  6. Click `✓ Replace content` → editor content override = aiResult + modal close + reset state
- **Alternative:**
  - Click `↻ Regenerate` (nếu đã có result) → call lại API với same prompt → new result
  - Click `Cancel` → close modal without override editor
  - Esc / backdrop click → close modal
  - API error 429 RATE_LIMITED → hiển thị error block + giữ modal open, user retry sau
  - API error 500 PROVIDER_ERROR → hiển thị `[ERROR] AI request failed: <msg>` + giữ modal open
- **Postcondition:** Editor content trong Create Post update với AI-generated HTML (nếu user click Replace) hoặc unchanged (nếu Cancel)
- **Linked FR:** FR-17

### UC-23: User upload/replace/remove avatar (NEW 2026-05-30)

- **Actor:** USER (any authed user, self-scope only)
- **Precondition:** User đang ở `/profile/:ownUsername`, đã click `⚙️ Settings` mở EditProfileDrawer
- **Main flow (upload):**
  1. User click `↑ Upload` button trong `// avatar` section đầu drawer → mở native file picker
  2. Chọn file (JPEG/PNG/WebP, ≤ 5MB) → FE validate constraint inline (mime + size), reject nếu sai
  3. AvatarUploadModal mở overlay portal — render `react-easy-crop` canvas với image + aspect 1:1 + zoom slider 1-3× + preview circle 120px
  4. Drag để pan, slider để zoom — preview real-time
  5. Click `↑ Upload` → loading state (braille spinner)
     - FE call `POST /users/me/avatar/sign` → BE return Cloudinary signed params `{ signature, timestamp, apiKey, cloudName, folder }`
     - FE upload cropped blob (canvas.toBlob) trực tiếp lên Cloudinary với signed params → Cloudinary return `{ secure_url, public_id }`
     - FE call `PATCH /users/me/avatar { url, publicId }` → BE save 2 field + cleanup avatarPublicId cũ qua `cloudinary.destroy()` best-effort
  6. Modal đóng + drawer header preview update + ProfilePage hero refetch via TanStack Query invalidate → avatar mới render khắp UI (TopBar / PostHeader / NotifRow)
- **Main flow (remove):**
  1. User click `× Remove` button (chỉ visible khi avatarUrl ≠ null) → ConfirmDialog `Remove avatar?` + `Cancel`/`Confirm`
  2. Click Confirm → `DELETE /users/me/avatar` → BE `cloudinary.destroy(avatarPublicId)` + set `avatarUrl=null, avatarPublicId=null`
  3. UI fallback về default ProfileAvatar SVG (initial letter cyberpunk style)
- **Alternative:**
  - File select GIF → FE reject inline `format not supported (JPEG/PNG/WebP only)`
  - File select 6MB → FE reject inline `file too large (max 5MB)`
  - Crop modal Esc / Cancel click → close không upload
  - Upload Cloudinary fail (network) → toast error `upload failed, try again` + modal giữ open
  - PATCH endpoint 401 (token expire trong lúc crop) → redirect login
  - Cloudinary destroy fail trong cleanup → log warn, không block user flow (best-effort)
- **Postcondition:** User.avatarUrl + avatarPublicId trong DB cập nhật; Cloudinary `avatars/` folder chỉ chứa avatar hiện tại (không orphan); avatar mới hiển thị khắp UI ngay
- **Linked FR:** FR-11.7

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
- **FR-02.7:** Emoji picker tích hợp trong MarkdownEditor toolbar — 4 nhóm (faces / hands / dev / nature) × 16 emoji mỗi nhóm = 64 emoji. Click emoji insert vào textarea tại cursor position. Popover close on Esc hoặc outside-click.
- **Acceptance:**
  - Given admin có bài với 10 ảnh + 20 file + 5 tag + content 10000 ký tự → When publish → Then bài hiển thị đầy đủ ở Feed
  - Given non-admin user → When call `POST /posts` → Then nhận 403 FORBIDDEN
  - Given admin click 😀 toolbar button → Then EmojiPicker hiện 4 tab, click 🚀 → Then `🚀` insert tại cursor position trong textarea
- **Linked UCs:** UC-01
- **Linked Tests:** E2E-02, E2E-03, E2E-11

### FR-03: Tương tác (Like, Comment, Save)

- **FR-03.1:** ~~Like cho post — cho cả auth user lẫn anonymous (anonymous track qua cookie `anonymousId`). Unique `(postId, userId)` HOẶC `(postId, anonymousId)`~~ **(deprecated binary like trong M11.7 — see FR-16 Multi-Reaction System).** Comment/Save/CommentLike (FR-03.2/.3/.5) giữ binary semantics.
- **FR-03.2:** Comment cho post — auth user dùng tên user; anonymous nhập `anonymousName`. Status mặc định `APPROVED` (configurable: nếu admin bật moderation queue → mặc định `PENDING`)
- **FR-03.3:** Save bài — CHỈ auth user, lưu vào `SavedPost`. Xem ở `/me/saved`
- **FR-03.4:** Admin có thể xóa hoặc moderate (approve/reject) comment
- **FR-03.5:** Like cho comment — tương tự like cho post (auth + anonymous), bảng `CommentLike` riêng. Note: Comment dùng **binary like (♡/❤)** traditional toggle, KHÔNG dùng reaction picker multi-type (chỉ post mới có reactions — FR-16).
- **FR-03.6 Reply to comment (NEW — amended 2026-05-25 from design-file 2026-05-24 sync):** MVP feature reply trên comment (depth 1 only — no nested reply trong reply).
  - **Data model:** Comment thêm `parentId String?` self-reference (FK Comment.id, onDelete CASCADE), `replyTo Json?` denormalize `{username, isAnon}` của parent comment author để render `replying to @<username>` mà không cần JOIN. Index `[parentId]` cho fast lookup replies of a comment.
  - **Depth constraint:** API + service VALIDATE `parentComment.parentId === null` trước khi insert (reject 400 nếu reply on a reply). Frontend hide `↩ Reply` button trên ReplyRow để guide UX.
  - **Endpoints:**
    - `POST /comments` body nhận optional `parentId` (NEW field). Response include `replyTo`.
    - `GET /posts/:id/comments?page=&limit=` extend return shape: top-level comments + nested `replies` array per comment (limit 3 first, "load more" button cho replies > 3 — defer to phase 2).
  - **UI (FE):** `CommentItemRow` (top-level comment wrapper) + `ReplyForm` (inline form mở khi click `↩ Reply`, anon toggle giữ giống CommentForm) + `ReplyRow` (nested under comment, indent 40px, avatar 24×24, **like dùng ♡/❤ traditional KHÔNG reaction picker**).
  - **Notification:** Reply trên comment của user X → trigger notification type=REPLY (FR-14.1) cho X với `metadata.replyTo: @<commenterUsername>`.
- **Acceptance:**
  - Given anonymous đã like post X → When click lại → Then unlike, count giảm
  - Given auth user save post X → When vào `/me/saved` → Then thấy post X
  - Given admin xóa comment Y → When user khác load lại → Then không thấy comment Y
  - Given user A reply comment B của user X → Then Comment row mới với `parentId=B.id, replyTo={username:'X', isAnon:false}` + notification REPLY cho X
  - Given user reply trên 1 reply (depth 2) → Then API trả 400 `INVALID_PARENT_DEPTH` (chỉ cho reply depth 1)
  - Given xóa parent comment B → Then tất cả replies cascade delete (Comment.onDelete CASCADE)
- **Linked UCs:** UC-04, UC-05, UC-07
- **Linked Tests:** E2E-04, E2E-05, E2E-10, comments-reply.e2e-spec.ts (NEW), ReplyForm.test.tsx (NEW)

### FR-04: Hiển thị (Feed, Detail, Filter)

- **FR-04.1:** Feed sort `createdAt DESC`
- **FR-04.2:** Infinite scroll — page size 10
- **FR-04.3:** Filter theo mood (single select) hoặc tag (click vào TagPill)
- **FR-04.4:** Post Detail tại `/post/[id]` — full content + ImageCarousel (prev/next + dot indicator)
- **FR-04.5:** View tracking — increment `Post.viewCount` 1 lần / 30 phút / session (dedupe via cookie hoặc userId)
- **FR-04.6:** Sort dropdown FilterBar (Latest / Oldest / Most liked) — `GET /posts?sort=latest|oldest|likes`
- **FR-04.7 CommentsModal pattern at Feed level (NEW — amended 2026-05-25 from design-file 2026-05-24 sync):** Khi user click `💬 N` button trên PostCard trong Feed → **mở `CommentsModal` popup overlay** (KHÔNG navigate `/post/:id`). Post Detail page `/post/:id` vẫn tồn tại nhưng **reserved cho deep-link / SEO** (direct URL access từ search engine, share link, bookmark).
  - **Modal spec:** xem `DESIGN_SYSTEM.md > CommentsModal (Feed — design-file 2026-05-24) — DEFINITIVE pattern` — 640px modal max-h 90vh, infinite scroll (PAGE_SIZE 5 + IntersectionObserver), footer comment form integrated.
  - **Reuse pattern:** Modal nội bộ dùng cùng `CommentItemRow` + `CommentForm` + `ReplyForm` + `ReplyRow` components như Post Detail page (FR-03.6). Avoid duplicate logic.
  - **A11y:** Modal có `role="dialog" aria-modal="true" aria-label="Comments"`. Esc / backdrop click → close. Body scroll lock khi open.
  - **Defer pagination:** PAGE_SIZE 5 cho phase 1. Match Post Detail comment list query `GET /posts/:id/comments?page=&limit=`.
- **Acceptance:**
  - Given feed có 25 bài → When load → Then 10 bài đầu hiển thị, scroll → load 10 tiếp
  - Given filter `mood=HAPPY` → Then chỉ hiển thị bài mood HAPPY
  - Given user xem post 5 lần trong 30 phút → Then viewCount chỉ +1
  - Given user click `💬 5` button trên PostCard Feed → **Then CommentsModal mở overlay (KHÔNG redirect)** + body scroll lock + focus trap input footer
  - Given user truy cập trực tiếp URL `/post/abc123` (vd: từ Google search) → Then Post Detail page render (KHÔNG modal) với full content + comments inline
- **Linked UCs:** UC-02, UC-03
- **Linked Tests:** E2E-04, E2E-06, comments-modal.test.tsx (NEW)

### FR-05: Share

- **FR-05.1:** Share lên Facebook, X (Twitter), Telegram
- **FR-05.2:** Copy link clipboard — MetaPanel "Copy link" button → `navigator.clipboard.writeText` + toast confirm
- **FR-05.3:** Open Graph meta tags cho preview link (title, description, image, type)
- **Acceptance:**
  - Given click "Copy link" → Then clipboard chứa URL `https://<domain>/post/<id>` + toast `// link copied`
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
- **FR-08.4:** Groups: `navigate` (Feed, Saved, Tags, Profile, Search, Admin, Create Post) + `actions` (Toggle theme, Logout). Tags + Profile + Search + Saved fix wire đúng route (không `to: '/'`)
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

### FR-10: Tags Module

- **FR-10.1:** Public `/tags` browse — list all tags với `postCount + sparkline7d` (last 7 days post-create-with-tag count). 4 stat cards top (Total tags / Tagged posts / Most used / Recently added).
- **FR-10.2:** Toolbar — search input (filter by name substring) + sort dropdown (Name / Posts / Recent) + grid/list view toggle.
- **FR-10.3:** TagCard: name + color swatch + description (optional max 280 chars) + postCount + sparkline mini + progress bar % so với max. Click navigate `/?tag=name` Feed.
- **FR-10.4:** Admin (single route `/tags` conditional UI) — `[ + New Tag ]` button → TagModal (name + color picker từ TAG_COLORS palette + description textarea + preview chip). Edit + Delete actions trên TagCard hover overlay. Delete confirm dialog (warn count posts → double-confirm).
- **FR-10.5:** Backend `Tag.description` field nullable max 280 chars + `GET /tags?sort=&q=` + response trả `postCount + sparkline7d`.
- **Acceptance:**
  - Given có 15 tags → When user vào `/tags` → Then thấy 15 TagCard + 4 stat cards
  - Given non-admin user → When click TagCard → Then navigate `/?tag=name` (chỉ navigation, không edit)
  - Given admin click `+ New Tag` → submit form valid → Then tag mới xuất hiện trong list, cache invalidate
  - Given admin click Delete trên tag có 5 post → Then dialog "5 posts use this tag" + require double-confirm
- **Linked UCs:** UC-13
- **Linked Tests:** E2E (defer add)

### FR-11: User Profile

- **FR-11.1:** Public `/profile/:username` — hero (avatar rotating ring 88px + name + role badge + title + bio + stats inline `42 posts · 287 likes · 1.2k views`) + 4 tabs (Posts/Saved/Activity/About) + right sidebar (about + skills.top + mood.breakdown + activity.28d heatmap + tags.used).
- **FR-11.2:** Self `/me` → redirect `/profile/:ownUsername`. Avatar dropdown link "Profile" wire đúng route.
- **FR-11.3:** Self edit drawer (slide-in 420px) — sections: profile (title max 80, bio max 500 markdown, skills `{name,color}[]` chip input max 20) + security (POST /auth/change-password với current + new + confirm). Backdrop + Esc close. **Password validation: cả `currentPassword` + `newPassword` min 5 chars** (amended 2026-05-19 từ "newPassword min 8" sau T-303 — policy personal blog, không cần khắt khe).
- **FR-11.4:** Stats endpoint `GET /users/:id/stats` trả: postsCount, likesReceived, commentsReceived, viewsTotal, streak (distinct post-created days liên tiếp), heatmap28d, moodBreakdown (zero-fill 7), tagsUsed (top 8).
- **FR-11.5:** Saved tab visible CHỈ self/admin (privacy). Tab state qua `?tab=posts|saved|activity|about`.
- **FR-11.6:** Backend migration: User thêm `title String?` (80) + `bio String? @db.Text` (500 markdown) + `skills Json @default("[]")` shape `{name,color}[]`. Endpoint mới `GET /users/by-username/:username` + `GET /users/:id/stats` + `POST /auth/change-password`.
- **FR-11.7:** Avatar upload (amended 2026-05-30, design-file `MyBlog Profile.html` L378-385) — self user có thể upload/replace/remove avatar trong EditProfileDrawer.
  - **Storage:** Cloudinary signed upload (reuse FilesModule pattern T-022) trong folder `avatars/`. Cloudinary transform `c_fill,g_face,w_400,h_400` server-side force square 400×400 face-centered.
  - **File constraints:** size ≤ 5MB; mime ∈ {`image/jpeg`, `image/png`, `image/webp`}; reject GIF (animated avatar = UI noise). Validate cả FE (pre-upload) lẫn BE (sau khi nhận URL từ Cloudinary qua signature roundtrip).
  - **DB:** User thêm `avatarPublicId String?` để track Cloudinary publicId cho cleanup khi replace/remove. `avatarUrl` field existing giữ nguyên semantic (URL display).
  - **Endpoints:** 3 mới — `POST /users/me/avatar/sign` (return Cloudinary signed params, authed user only, folder=`avatars/`); `PATCH /users/me/avatar { url, publicId }` (save URL + publicId; trigger cleanup avatarPublicId cũ nếu có); `DELETE /users/me/avatar` (Cloudinary destroy `avatarPublicId` + set 2 fields null).
  - **Cleanup:** Auto-delete avatar cũ trên Cloudinary khi replace (best-effort try-catch — không fail user action nếu Cloudinary lỗi).
  - **UI EditProfileDrawer:** Add `// avatar` section đầu form — ProfileAvatar 56×56 preview (real avatarUrl nếu có / default ProfileAvatar SVG nếu null) + `↑ Upload` button (mở AvatarUploadModal) + `× Remove` button (chỉ visible khi avatarUrl ≠ null, ConfirmDialog trước khi destroy).
  - **AvatarUploadModal:** Modal 480px (z-modal) — react-easy-crop với aspect 1:1 fixed, zoom slider 1-3×, preview circle 120px, button Cancel + `↑ Upload` (disabled khi processing). Flow: user select file → validate constraint FE → display crop UI → crop → blob → POST sign endpoint → upload blob to Cloudinary URL với signed params → PATCH /users/me/avatar → close modal + onSuccess refetch profile.
  - **Dependency mới:** `react-easy-crop@^5` (~30KB) trong `apps/web` deps.
  - **Display targets:** Avatar render ở 5 vị trí — ProfilePage hero (88px) + EditProfileDrawer preview (56px) + TopBar AvatarMenu (28px) + PostHeader (36px) + NotifRowBell/Page (34/40px). Tất cả render qua `<ProfileAvatar url={avatarUrl} username={username} size={N}>` — fallback default initials/SVG khi url null.
- **Acceptance:**
  - Given user X có 42 posts → When vào `/profile/X` → Then hero stats hiển thị `42 posts`
  - Given self click Edit Profile → drawer mở, sửa title → submit → Then PATCH /users/:selfId thành công + drawer đóng + hero re-render
  - Given self click change password với current pw sai → Then 401 INVALID_CREDENTIALS, drawer giữ open
  - Given self submit change password với newPassword 4 chars → Then 400 VALIDATION_ERROR (min 5)
  - Given guest xem `/profile/admin` → Then Saved tab KHÔNG hiện (chỉ Posts/Activity/About)
  - **FR-11.7 avatar:**
    - Given self mở EditProfileDrawer + click ↑ Upload + select JPEG 200KB → Then AvatarUploadModal mở với crop UI 1:1 + zoom slider
    - Given self crop xong + click ↑ Upload → Then POST /users/me/avatar/sign → upload to Cloudinary → PATCH /users/me/avatar → modal đóng + ProfileAvatar refetch với URL mới + hero re-render với avatar mới
    - Given self upload GIF → Then FE reject inline error trước khi gửi (mime not allowed)
    - Given self upload 6MB JPEG → Then FE reject inline error (size > 5MB)
    - Given self có avatar + click × Remove → ConfirmDialog → confirm → DELETE /users/me/avatar → Cloudinary destroy publicId cũ + avatarUrl + avatarPublicId set null → UI fallback default ProfileAvatar
    - Given self upload avatar lần 2 (replace) → Then BE Cloudinary destroy avatarPublicId cũ trước khi save publicId mới
    - Given anon (chưa login) gọi POST /users/me/avatar/sign → Then 401 UNAUTHORIZED
- **Linked UCs:** UC-14, UC-23
- **Linked Tests:** E2E (defer add), unit (AvatarUploadModal validate + crop + service POST + DELETE)

### FR-11.8: Contact + identity fields (amended 2026-05-30)

> User feedback: API `/auth/me` thiếu fields fill profile + EditProfileDrawer contact section (Location/Born/GitHub/Website) hiển thị FE nhưng PATCH fail vì BE chưa có schema. F2 amend FR-11 để align FE-BE end-to-end.

- **DB schema (Prisma User add 5 nullable fields)**:
  - `name String?` — display name (max 80), vs `username` handle. Hiển thị ở hero `~/username · title · born year`.
  - `location String?` — vd "Ho Chi Minh City" (max 80). Hiển thị ở hero meta row 📍 + profile.info grid.
  - `bornYear Int?` — vd 1995, range 1900-currentYear. Optional, hiển thị "born YYYY" ở hero + grid.
  - `github String?` — handle (vd "myname") hoặc full URL (max 120). Hiển thị link `⌗ {github}` ở hero meta.
  - `website String?` — full URL (max 200). Hiển thị link `🌐 {website}` ở hero meta.
- **BE endpoints update**:
  - `UpdateUserDto` (PATCH `/users/:id`) accept 5 fields với class-validator: name/location/github/website `IsString MaxLength`; bornYear `IsInt @Min(1900) @Max(currentYear) IsOptional`. github/website KHÔNG strict `IsUrl()` (cho phép handle dạng `myname` hoặc full URL).
  - `UserResponseDto` (GET `/users/by-username/:username` + `/users/:id`) trả thêm 5 fields.
  - `AuthUserDto` (GET `/auth/me` + login/register/refresh) expand 4 fields đã có trong DB (`avatarPublicId, title, bio, skills`) + 5 contact fields mới — để FE `useAuth()` consumer (vd ProfileAvatar hero, AvatarMenu) có đủ data 1 query thay phải fetch `/users/by-username` riêng cho viewer-self case.
- **Migration**: `add_user_contact_fields` — 5 ADD COLUMN nullable, backfill N/A (existing rows = NULL). Non-breaking.
- **Acceptance**:
  - Given login admin → GET `/auth/me` trả full 14 field profile (id, username, email, role, avatarUrl, avatarPublicId, title, bio, skills, name, location, bornYear, github, website, createdAt)
  - Given EditProfileDrawer submit PATCH `/users/:selfId` với contact section (location: "HCM", bornYear: 1995, github: "khatran", website: `https://kha.dev`) → 200 OK + DB updated
  - Given bornYear input "abc" → 400 IsInt validation fail
  - Given bornYear 1899 → 400 Min validation fail
  - Given github handle 200 chars → 400 MaxLength validation fail
- **Linked UCs**: UC-14 (extends)
- **Linked Tests**: BE unit (UsersService.update 5 fields propagation) + e2e (PATCH 5 fields success + 400 invalid bornYear + AuthUserDto includes 5 fields)

### FR-12: Full-text Search

- **FR-12.1:** `GET /search?q=&type=all|posts|files|tags&mood=&page=&limit=` — Postgres ILIKE multi-table (`Post.content` + `Tag.name` substring + `File.name`). Empty q → trả `stats` toàn cục, không chạy ILIKE.
- **FR-12.2:** Response shape: `{ posts: PaginatedPosts, files: { id, name, postId, type }[], tags: Tag[], stats: { totalPosts, withImages, withFiles, savedCount } }`. Authed user thấy `saved` flag per post.
- **FR-12.3:** Throttle 30 req/min/IP cho `/search` qua existing ThrottleGuard.
- **FR-12.4:** FE `/search?q=…` page — BigSearchInput hero + filter chips (All/Saved/Files + 5 mood emoji) + result grid với highlight match (`<mark>` styled cyan bg). Empty state `// no results for "{q}" — try different keywords`.
- **FR-12.5:** TopBar search input wrap form, onSubmit navigate `/search?q={encodeURIComponent(value.trim())}`. `TopBar` prop `hideSearch?: boolean` — AppLayout sniff route `/search` → set true (avoid duplicate search bar).
- **FR-12.6:** Right sidebar — 4 stat cards (Total/Images/Files/Saved) + filter.by.mood + recent.searches (localStorage 10 dedupe FIFO) + browse.tags (click → navigate `/?tag=`).
- **FR-12.7:** Debounce input 250ms → update URL query → refetch. SEO `<meta name="robots" content="noindex">` trên `/search`.
- **FR-12.8 Hero refresh (NEW — amended 2026-05-25 from design-file 2026-05-24 sync):** SearchPage hero block với label `❯ search` mono 11 cyan + Big input **Inter 18px** (KHÔNG mono, KHÔNG 22px như spec cũ) + `⌘K` badge inside input (opens CommandPalette) + × clear button.
- **FR-12.9 Filter row expanded (NEW):** 3 filter chips (All / Saved / Files) + vertical divider + **7 mood emoji buttons** (30×28 square, active = mood color border + tint + glow) + reset × red link (visible khi có filter active). Single-select per group.
- **FR-12.10 Three empty-state sections (NEW — khi `q=''` và no filter):**
  1. `// recent.searches` — list 5 recent searches từ `localStorage('recent-searches')` (FIFO dedupe — already in FR-12.6).
  2. `// browse.tags` — render tất cả tags từ TAGS_DATA (per-color chips with count).
  3. `// all.posts <N> total` — scroll list ResultCard preview.
- **FR-12.11 No-results state (NEW):** Centered `◎` 32px muted + `// no results for "<q>"` mono 14 + bash hint `$ grep -r "<q>" ./posts --no-results` mono 12 muted + 2 buttons (`← clear search` cyan + `try "<recent>"` muted x3).
- **FR-12.12 ResultCard refresh (NEW):** Top accent line gradient on hover (`linear-gradient(90deg, transparent, cyan/30, transparent)` `::before` opacity 0→1 .2s) + post-id corner deco top-right + Highlight `<mark>` cyan/20 cho matching query.
- **Acceptance:**
  - Given có post `content="hello world"` → When search `q=hello` → Then post xuất hiện với `<mark>hello</mark> world`
  - Given user trên `/search` → Then TopBar KHÔNG hiển thị search input (hideSearch=true)
  - Given user gõ 31 request/phút → Then request thứ 31 nhận 429 THROTTLED
  - Given empty q → Then trả `stats` toàn cục + `posts.items = []`
  - Given user vào `/search` empty → Then 3 sections render: recent.searches + browse.tags + all.posts preview
  - Given user filter mood=HAPPY (😊 button click) → Then results filter theo mood + chip active state cyan glow
  - Given user search "nothing-matching-xyz" → Then no-results state hiện ◎ + bash hint + clear + try-recent buttons
- **Linked UCs:** UC-15
- **Linked Tests:** E2E (defer add), SearchPage.test.tsx (NEW — covers hero + filter row + 3 empty sections + no-results)

### FR-13: Activity Log (User-scope)

- **FR-13.1 Hybrid scope:** Hiển thị activity của user dưới 2 chiều — (a) OUTGOING: actions user làm (POST/COMMENT/LIKE/SAVE created); (b) INCOMING: actions người khác làm trên content của user (others LIKE/COMMENT/SAVE post user). KHÔNG log unlike/unsave/uncreate events.
- **FR-13.2 Endpoint:** `GET /users/:id/activity?page=&limit=` paginated với default page=1, limit=20, max limit=50. Sort `createdAt DESC`.
- **FR-13.3 Privacy:** Authed only. Self/admin → 200. Anonymous → 401. Other user (non-admin) → 403.
- **FR-13.4 Append-only:** Log entry không xoá khi target deleted; UI degrade nếu target gone (snippet null, render `[deleted post]`).
- **FR-13.5 Retention:** v1 vô hạn, cleanup policy defer (sau này có cron 90-day archive nếu cần).
- **FR-13.6 v1 scope:** Hook log vào `PostsService.create`, `CommentsService.create`, `LikesService.togglePostLike` (only on like=true), `SavedService.toggleSave` (only on save=true). KHÔNG hook `toggleCommentLike` v1.
- **Acceptance:**
  - Given user A tạo post X → Then ActivityLog có 1 row {actor=A, type=POST_CREATED, targetOwner=A}
  - Given user B like post của user A → Then ActivityLog có 1 row {actor=B, type=LIKE_CREATED, targetOwner=A}; `GET /users/A/activity` return row đó với direction=INCOMING
  - Given anonymous → `GET /users/A/activity` → 401
  - Given user C khác A và không admin → `GET /users/A/activity` → 403
  - Given user A unlike post → KHÔNG xuất hiện row LIKE_DELETED (chỉ log create events)
- **Linked UCs:** UC-16
- **Linked Tests:** activity.service.spec.ts + activity.e2e-spec.ts + ProfileActivityList.test.tsx

### FR-14: Notification System

- **FR-14.1 Event types:** Tạo notification khi có engagement event — `REACTION` (user react post của recipient — payload `metadata.reactionType: LIKE|LOVE|HAHA|WOW|SAD|ANGRY`), `COMMENT` (comment trên post recipient), `REPLY` (reply comment recipient), `SHARE`. KHÔNG tạo cho remove-reaction/uncomment/unsave events. REACTION đổi type (vd LIKE → LOVE) cũng KHÔNG tạo notification mới (chỉ create event mới mới trigger).
- **FR-14.2 Recipient scope:** Chỉ authed user nhận notification (cần `userId` field). Anonymous user KHÔNG nhận. Self-action KHÔNG tạo notification (vd user react post của chính mình → skip).
- **FR-14.3 Bell dropdown:** NotificationBell trong TopBar hiển thị badge unread count (pulsing khi > 0). Dropdown 10 items gần nhất, group time (today/yesterday/older), link "view all →" sang `/notifications`.
- **FR-14.4 Full page:** `/notifications` route (auth required) — tab All/Unread với count, list group time, **pagination** `page=1&limit=20` (max 50) theo NFR-06 với infinite scroll IntersectionObserver, bulk select checkbox, mark read/unread toggle per item, mark-all-read button, delete per item + bulk delete (max 100 ids).
- **FR-14.5 Auto-mark read:** Click 1 notification → navigate target + PATCH `:id/read` với `read=true` (optimistic).
- **FR-14.6 Realtime (defer):** WebSocket event `notification:new` push từ server → client room `user:<userId>` để FE invalidate query. Defer T-315; v1 dùng polling 30s.
- **FR-14.7 NotificationsPage expanded scope (NEW — amended 2026-05-25 from design-file 2026-05-24 sync):** Trang `/notifications` mở rộng từ tab All/Unread thành **6 type tabs**:
  - **Tabs (6):** `◉ All` / `● Unread` / `❤ Reactions` / `💬 Comments` / `↩ Replies` / `↗ Shares` (icon + label + count badge per tab). Style `.tab-btn` mono 12, active = cyan border + bg `cyan/8` + glow.
  - **Filter logic FE:** Tab `All`/`Unread` đặc biệt (filter theo `read` flag). 4 tabs khác filter theo `n.type === tab` (REACTION/COMMENT/REPLY/SHARE).
- **FR-14.8 Search input (NEW):** Input `⌕ search by user, content, post id...` (`.edit-inp` mono 13 padding-left 30 + × clear). Filter list theo `n.user` HOẶC `n.snippet` HOẶC `n.post` (case-insensitive substring, debounce 150ms client-side — KHÔNG gọi BE).
- **FR-14.9 Bulk select bar (NEW):** Checkbox column (16×16) trên mỗi NotifRow. Khi `selected.size > 0` → action bar visible: `N selected` cyan label + `✓ mark read` + `✕ delete` + `clear` deselect buttons. Khi `selected.size === 0` và `filtered.length > 0` → show `☐ select all visible` button.
- **FR-14.10 Bulk endpoints reuse:** PATCH `/notifications/bulk-read { ids }` (NEW — add endpoint) hoặc reuse PATCH `/notifications/:id/read` × N parallel (defer 1 endpoint to phase 2). DELETE `/notifications/bulk { ids }` already exists (T-312).
- **FR-14.11 Toast feedback (NEW):** Mọi action (mark read / delete single / bulk action / mark-all / clear-all) trigger toast bottom-right slideDown 2500ms (success grn ✓ / error red ✕). Pattern xem `DESIGN_SYSTEM.md > Toast notification pattern`.
- **FR-14.12 Clear all action (NEW):** SubBar right có button `✕ clear all` (visible khi `notifs.length > 0`) → `window.confirm("Delete all N notifications?")` HOẶC ConfirmDialog Tags variant 360px → DELETE all user notifications + toast.
- **FR-14.13 NotifRow split variants (NEW — clarify):** Doc spec 2 components riêng cho 2 contexts (xem `DESIGN_SYSTEM.md > NotifRowBell + NotifRowPage`). Cả 2 dùng cùng 4 type của `NotificationType` enum (REACTION/COMMENT/REPLY/SHARE — đồng bộ với BE data, KHÔNG dùng legacy types như like/save từ design-file cũ):
  - **NotifRowBell** (TopBar dropdown — compact): 34×34 avatar + 18×18 type badge + 2px border-left, click-only navigate, không action button.
  - **NotifRowPage** (`/notifications` page — full): 40×40 avatar + 20×20 type badge + 3px border-left + checkbox column + `replyTo` field display + mark toggle + delete buttons.
- **Acceptance Criteria (Given/When/Then):**
  - Given user B react LOVE post của user A → Then Notification table có 1 row `{userId=A, actorId=B, type=REACTION, postId=<post>, metadata: {reactionType:'LOVE'}, read=false}` + bell badge của A +1
  - Given user B đổi reaction LIKE→LOVE → KHÔNG tạo notification mới (chỉ create events được log)
  - Given anonymous react post của user A → KHÔNG tạo notification (cần actorId là user thật)
  - Given user A login + click bell → dropdown hiện 10 noti gần nhất, group today/yesterday/older
  - Given user A click 1 notification → navigate target + row có `read=true`
  - Given user A click `mark all read` → tất cả unread → read, response `{ updated: N }`, badge = 0
  - Given user A bulk delete 5 ids → response `{ deleted: 5 }`, list refresh
  - Given user khác (không phải recipient) PATCH/DELETE notification → 403
  - Given user A vào `/notifications` → Then 6 tabs visible (All/Unread/Reactions/Comments/Replies/Shares) với count badges
  - Given user A click tab Replies → Then list filter chỉ rows có `type === REPLY` + `from @<replyTo>` clause hiển thị
  - Given user A search "@user1" → Then filter rows có `user.includes("@user1")` (substring case-insensitive)
  - Given user A check 3 rows + click `✕ delete` bulk → Then DELETE `/notifications/bulk { ids: [3] }` + toast `✕ Deleted 3 notifications`
- **Linked UCs:** UC-17, UC-18
- **Linked Tests:** notifications.service.spec.ts + notifications.e2e-spec.ts + NotificationBell.test.tsx + NotificationsPage.test.tsx (expanded — covers 6 tabs + search + bulk + toast)

### FR-15: Admin Manage Posts

- **FR-15.1 Page route:** `/admin/posts` (ProtectedRoute requireRole=ADMIN). Trang quản lý CRUD bài inline trong dashboard, không cần navigate đến từng Post Detail.
- **FR-15.2 View toggle:** 2 view mode — `list` (table 6-col: content preview / status badge / mood / tags / stats likes+comments / actions) + `card` (compact PostCard với mood/tags/stats/actions inline). Toggle persist trong URL query `?view=list|card`.
- **FR-15.3 Filter, sort & pagination:** Filter `status=PUBLISHED|DRAFT|ARCHIVED` + `mood=<MOOD>` + search query (reuse FR-10.2 substring) + sort `latest|oldest|likes` (reuse FR-04.6) + **pagination** `page=1&limit=20` (max 50) theo NFR-06. Tất cả sync URL query, refetch query khi đổi.
- **FR-15.4 Quick edit modal:** Click row `✎ Edit` → modal inline với form (status dropdown + mood picker + content textarea + tag input Enter/comma add). Save → PATCH `/admin/posts/:id` partial + optimistic. Modal close on 200.
- **FR-15.5 Delete confirm:** Click row `🗑 Delete` → ConfirmDialog modal hiện snippet content (truncate 80) + warning destructive → confirm → DELETE `/admin/posts/:id` (204).
- **FR-15.6 Bulk select (defer endpoint):** UI có checkbox bulk select, toolbar count. Bulk delete endpoint defer phase sau — phase 1 chỉ select single.
- **Acceptance Criteria (Given/When/Then):**
  - Given admin navigate `/admin/posts` → Then hiện list 20 post mặc định sort `latest`, view `list`
  - Given admin filter `status=DRAFT` → Then GET `/admin/posts?status=DRAFT&page=1&limit=20` chỉ trả draft posts
  - Given non-admin (USER role) navigate `/admin/posts` → 403 redirect
  - Given anonymous navigate `/admin/posts` → 401 redirect `/auth/login`
  - Given admin click Edit row → modal mở với data pre-fill
  - Given admin Save edit → PATCH thành công → list refresh + modal close
  - Given admin Delete + confirm → DELETE 204 → row disappears
- **Linked UCs:** UC-19, UC-20
- **Linked Tests:** admin-posts.e2e-spec.ts + ManagePostsPage.test.tsx + QuickEditModal.test.tsx

### FR-16: Multi-Reaction System

- **FR-16.1 Reaction types:** Enum `ReactionType` với 6 giá trị: `LIKE` 👍, `LOVE` ❤️, `HAHA` 😆, `WOW` 😮, `SAD` 😢, `ANGRY` 😡. Hiển thị emoji + label tooltip khi hover.
- **FR-16.2 Single-pick semantics:** 1 actor (user/anonymous) trên 1 post có max 1 reaction active. Chọn type khác → upsert đổi type (count không đổi). Chọn cùng type đang active → remove (toggle off, count -1).
- **FR-16.3 Actor scope:** Authed user (qua userId) HOẶC Anonymous (qua anonymousId từ cookie middleware) — match scope của Like binary FR-03.1 cũ. Self-react cho phép (tránh notification: xem FR-14.2).
- **FR-16.4 Endpoints:**
  - `POST /posts/:id/reactions` body `{ type: ReactionType }` → upsert reaction của actor (200, response `{ type, totalCounts: { LIKE:N, LOVE:N, ... }, topThree: [type, type, type] }`)
  - `DELETE /posts/:id/reactions` → remove reaction của actor (204)
  - `GET /posts/:id/reactions/counts` → public, response `{ totalCounts, topThree, total: N }` (NO pagination, vì chỉ 6 type)
  - `GET /posts/:id/reactions?type=&page=&limit=` → list users đã react (auth optional, pagination per NFR-06)
- **FR-16.5 UI:**
  - PostCard reaction button: hover popover picker 6 emoji, click select. Button icon hiển thị reaction type hiện tại (mặc định 👍 chưa react). Dưới button: top 3 emoji + total count (vd `👍❤️😆 12`).
  - PostDetail: thêm "see who reacted" link → modal list users group by type (tab All/LIKE/LOVE/...).
- **FR-16.6 Migration:** Existing `Like` table → rename/migrate sang `Reaction` table với `type=LIKE` default cho tất cả row cũ (data preserve). Tham khảo DATA_MODEL.md migration plan.
- **Acceptance Criteria (Given/When/Then):**
  - Given user B chưa react post A → When B click LOVE → Then 1 row Reaction `{actorId=B, postId=A, type=LOVE}` + notification REACTION cho A
  - Given user B đã react LIKE post A → When B click LOVE → Then row update `type=LOVE` (KHÔNG insert mới), count LIKE −1 LOVE +1, KHÔNG notification mới
  - Given user B đã react LIKE post A → When B click LIKE → Then row deleted (toggle off), count LIKE −1
  - Given anonymous react post A → Then row Reaction với `anonymousId`, KHÔNG notification cho A (per FR-14.2)
  - Given migration → Then 100% Like cũ → Reaction với type=LIKE, count đúng pre-migration
- **Linked UCs:** UC-04, UC-21
- **Linked Tests:** reactions.service.spec.ts + reactions.e2e-spec.ts + ReactionPicker.test.tsx + migration test

### FR-17: AI Content Generation (NEW — amended 2026-05-25 from design-file 2026-05-24 sync)

- **FR-17.1 Scope:** Admin tạo bài viết → có thể click `✨ AI suggest` button trong Create Post → mở `AISuggestModal` → nhập ý tưởng ngắn (brief gist) → AI generate bài blog ngắn 200-400 từ tiếng Việt → preview HTML output → click `✓ Replace content` để override editor content. Defer feature cho non-admin.
- **FR-17.2 Endpoint:** `POST /ai/generate` body `{ prompt: string }` → response `{ html: string }`. Auth required (ADMIN role only — JwtAuthGuard + RolesGuard). Rate limit 10 req/min/admin (tránh abuse + cost protection).
  - **Request validation:** prompt length 5-500 chars (Zod schema `aiGenerateDto`).
  - **Response shape:** `{ html: string }` clean HTML (strip leading ` ```html` + trailing ` ``` ` markers, no `<html>` hoặc `<body>` wrappers). Use `<p>`, `<b>`, `<i>`, `<ul><li>`, `<h2>` allowed; NO inline style.
- **FR-17.3 AI provider:** v1 dùng **Anthropic Claude API** (`claude-haiku-4-5` cho cost-effective trên blog personal). Provider abstracted qua `AIProviderInterface` để future swap (OpenAI / Gemini). Env vars: `AI_PROVIDER=anthropic|openai|gemini` + `AI_API_KEY=<key>` + `AI_MODEL=<model-name>`.
- **FR-17.4 Prompt template (backend constant):**

  ```
  Bạn là trợ lý viết blog cá nhân cho "kha.blog" — phong cách dev/hacker,
  giọng văn thân thiện, chia sẻ thật lòng.

  Từ ý tưởng ngắn sau, hãy viết một bài blog ngắn (200-400 từ, tiếng Việt).
  Output định dạng HTML sạch (KHÔNG bao trong markdown code block, KHÔNG
  có <html> hay <body>), dùng <p>, <b>, <i>, <ul><li>, <h2> nếu cần.
  Không sử dụng inline style.

  Ý tưởng: ${prompt}
  ```

- **FR-17.5 UI spec:** AISuggestModal 640px max-w 95vw, purple theme (`--pur` accent), backdrop blur. Header `✨ ai.suggest` + path `~/editor/ai-content-generator` + close ×. Body: textarea (`YOUR IDEA · brief gist` label uppercase mono 10) + Generate button (cyan primary `✨ Generate` / `↻ Regenerate` / spinner braille `⠋⠙⠹...` 80ms khi loading) + `⌘↵ to generate` hint + error block (red mono 11) + result preview (editor-area bg `#070A14` border `pur/30` min-h 120 max-h 280 scrollable Inter 14, `dangerouslySetInnerHTML` clean HTML). Footer: helper text + Cancel + `✓ Replace content` cyan primary (override editor content + close modal).
- **FR-17.6 Override warning:** Footer hiển thị `// AI sẽ override toàn bộ editor hiện tại` mono 10 muted. Click `✓ Replace content` → `editorRef.current.innerHTML = aiResult` + `setContent(aiResult)` (KHÔNG confirm dialog — user đã thấy warning + preview).
- **FR-17.7 Cost guard:** Rate limit 10 req/min/admin per FR-17.2 + log mỗi request vào Sentry (severity info, fields: `{ promptLength, resultLength, model, latencyMs }`) để monitor monthly cost. Soft limit alert nếu > 200 req/day/admin.
- **FR-17.8 Error handling:** API errors mapped:
  - 400 INVALID_PROMPT (prompt too short/long) → inline FE error mono 11 red.
  - 429 RATE_LIMITED → `[ERROR] AI rate limit reached · try again in N min`.
  - 500 PROVIDER_ERROR → `[ERROR] AI request failed: <message from provider or 'unknown'>`.
  - Network fail FE → `[ERROR] connection lost · retry`.
- **Acceptance Criteria (Given/When/Then):**
  - Given admin click `✨ AI suggest` trong Create Post → Then AISuggestModal mở with empty state `✨ // nhập ý tưởng và click generate để AI viết bài` muted
  - Given admin nhập prompt "deploy MyBlog lên Vercel" + click Generate → Then loading spinner braille + 1-3s sau result HTML preview xuất hiện với content 200-400 từ
  - Given admin click ⌘↵ trong textarea → Then submit (same as click Generate)
  - Given prompt empty → Then Generate button disabled
  - Given API trả 429 RATE_LIMITED → Then error block hiển thị `[ERROR] AI rate limit reached`
  - Given admin click `✓ Replace content` sau khi có result → Then editor content override = aiResult + modal close + reset state
  - Given non-admin user gọi `POST /ai/generate` → Then 403 FORBIDDEN
  - Given anonymous gọi `POST /ai/generate` → Then 401 UNAUTHORIZED
  - Given prompt 4 chars (< 5) → Then 400 INVALID_PROMPT
  - Given prompt 501 chars (> 500) → Then 400 INVALID_PROMPT
- **Linked UCs:** UC-22
- **Linked Tests:** ai.service.spec.ts (mock provider 6 case) + ai.e2e-spec.ts (4 case: success 200, rate limit 429, 401/403 auth, validation 400) + AISuggestModal.test.tsx (5 case: open/close/generate/regenerate/replace content)

## Non-Functional Requirements

- **NFR-01: Performance API** — Response time p95 < 500ms. Measurement: Sentry transactions, Fly metrics.
- **NFR-02: Responsive UI** — Mobile-first, ≥ 320px không overflow horizontal. Breakpoints: mobile (< 640), tablet (640-1024), desktop (> 1024). Measurement: manual + Playwright viewport tests.
- **NFR-03: Lighthouse score** — Performance ≥ 85, Accessibility ≥ 85, SEO ≥ 90 cho mỗi public page (`/`, `/post/:id`, `/auth/login`). Measurement: `pnpm dlx unlighthouse --site <url>` weekly.
- **NFR-04: Security** — bcrypt cost ≥ 10, CSRF protection (httpOnly cookie + SameSite=Strict), rate limit 10 req/min/IP cho register/comment/like, input validation (class-validator BE + Zod FE), XSS sanitization (DOMPurify), CORS chỉ allow FE origin. Measurement: [CODING_CONVENTION.md > Security Checklist](./CODING_CONVENTION.md) + Sentry alerts.
- **NFR-05: SEO** — Meta tags (title, description, OG, Twitter Card), sitemap.xml, robots.txt, structured data JSON-LD cho Post. Measurement: Google Search Console index + Lighthouse SEO.
- **NFR-06: Pagination (universal)** — Mọi list API PHẢI có pagination với query `page=1&limit=20` mặc định (`limit` max 50, theo pattern FR-13.2 ActivityLog đã lập). Response shape `{ items, total, page, limit }` HOẶC cursor-based nếu cần infinite scroll. UI tương ứng: infinite scroll IntersectionObserver sentinel (pattern T-301) HOẶC page controls. ListDto BE extends `PaginationDto` shared. Measurement: code review mỗi endpoint mới + unit test pagination boundary (page=0, page=last+1, limit>50).

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

| FR    | Linked UCs          | E2E Test               | BE Module                     | FE Page/Component                               |
| ----- | ------------------- | ---------------------- | ----------------------------- | ----------------------------------------------- |
| FR-01 | UC-09, UC-10, UC-08 | E2E-01, E2E-09         | AuthModule, UsersModule       | LoginPage, RegisterPage, AdminPage > UsersTable |
| FR-02 | UC-01               | E2E-02, E2E-03         | PostsModule, FilesModule      | CreatePostPage                                  |
| FR-03 | UC-04, UC-05, UC-07 | E2E-04, E2E-05, E2E-10 | LikesModule, CommentsModule   | PostCard, CommentItem                           |
| FR-04 | UC-02, UC-03        | E2E-04, E2E-06         | PostsModule                   | FeedPage, PostDetailPage                        |
| FR-05 | UC-06               | E2E-07                 | (BE: OG meta in SSR/sitemap)  | SharePanel                                      |
| FR-06 | UC-01               | E2E-11                 | FilesModule                   | UploadZone, FileAttachments                     |
| FR-07 | UC-07, UC-08, UC-11 | E2E-09, E2E-10, E2E-12 | AdminModule                   | AdminPage                                       |
| FR-08 | UC-12               | E2E-13                 | — (pure FE)                   | CommandPalette                                  |
| FR-09 | UC-04, UC-11        | E2E-12                 | RealtimeGateway               | useWebSocket hook, Activity feed components     |
| FR-10 | UC-13               | E2E (defer)            | TagsModule                    | TagsPage, TagCard, TagModal                     |
| FR-11 | UC-14               | E2E (defer)            | UsersModule, AuthModule       | ProfilePage, EditProfileDrawer                  |
| FR-12 | UC-15               | E2E (defer)            | SearchModule (new)            | SearchPage, BigSearchInput, ResultCard          |
| FR-13 | UC-16               | (defer)                | ActivityModule                | ProfilePage > Activity tab                      |
| FR-14 | UC-17, UC-18        | (defer)                | NotificationsModule (new)     | NotificationsPage, NotificationBell, TopBar     |
| FR-15 | UC-19, UC-20        | (defer)                | AdminModule (extended)        | ManagePostsPage, QuickEditModal, DeleteConfirm  |
| FR-16 | UC-04, UC-21        | (defer)                | ReactionsModule (rename Like) | PostCard ReactionPicker, ReactionList modal     |
| FR-17 | UC-22               | (defer)                | AIModule (new)                | Create Post AISuggestModal                      |

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
