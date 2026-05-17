# UI Design

> **Focus:** screen-level wireframes + user flow + interaction spec.
> Design tokens + component primitives: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
> Spec source (HTML/JSX prototype): [`design-file/`](../design-file/) — single source of truth cho mọi visual.
> FR mapping: [REQUIREMENTS.md > Use Cases](./REQUIREMENTS.md).

## Design Principles

- **Cyberpunk / terminal aesthetic** — dark background, neon cyan accent, JetBrains Mono terminal text, CRT scanline overlay (toggle-able), glitch animation on logo
- **Mobile-first responsive** — `<640px` mobile, `640-1024px` tablet, `>1024px` desktop
- **Keyboard-first power user** — ⌘K command palette toàn cục, ⌘1/⌘2/⌘3 quick nav, ⌘N create, ⌘S save draft, ⌘↵ publish
- **Real-time aware** — pulse dot indicator cho online/live state, instant WS update không cần refresh
- **Information-dense nhưng có hierarchy** — section labels `// section.name`, code-style timestamps `[2026-05-17 12:30]`

## Shared Layout

Tất cả page (trừ Login) dùng **shared layout**:

```
┌─────────────────────────────────────────────────────┐
│  TopBar (fixed, 52px)                               │  ← header
│  [Logo "kha.blog"] [Search⌘K]  [v0.1.0] [●3] [👤]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Main content (scrollable)                          │  ← page-specific
│                                                     │
├─────────────────────────────────────────────────────┤
│  StatusBar (fixed, 28px)                            │  ← footer terminal
│  ~/path  ● info  ──── build:a1b2c3  ●3 online v0.1  │
└─────────────────────────────────────────────────────┘
```

### TopBar (52px, fixed top, z-100)

| Element        | Detail                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Logo           | SVG `< >` brackets (cyan/purple) + text `kha.blog` (Space Grotesk 700, "." cyan, "blog" muted), glitch animation 9s loop |
| Search input   | Centered (440px max), placeholder `~$ search posts, tags, users...`, JetBrains Mono 13px                                 |
| ⌘K hint button | Right end of search input — click open Command Palette                                                                   |
| Version badge  | `[ v0.1.0 ]` (JetBrains Mono 10px, border muted)                                                                         |
| Online count   | `● N` (green pulse + count)                                                                                              |
| Avatar         | 32px circle, gradient bg (cyan→purple), border cyan, online dot bottom-right. Click → dropdown menu                      |

**Avatar dropdown menu items:**

- Header: avatar + `~/admin` + `[ ADMIN ]` badge
- Create Post (cyan, ⌘N) → `/admin/create`
- Admin Dashboard (purple, ⌘3) → `/admin`
- System Settings (yellow)
- Profile (muted) — separator above
- Logout (red, ⌘Q) → `/auth/login`

**Responsive:** `<768px` ẩn search input + version badge; chỉ giữ logo + avatar.

### StatusBar (28px, fixed bottom, z-100)

Style: full-width bar `#070A14` bg, JetBrains Mono 11px, divided by `1px #1F2A3A` borders.

| Section             | Content                                                                  | Notes                |
| ------------------- | ------------------------------------------------------------------------ | -------------------- |
| Left (path)         | `~/feed` / `~/post/abc123` / `~/admin/dashboard` / `~/admin/create-post` | cyan, highlighted bg |
| Info                | `● 42 posts` / `● draft · unsaved` / `last update: 14:32`                | page-specific        |
| Separator           | `──────`                                                                 | muted                |
| Build               | `build: a1b2c3`                                                          | git short hash       |
| Right (right-align) | `● 3 online` (green pulse) + `[ v0.1.0 ]`                                |                      |

### CommandPalette (⌘K overlay)

Triggered by ⌘K / Ctrl+K on bất kỳ page (FR-08).

```
┌────────────────────────────────────────┐
│ ~$  type a command or navigate...  Esc │  ← input bar
├────────────────────────────────────────┤
│ // navigate                            │
│ 🏠  Feed                       ⌘ 1     │  ← grouped items
│ ✏️  Create Post                ⌘ N     │
│ ⚙️  Admin                      ⌘ 3     │
│ 🔑  Login                              │
│ // actions                             │
│ 🚪  Logout                     ⌘ Q     │
├────────────────────────────────────────┤
│ ↑↓ navigate  ↵ open  Esc close  // v1  │
└────────────────────────────────────────┘
```

- Backdrop: `rgba(0,0,0,.72)` + blur 6px
- Width 540-560px, centered, top 100px from viewport top
- Surface: `#1A1F2E` + cyan border + cyan glow shadow
- Filter: realtime substring match on `label` + `desc`
- Group items by `g` (navigate / actions / recent)
- Empty state: `// no results for "<query>"`
- Keyboard: ↑↓ navigate, ↵ select, Esc close
- Focus trap: input autoFocus on mount

---

## Screen 1: Feed (`/`)

**Linked UCs:** UC-02 (xem feed), UC-04 (anonymous like/comment), UC-03 (vào detail)
**User roles:** Tất cả (P1/P2/P3)

### Layout

````
┌─────────────────── TopBar (52px) ────────────────────┐
├─────────┬──────────────────────────────┬─────────────┤
│         │  // feed.posts · 42 total    │  // mood.   │
│ Sidebar │  [Filter: All|😊|⚡|💭|😌|😢]│  distribution│
│ (admin  │                              │  [mood bars]│
│  only,  │  ┌───── PostCard ──────┐     │             │
│  220px) │  │ A ~/admin [ADMIN]    │     │  // activity│
│         │  │ #abc123 · 2h ago     │     │  .heatmap   │
│ ~/nav   │  │ 😊 happy             │     │  [28-day]   │
│ ❯ Feed  │  │                      │     │             │
│   Saved │  │ <content markdown>   │     │  // live.   │
│   Tags  │  │ ```code block```     │     │  visitors   │
│   Admin │  │                      │     │  [sessions] │
│         │  │ [image grid 2x2]     │     │             │
│ 0xDEAD  │  │ // attachments [2]   │     │             │
│ 0b1011… │  │ [PDF] doc.pdf 1.2MB↓ │     │             │
│ pid:    │  │                      │     │             │
│         │  │ #code #dev #debugging│     │             │
│         │  │ ─────────────        │     │             │
│         │  │ ❤24  💬5  🏷  ↗Share│     │             │
│         │  └──────────────────────┘     │             │
│         │                              │             │
│         │  [more PostCards...]         │             │
│         │  [⠋ loading posts...]        │             │
│         │                              │             │
├─────────┴──────────────────────────────┴─────────────┤
└────────────────── StatusBar (28px) ───────────────────┘
````

### Components

| Component                          | Source                          |
| ---------------------------------- | ------------------------------- |
| Sidebar (admin only)               | DESIGN_SYSTEM > Sidebar         |
| FilterBar (mood pills + sort)      | DESIGN_SYSTEM > FilterBar       |
| PostCard                           | DESIGN_SYSTEM > PostCard        |
| ImageGrid                          | DESIGN_SYSTEM > ImageGrid       |
| FileAttachments                    | DESIGN_SYSTEM > FileAttachments |
| MoodBadge                          | DESIGN_SYSTEM > MoodBadge       |
| TagPill                            | DESIGN_SYSTEM > TagPill         |
| RightPanel (mood/heatmap/visitors) | DESIGN_SYSTEM > RightPanel      |
| AsciiSpinner (loading)             | DESIGN_SYSTEM > AsciiSpinner    |

### State machine

| State     | Trigger       | UI                                                                                         |
| --------- | ------------- | ------------------------------------------------------------------------------------------ |
| `initial` | Mount         | Skeleton 3 PostCards                                                                       |
| `loading` | Fetch         | Skeleton hoặc bottom spinner `⠋ loading posts...`                                          |
| `success` | Data received | PostCards rendered với `fadeUp .3s ease` (stagger 60ms delay)                              |
| `empty`   | Zero posts    | ASCII deco `◐` + `// no posts matching filter` + `$ cd ../feed && ls -la --all-moods` hint |
| `error`   | Fetch fail    | Retry button + `// connection lost` message                                                |

### Interactions

- **Infinite scroll**: IntersectionObserver trên sentinel div (rootMargin 120px) → load thêm 2 posts với 700ms delay simulate
- **Mood filter click**: toggle (click lại để clear) → reset `shown=2` → re-fetch
- **PostCard hover**: border cyan glow, top gradient line `linear-gradient(90deg,transparent,cyan,transparent)` fade in
- **Like button click**: optimistic update + WS emit; reverse nếu fail
- **Comment button**: navigate `/post/<id>` (open detail with focus on comment input)
- **Save button**: cookie/cài đặt confirm cần login nếu anonymous
- **Share button**: open share dropdown (Facebook/X/Telegram/Copy link)
- **PostCard click (vùng trống)**: navigate `/post/<id>`
- **TagPill click**: filter feed theo tag

### Responsive breakpoints

- `<1100px`: ẩn RightPanel
- `<768px`: ẩn Sidebar, padding main giảm `10px 12px`
- `<640px` (mobile): PostCard padding giảm; image grid stack vertically nếu cần

### Real-time updates (FR-09)

- WS event `post:new` → prepend vào feed (with `fadeUp` animation)
- WS event `like:new` → update like count cho PostCard `postId` match
- WS event `online:count` → update TopBar/StatusBar online count
- WS event `visitor:join/leave/update` → update RightPanel live visitors

---

## Screen 2: Post Detail (`/post/:id`)

**Linked UCs:** UC-03 (xem chi tiết), UC-04 (anonymous like/comment), UC-05 (save), UC-06 (share), UC-11 (real-time)
**User roles:** Tất cả

### Layout

````
┌─────────────────── TopBar (52px) ────────────────────┐
├──────────────────────────────────────┬──────────────┤
│  ← feed / ~/post/abc123              │ // post.meta │
│                                      │  ID    abc123│
│  A  ~/admin [ADMIN] · [2026-05-17]   │  Views   142 │
│     😊 happy · 2h ago                │  Likes    24 │
│                                      │  Comments  5 │
│  <full content markdown>             │              │
│  ```js                               │ // tags      │
│  // code                             │  #code #dev  │
│  ```                                 │  #debugging  │
│  <more paragraphs>                   │              │
│                                      │ // share     │
│  ┌─── ImageCarousel 280px ────┐     │  📘 Facebook │
│  │  [⬡ photo]            ←→   │     │  🐦 X        │
│  │  • o o o      1/4          │     │  ✈️ Telegram │
│  └────────────────────────────┘     │  🔗 Copy link│
│                                      │              │
│  #code #dev #debugging #nodejs       │ // related   │
│  ─────────────────────────────       │  [post1]     │
│  ❤24  💬5  🏷  ↗Share   👁142 views │  [post2]     │
│  ─────────────────────────────       │              │
│                                      │              │
│  ❯ // comments [5]                   │              │
│                                      │              │
│  ┌─ Comment form ─────────────┐     │              │
│  │ // add a comment...        │     │              │
│  │                            │     │              │
│  │ as: ~/admin   [as anon]  ↵Send│  │              │
│  └────────────────────────────┘     │              │
│                                      │              │
│  ┌─ CommentItem ─────────────┐      │              │
│  │ U @user1 · 1h ago         │      │              │
│  │ Relatable quá! ...        │      │              │
│  │ ❤3  ↩Reply               │      │              │
│  └───────────────────────────┘      │              │
│  [more comments...]                  │              │
│                                      │              │
├──────────────────────────────────────┴──────────────┤
└────────────────── StatusBar (28px) ───────────────────┘
   path: ~/post/abc123  info: 142 views · 5 comments
````

### Components

| Component                              | Source                        |
| -------------------------------------- | ----------------------------- |
| Breadcrumb                             | DESIGN_SYSTEM > Breadcrumb    |
| PostHeader (avatar + admin tag + mood) | DESIGN_SYSTEM > PostHeader    |
| PostContent (markdown renderer)        | DESIGN_SYSTEM > PostContent   |
| ImageCarousel                          | DESIGN_SYSTEM > ImageCarousel |
| TagPill                                | DESIGN_SYSTEM > TagPill       |
| CommentForm                            | DESIGN_SYSTEM > CommentForm   |
| CommentItem                            | DESIGN_SYSTEM > CommentItem   |
| MetaPanel right                        | DESIGN_SYSTEM > MetaPanel     |
| ShareButton                            | DESIGN_SYSTEM > ShareButton   |

### State machine

| State             | Trigger        | UI                                        |
| ----------------- | -------------- | ----------------------------------------- |
| `initial`         | Mount          | Skeleton post + 3 comment skeleton        |
| `loading`         | Fetch          | (same)                                    |
| `success`         | Data ready     | Full content + comments visible           |
| `empty (comment)` | Zero comments  | `// no comments yet — be the first ❯`     |
| `error 404`       | Post not found | `// post not found` + back to feed button |
| `error other`     | Fetch fail     | Retry button                              |

### Interactions

- **ImageCarousel**: ← → buttons + dot indicator click; keyboard arrow nav khi focused; touch swipe mobile
- **Comment form `post as anon` toggle**: switch between auth user mode và anonymous input mode
- **Comment submit**: optimistic insert; rollback on fail
- **Like comment**: tương tự like post
- **Reply button** (CommentItem): placeholder — defer feature, mở comment form với prefix `@username `
- **Share button click**: open dropdown (4 options); copy link → toast "Copied"
- **Related post click**: navigate to that post (full page replace)
- **View count**: increment 1 lần / 30min / session (debounced via `POST /posts/:id/view`)

### Responsive

- `<1024px`: ẩn MetaPanel right
- `<768px`: breadcrumb compact, hide search trong TopBar

### Real-time

- Khi mount: client emit `room:join` cho room `post:<id>`
- WS event `comment:new` (filtered theo postId) → prepend comment list
- WS event `comment:status` (PENDING→APPROVED) → re-render
- WS event `like:new` → update like count
- WS event `commentLike:new` → update comment like count
- Unmount: emit `room:leave`

---

## Screen 3: Create Post (`/admin/create`)

**Linked UCs:** UC-01 (admin tạo bài)
**User roles:** ADMIN only (redirect `/auth/login?next=/admin/create` nếu không phải admin)

### Layout

```
┌─────────────────── TopBar (52px) ─────────────────────┐
├──────────── Sub-toolbar (44px, fixed) ────────────────┤
│ ~/admin/create-post  ──  ● draft · unsaved    ⌘S ⌘↵  │
├────────────────────────────────────┬──────────────────┤
│  EDITOR (flex 1, scrollable)       │ PREVIEW (380px) │
│                                    │                  │
│  // mood                           │ // live.preview  │
│  [😊 ⚡ 💭 😌 😢 🙏 😠]            │                  │
│                                    │ ┌─ PostPreview ─┐│
│  // content    B I `code` # [link]│ │ A ~/admin     ││
│  ┌──────────────────────────────┐ │ │   [ADMIN]     ││
│  │ ~$ start writing...          │ │ │   just now    ││
│  │                              │ │ │   😊 happy    ││
│  │                              │ │ │               ││
│  └──────────────────────────────┘ │ │ <preview      ││
│  // markdown supported  0 chars   │ │  content      ││
│                                    │ │  preview>     ││
│  // images (3/10)                  │ │               ││
│  ┌── upload zone (dashed) ──┐    │ │ [img grid]    ││
│  │ ❯ drag & drop or click   │    │ │               ││
│  │ PNG, JPG, WebP · max 5MB │    │ │ #tag1 #tag2   ││
│  └──────────────────────────┘    │ │               ││
│  [📷 thumb] [📷 thumb] [📷 thumb] │ │ ♡0  💬0  🏷  ↗│
│                                    │ └───────────────┘│
│  // files (2/20)                   │                  │
│  ┌── upload zone ──┐               │ // preview       │
│  │ ❯ drag & drop  │               │ // updates real-time│
│  └──────────────────┘              │                  │
│  [PDF] report.pdf 2.1MB  ×         │                  │
│  [DOCX] notes.docx 840KB ×         │                  │
│                                    │                  │
│  // tags                           │                  │
│  ┌────────────────────────────┐   │                  │
│  │ [#code] [#dev] ❯ add tag... │   │                  │
│  └────────────────────────────┘   │                  │
│  Press Enter, comma or space      │                  │
│                                    │                  │
├────────────────────────────────────┴──────────────────┤
└─────────────── StatusBar (28px) ──────────────────────┘
```

### Components

| Component                           | Source                          |
| ----------------------------------- | ------------------------------- |
| Sub-toolbar                         | DESIGN_SYSTEM > Sub-toolbar     |
| MoodPicker (7 emoji buttons)        | DESIGN_SYSTEM > MoodPicker      |
| MarkdownEditor (textarea + toolbar) | DESIGN_SYSTEM > MarkdownEditor  |
| UploadZone (images + files)         | DESIGN_SYSTEM > UploadZone      |
| ImageThumb (preview thumb)          | DESIGN_SYSTEM > ImageThumb      |
| FileAttachments (mini editing list) | DESIGN_SYSTEM > FileAttachments |
| TagInput (tag + chip)               | DESIGN_SYSTEM > TagInput        |
| PostPreview (right pane)            | DESIGN_SYSTEM > PostPreview     |
| ToolbarButton (B/I/code/h/link)     | DESIGN_SYSTEM > ToolbarButton   |
| Button (publish/save draft)         | DESIGN_SYSTEM > Button          |

### State machine

| State             | Trigger            | UI                                                          |
| ----------------- | ------------------ | ----------------------------------------------------------- |
| `draft`           | Mount / typing     | `● draft · unsaved` (yellow)                                |
| `saving`          | ⌘S / debounced     | `⠋ saving...`                                               |
| `saved`           | Save ok            | `● draft · saved 2s ago`                                    |
| `publishing`      | ⌘↵ / Publish click | `⠋ publishing...` button disabled                           |
| `published`       | Publish ok         | Button text `✓ Published!` → redirect `/post/<id>` sau 1.2s |
| `error (upload)`  | Upload fail        | Toast error + thumb hiển thị `× retry`                      |
| `error (publish)` | Publish fail       | Inline error message above button                           |

### Interactions

- **Mood picker**: click toggle, only 1 selected at a time, current mood highlighted với border cyan + glow
- **Markdown editor**: keystrokes update content state; live preview updates in real-time (right pane); toolbar buttons insert markdown syntax at cursor
- **Image upload**: click upload zone → file picker; drag-drop area highlight on hover; per-file thumb với × remove; max 10 → ẩn upload zone
- **File upload**: same as image; max 20
- **Tag input**: Enter / comma / space → add tag; auto prefix `#` nếu thiếu; click × remove; cycle color qua palette (7 colors)
- **Save Draft** (⌘S): save local OR backend draft endpoint (TBD — defer); toast confirm
- **Publish** (⌘↵): submit; show ASCII spinner; redirect on success

### Responsive

- `<900px`: ẩn preview pane (editor full width)
- `<640px`: mood picker scroll horizontal nếu cần

---

## Screen 4: Admin Dashboard (`/admin`)

**Linked UCs:** UC-07 (moderate comment), UC-08 (quản lý user), UC-11 (real-time activity)
**User roles:** ADMIN only

### Layout

```
┌─────────────────── TopBar (52px) ─────────────────────┐
├──────────── Sub-bar (40px, fixed) ────────────────────┤
│ ~/admin/dashboard ── ● live mode  last update: 14:32 ✏️ New Post │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──── StatCard ─────┐ ┌──── StatCard ─────┐ ... 4 cards
│  │ POSTS    +5 today│ │ LIKES   +24 today│ ...      │
│  │ 42        〰️〰️    │ │ 287      〰️〰️    │ ...      │
│  └───────────────────┘ └───────────────────┘          │
│                                                        │
│  ┌── mood.distribution ──┐ ┌── activity.log ──────┐  │
│  │ 😊 happy   12 · 29% ▓│ │ ❤ @user1 liked #abc │   │
│  │ ⚡ excited  8 · 19% ▓│ │ 💬 Anon#7 commented │   │
│  │ 😌 calm     7 · 17% ▓│ │ 🔖 @user2 saved     │   │
│  │ 💭 thought  6 · 14% ▓│ │ ❤ @user3 liked      │   │
│  │ ...                  │ │ 👤 new Anon#11      │   │
│  └──────────────────────┘ └──────────────────────┘    │
│                                                        │
│  ┌── users.table · 5 total ───────────────────────┐  │
│  │ Username │ Role │ Last seen │ Posts │ Actions  │  │
│  │ ─────────┼──────┼───────────┼───────┼────────  │  │
│  │ ●@admin  │ADMIN │ now       │ 42    │ View     │  │
│  │ ●@user1  │USER  │ 2m ago    │ 0     │ Ban View │  │
│  │ ●Anon#7  │ANON  │ 5m ago    │ 0     │ Ban View │  │
│  │ ○@user2  │USER  │ 1h ago    │ 0     │ Ban View │  │
│  │ ⊘@user3  │USER  │ 3h ago    │ 0     │ Ban View │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌── comments.moderation  [2 pending] ────────────┐  │
│  │ @user1 on #abc123 · 1h ago [approved]          │  │
│  │ "Relatable quá! ..."          ✕Delete          │  │
│  │ ─────                                          │  │
│  │ @user2 on #def456 · 20m ago [pending]          │  │
│  │ "Cursor AI..."           ✓Approve  ✕Delete    │  │
│  │ ─────                                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
├────────────────────────────────────────────────────────┤
└─────────────── StatusBar (28px) ───────────────────────┘
```

### Components

| Component                      | Source                                 |
| ------------------------------ | -------------------------------------- |
| Sub-bar (admin live mode)      | DESIGN_SYSTEM > Sub-bar                |
| StatCard (with sparkline)      | DESIGN_SYSTEM > StatCard               |
| Sparkline                      | DESIGN_SYSTEM > Sparkline              |
| MoodBar (progress bar)         | DESIGN_SYSTEM > MoodBar                |
| ActivityLog item               | DESIGN_SYSTEM > ActivityLog            |
| Table (users, comments)        | DESIGN_SYSTEM > Table                  |
| RoleBadge                      | DESIGN_SYSTEM > RoleBadge              |
| StatusBadge (pending/approved) | DESIGN_SYSTEM > StatusBadge            |
| ActionButton (ghost btn)       | DESIGN_SYSTEM > Button > ghost variant |

### State machine

| State              | Trigger       | UI                                                  |
| ------------------ | ------------- | --------------------------------------------------- |
| `loading`          | Mount         | Skeleton 4 stat cards + 2 panels                    |
| `live`             | WS connected  | Pulse green dot trên sub-bar; live update entries   |
| `disconnected`     | WS disconnect | Yellow indicator + retry; static data still visible |
| `empty (comments)` | Zero pending  | `// no comments to moderate`                        |
| `error`            | Fetch fail    | Toast error + retry                                 |

### Interactions

- **StatCard hover**: border cyan glow
- **Sparkline**: data line + endpoint dot với glow
- **Users table Ban**: click → POST `/admin/users/:id/ban` → toggle role; opacity giảm 50% nếu BANNED; ADMIN role không có Ban button
- **Users table View**: navigate `/admin/users/:id` (defer feature) hoặc open modal
- **Comments Approve**: PATCH `/comments/:id/status` PENDING→APPROVED; row update inline
- **Comments Delete**: DELETE `/comments/:id`; row fade out + remove
- **Pending count badge**: real-time update từ WS `comment:new` events

### Responsive

- `<1024px`: 4 stat cards → 2x2 grid
- `<768px`: 2 col layout (mood + activity) → 1 col stack
- `<640px`: tables → horizontal scroll

### Real-time

- Sub-bar `● live mode` chỉ green khi WS connected
- WS event `like:new` / `comment:new` / `save:new` / `visitor:join` → prepend activity log entry (max 50, oldest fade out)
- WS event `comment:new` với status PENDING → pending badge `+1`
- Stat cards refresh mỗi 30s OR on WS event

---

## Screen 5: Login (`/auth/login`)

**Linked UCs:** UC-10 (đăng nhập), UC-09 (link tới register)
**User roles:** Anonymous (chưa login)

### Layout

```
                  ┌────────────────────────────┐
                  │ ┌─ scan line animation ┐   │
                  │ Terminal header             │
                  │ < > kha.blog v0.1.0         │
                  │ ~/auth/login_  (blink)      │
                  │ ──────────────────────      │
                  │ // authenticate to continue │
                  │                             │
                  │ username                    │
                  │ ❯ enter username...         │
                  │                             │
                  │ password                    │
                  │ ❯ enter password...    👁   │
                  │                             │
                  │ [error if any, red]         │
                  │                             │
                  │ [  AUTHENTICATE ↵  ]        │
                  │                             │
                  │ ── or ──                    │
                  │ Continue as anonymous →     │
                  │ // no account?              │
                  │   ❯ register here           │
                  └────────────────────────────┘
                  ● connected to server  build: a1b2c3
```

### Components

| Component                       | Source                                    |
| ------------------------------- | ----------------------------------------- |
| TerminalCard                    | DESIGN_SYSTEM > TerminalCard              |
| Input (with `❯` prefix)         | DESIGN_SYSTEM > Input                     |
| PasswordInput (with eye toggle) | DESIGN_SYSTEM > Input > password variant  |
| Button (primary terminal style) | DESIGN_SYSTEM > Button > primary terminal |
| AsciiSpinner                    | DESIGN_SYSTEM > AsciiSpinner              |

### State machine

| State        | Trigger    | UI                                               |
| ------------ | ---------- | ------------------------------------------------ |
| `idle`       | Mount      | Form trống, focus on username                    |
| `validating` | Submit     | Button `[ ⠋ AUTHENTICATING... ]` disabled        |
| `error`      | Login fail | Red error message + shake animation 0.4s         |
| `success`    | Login ok   | Brief success → redirect `/` hoặc `?next=`target |

### Interactions

- **Username/password input focus**: border cyan + glow
- **Password eye toggle**: 👁 / 🙈 swap visibility
- **Submit (Enter or button)**: validate non-empty → POST `/auth/login`
- **Error**: card shake animation; persist error message until next input change
- **Continue as anonymous**: navigate `/` không create session
- **Register link**: navigate `/auth/register`
- **Cursor blink**: terminal-style `_` blinks 530ms cycle on path label

### Responsive

- Card max-width 420px, centered viewport mọi breakpoint
- Mobile: padding tăng outer, card vẫn 420px nhưng có margin

### Animations

- **Card scan line**: 2px gradient strip moves top→bottom infinite 4s linear
- **Cursor blink**: opacity 1↔0 every 530ms
- **Shake (error)**: ±5px X-translate, 0.4s ease
- **FadeUp (mount)**: opacity + translateY 10px, 0.35s ease

---

## Screen 6 (defer): Register (`/auth/register`)

**Status:** Not in design source — defer to implementation phase. Reuse Login screen pattern với 2-3 fields thêm (username, password, optional email).

---

## Template thêm screen mới

```markdown
## Screen X: <Tên> (`/route/path`)

**Linked UCs:** UC-XX, UC-YY
**User roles:** ADMIN | USER | Anonymous | All

### Layout

\`\`\`
[ASCII wireframe layout]
\`\`\`

### Components

| Component | Source              |
| --------- | ------------------- |
| ...       | DESIGN_SYSTEM > ... |

### State machine

| State | Trigger | UI  |
| ----- | ------- | --- |
| ...   | ...     | ... |

### Interactions

- ...

### Responsive

- `<768px`: ...
- `<640px`: ...

### Real-time (nếu có)

- WS event `...` → ...
```
