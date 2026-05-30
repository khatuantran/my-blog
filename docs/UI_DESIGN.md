# UI Design

> **Focus:** screen-level wireframes + user flow + interaction spec.
> Design tokens + component primitives: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
> Reference trực quan (HTML/JSX prototype): [`design-file/`](../design-file/) — bộ prototype **tham khảo**, đối chiếu khi cần (không phải source of truth). Spec visual chính thức là chính `UI_DESIGN.md` + `DESIGN_SYSTEM.md`.
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

| Element        | Detail                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logo           | SVG `< >` brackets (cyan/purple) + text `kha.blog` (Space Grotesk 700, "." cyan, "blog" muted), glitch animation 9s loop                                                                                                                                                                                                                                 |
| Search input   | Centered (440px max), placeholder `~$ search posts, tags, users...`, JetBrains Mono 13px. **`readOnly` + `onClick`/`onFocus` → `navigate('/search')` ngay lập tức** (per design-file Feed.html L1233 — không submit form, không nhập tại TopBar; mọi typing diễn ra ở `BigSearchInput` của `/search` autofocus). T-402 supersede pattern form submit cũ. |
| ⌘K hint button | Right end of search input — click open Command Palette                                                                                                                                                                                                                                                                                                   |
| Version badge  | `[ v0.1.0 ]` (JetBrains Mono 10px, border muted)                                                                                                                                                                                                                                                                                                         |
| Online count   | `● N` (green pulse + count)                                                                                                                                                                                                                                                                                                                              |
| Avatar         | 32px circle, gradient bg (cyan→purple), border cyan, online dot bottom-right. Click → dropdown menu                                                                                                                                                                                                                                                      |

**TopBar prop `hideSearch?: boolean`** (default `false`) — khi `true` ẩn cả search input + ⌘K hint. AppLayout sniff `useLocation().pathname === '/search'` → set `hideSearch={true}` (avoid duplicate hero search trên trang Search).

**Avatar dropdown menu items (authed — updated 2026-05-24 design-file sync, link [[DESIGN_SYSTEM.md#AvatarMenu (TopBar dropdown — design-file 2026-05-24)|AvatarMenu]]):**

Design-file chốt 7 items theo order:

- Header: mini avatar 28 + `~/{username}` blu + `[ ADMIN ]` ora badge (chỉ ADMIN)
- 📝 Manage Posts (blu `#7DCFFF`) → `/admin/posts`
- ⚙️ Admin Dashboard (purple, ⌘3) → `/admin` (admin only)
- 🏷 Manage Tags (yellow) → `/tags` (admin only)
- 🔧 System Settings (green) → TBD
- **Separator** 1px `--b2`
- 👤 Profile (color default, KHÔNG accent — distinguishable từ admin items) → `/profile/{user.username}` (FR-11.2)
- 🚪 Logout (red, ⌘Q) → POST /auth/logout → `/auth/login`

Note: Items ordering deprecated cũ (Create Post / Saved at top) — design-file 2026-05-24 nhóm admin actions trước, user actions sau separator.

Avatar style: 32×32 cyan border 2px + gradient bg cyan/pur + **green status dot 8×8 bottom-right** (border 1.5px `--surf`, shadow `0 0 5px grn`). Hover/open: shadow `0 0 18px cyan/40` (stronger).

**Guest variant:** Login + Register chỉ.

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

**Nav items wire (FR-08.4):** Feed → `/`, Search → `/search`, Saved → `/saved`, Tags → `/tags`, Profile → `/profile/{user.username}` (chỉ render khi authed), Admin → `/admin` (chỉ render khi admin), Create Post → `/admin/create` (admin), Toggle theme + Logout actions. **Fix bugs hiện tại:** `n-saved`/`r-search` đang điểm `to: '/'` → đổi sang đúng route.

---

## Screen 1: Feed (`/`)

**Linked UCs:** UC-02 (xem feed), UC-04 (anonymous like/comment), UC-03 (vào detail)
**User roles:** Tất cả (P1/P2/P3)

### Layout

````
┌─────────────────── TopBar (52px) ─────────────────────┐
│                                                       │
│         // feed.posts · 42 total                      │
│         [Filter: All|😊|⚡|💭|😌|😢]   [Latest ▾]    │
│                                                       │
│         ┌──────── PostCard (max-w 820px) ─────────┐  │
│         │ A ~/admin [ADMIN] · #abc123 · 2h ago    │  │
│         │ 😊 happy                                 │  │
│         │                                          │  │
│         │ <content markdown>                       │  │
│         │ ```code block```                         │  │
│         │ [image grid 2x2]                         │  │
│         │ // attachments [2]                       │  │
│         │ [PDF] doc.pdf 1.2MB ↓                    │  │
│         │ #code #dev #debugging                    │  │
│         │ ─────────────                            │  │
│         │ [React 24] [💬 5] [↗ Share]    [⋯]      │  │
│         └──────────────────────────────────────────┘  │
│                                                       │
│         [more PostCards...]                           │
│         [⠋ loading posts...]                          │
│                                                       │
├───────────────────────────────────────────────────────┤
└────────────────── StatusBar (28px) ───────────────────┘
````

> **Note:** Feed page **không có Sidebar / RightPanel**. Mood filter pills nằm inline trên FilterBar; mood.distribution + activity.heatmap di chuyển sang Admin Dashboard. Feed area centered max-width 820px (theo design-file/MyBlog Feed.html).

### Components

| Component                     | Source                          |
| ----------------------------- | ------------------------------- |
| FilterBar (mood pills + sort) | DESIGN_SYSTEM > FilterBar       |
| PostCard                      | DESIGN_SYSTEM > PostCard        |
| ImageGrid                     | DESIGN_SYSTEM > ImageGrid       |
| FileAttachments               | DESIGN_SYSTEM > FileAttachments |
| MoodBadge                     | DESIGN_SYSTEM > MoodBadge       |
| TagPill                       | DESIGN_SYSTEM > TagPill         |
| AsciiSpinner (loading)        | DESIGN_SYSTEM > AsciiSpinner    |

### State machine

| State     | Trigger       | UI                                                                                         |
| --------- | ------------- | ------------------------------------------------------------------------------------------ |
| `initial` | Mount         | Skeleton 3 PostCards                                                                       |
| `loading` | Fetch         | Skeleton hoặc bottom spinner `⠋ loading posts...`                                          |
| `success` | Data received | PostCards rendered với `fadeUp .3s ease` (stagger 60ms delay)                              |
| `empty`   | Zero posts    | ASCII deco `◐` + `// no posts matching filter` + `$ cd ../feed && ls -la --all-moods` hint |
| `error`   | Fetch fail    | Retry button + `// connection lost` message                                                |

### Interactions (updated 2026-05-24 design-file sync)

- **Infinite scroll**: IntersectionObserver trên sentinel div (rootMargin 120px) → load thêm 2 posts với 700ms delay simulate. Loading state: `<AsciiSpinner /> loading posts...` mono 13 muted. End state: `// end of feed · N posts loaded` deeper muted.
- **Mood filter click**: toggle (click lại để clear) → reset `shown=2` → re-fetch
- **PostCard hover**: border cyan glow, top gradient line `linear-gradient(90deg,transparent,cyan,transparent)` fade in
- **Image click → opens [[DESIGN_SYSTEM.md#ImageLightbox (Feed — design-file 2026-05-24)|ImageLightbox]] overlay** (keyboard ← → Esc, click backdrop to close).
- **Hover React button → reveal ReactionPicker popover with 250ms close debounce** ([[DESIGN_SYSTEM.md#Hover-reveal popover with grace period|Hover-reveal popover pattern]] — CRITICAL bug fix). 6 SVG line-art icons LIKE/LOVE/HAHA/WOW/SAD/ANGRY (KHÔNG emoji). Click trigger = LIKE default (toggle off nếu đang có reaction). Click icon = upsert reaction type. Click top-3 stacked icons + count = mở ReactionList modal. Optimistic local mirror, rollback nếu fail. 410 Gone từ legacy `/like` → disable + inline error.
- **Comment `💬` button click → mở [[DESIGN_SYSTEM.md#CommentsModal (Feed — design-file 2026-05-24) — DEFINITIVE pattern|CommentsModal]] popup (KHÔNG navigate `/post/:id`)**. DEFINITIVE pattern từ design-file 2026-05-24. Post Detail page vẫn tồn tại nhưng chỉ accessed qua direct URL (deep-link/SEO).
- **`⋯` button click → mở [[DESIGN_SYSTEM.md#PostActionMenu (Feed — design-file 2026-05-24)|PostActionMenu]]** với items: Open detail / Copy link / **🔖 Save post** / (admin) Edit / Pin / Archive / Hide comments / **(danger)** Delete. Click outside → close. **Save post moved here từ standalone SaveButton** — KHÔNG còn save button riêng trong action row.
- **Share button (↗)**: open share dropdown (Facebook/X/Telegram/Copy link)
- **PostCard click (vùng trống)**: navigate `/post/<id>`
- **TagPill click**: filter feed theo tag

### Responsive breakpoints

- `<768px`: padding main giảm `10px 12px`
- `<640px` (mobile): PostCard padding giảm; image grid stack vertically nếu cần

### Real-time updates (FR-09)

- WS event `post:new` → prepend vào feed (with `fadeUp` animation)
- WS event `reaction:new` (payload `{ postId, totalCounts, topThree, type }`) → patch reactions count + topReactions cho PostCard `postId` match
- WS event `online:count` → update TopBar/StatusBar online count

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
│     😊 happy · 2h ago                │  Reactions24 │
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
│  👍❤️😆24 💬5 🏷 ↗Share  👁142 views │  [post2]     │
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

### Interactions (updated 2026-05-24 design-file sync)

- **Action row (Post Detail variant — design-file 2026-05-24):** Chỉ 3 button (React/Comment/Share) + `(ml-auto) 👁 N views` counter. **KHÔNG có Save button, KHÔNG có ⋯ menu** (khác PostCard Feed variant). Save accessed via PostActionMenu on Feed.
- **Hover React button → ReactionPicker với 250ms close debounce** ([[DESIGN_SYSTEM.md#Hover-reveal popover with grace period|Hover-reveal popover pattern]]) — giống Screen 1 Feed pattern.
- **Comment `💬` button trên Post Detail:** scroll-to comment section inline (KHÔNG mở modal — đã có inline comment form ở dưới content). Note: KHÁC Feed variant (Feed dùng modal).
- **ImageCarousel**: ← → buttons + dot indicator click; keyboard arrow nav khi focused; touch swipe mobile
- **Comment form `post as anon` toggle**: switch between auth user mode và anonymous input mode
- **Comment submit**: optimistic insert; rollback on fail
- **Like comment:** traditional `♡/❤` toggle (KHÔNG reaction picker — chỉ post mới có reactions multi-type). Comment vẫn dùng binary like.
- **Reply button** (CommentItem): MVP feature — mở [[DESIGN_SYSTEM.md#ReplyForm (NEW — design-file 2026-05-24)|ReplyForm]] inline với prefix `↩ replying to @username`. Reply depth 1 only (no nested reply trong reply). Render thành [[DESIGN_SYSTEM.md#ReplyRow (NEW — design-file 2026-05-24)|ReplyRow]] indented 40px dưới comment cha. **Bỏ note "defer feature" cũ** — feature đã trong design-file MVP.
- **Share button click**: open dropdown (4 options Facebook/X/Telegram/Copy link với brand colors); copy link → toast "Copied"
- **Related post click**: navigate to that post (full page replace)
- **View count**: increment 1 lần / 30min / session (debounced via `POST /posts/:id/view`)

### Responsive

- `<1024px`: ẩn MetaPanel right
- `<768px`: breadcrumb compact, hide search trong TopBar

### Real-time

- Khi mount: client emit `room:join` cho room `post:<id>`
- WS event `comment:new` (filtered theo postId) → prepend comment list
- WS event `comment:status` (PENDING→APPROVED) → re-render
- WS event `reaction:new` → patch reactions count + topReactions + myReaction
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

| Component                                             | Source                          |
| ----------------------------------------------------- | ------------------------------- |
| Sub-toolbar                                           | DESIGN_SYSTEM > Sub-toolbar     |
| MoodPicker (7 emoji buttons)                          | DESIGN_SYSTEM > MoodPicker      |
| MarkdownEditor (textarea + toolbar + 😀 emoji button) | DESIGN_SYSTEM > MarkdownEditor  |
| EmojiPicker (popover 4 tabs × 16 emoji)               | DESIGN_SYSTEM > EmojiPicker     |
| UploadZone (images + files)                           | DESIGN_SYSTEM > UploadZone      |
| ImageThumb (preview thumb)                            | DESIGN_SYSTEM > ImageThumb      |
| FileAttachments (mini editing list)                   | DESIGN_SYSTEM > FileAttachments |
| TagInput (tag + chip)                                 | DESIGN_SYSTEM > TagInput        |
| PostPreview (right pane)                              | DESIGN_SYSTEM > PostPreview     |
| ToolbarButton (B/I/code/h/link)                       | DESIGN_SYSTEM > ToolbarButton   |
| Button (publish/save draft)                           | DESIGN_SYSTEM > Button          |

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
- **Emoji picker (FR-02.7)**: click 😀 toolbar button → popover mở (320px wide) với 4 tab (faces/hands/dev/nature × 16 emoji); click emoji insert vào textarea tại cursor (reuse `insert-at-cursor.ts`); Esc hoặc outside-click close
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
- WS event `reaction:new` / `comment:new` / `save:new` / `visitor:join` → prepend activity log entry (max 50, oldest fade out)
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

## Screen 6: Register (`/auth/register`)

**Status:** Implemented M10 T-091. Reuse `TerminalCard` từ Login. 3 fields (username 3-32 chars regex `[a-zA-Z0-9_-]` + password min 8 + email optional). Submit `[ CREATE ACCOUNT ↵ ]` → POST /auth/register → setUser + navigate `/`. Error mapping 409 → `username already taken`, 400 → `invalid input · check fields`.

---

## Screen 7: Profile (`/profile/:username` + `/me` redirect)

**Linked UCs:** UC-14 (xem profile + edit own)
**User roles:** Public xem + Self edit + Admin xem all tabs (incl. Saved)

### Layout

```
┌────────── TopBar (52px, hideSearch=false) ──────────┐
├── Hero (gradient bg, max-w 1100px, py-12) ─────────┤
│  ┌──────┐                                            │
│  │ 88px │  Kha Tran           [ ADMIN ]              │
│  │ ring │  Full-stack Developer                      │
│  └──────┘  Bio paragraph 2-3 lines truncate...       │
│            42 posts · 287 likes · 1.2k views         │
│                                       [ ✎ Edit ]    │  ← self only
├── Tabs (sticky, border-b) ──────────────────────────┤
│   Posts │ Saved │ Activity │ About                  │  ← ?tab= query
├────────────────────────────────────┬─────────────────┤
│  MAIN (flex-1)                     │ SIDEBAR (280px) │
│                                    │                 │
│  ── Posts tab ──                   │ // about.me     │
│  // posts.all  42 total            │ Bio markdown    │
│  [ PostCard ] [ PostCard ] ...     │                 │
│                                    │ // skills.top   │
│  ── Saved tab (self/admin only) ── │ [TS] [React] .. │
│  // saved.posts  8 items           │                 │
│  [ PostCard ] [ PostCard ] ...     │ // mood.breakdown│
│                                    │ [MoodBar × 7]   │
│  ── Activity tab ──                │                 │
│  // recent.actions                 │ // activity.28d │
│  [ ActivityLogItem × 50 ]          │ [HeatmapGrid]   │
│                                    │                 │
│  ── About tab ──                   │ // tags.used    │
│  // about.me  (bio full)           │ #code #life ... │
│  // skills.stack (chips)           │                 │
│  // tags.used                      │                 │
└────────────────────────────────────┴─────────────────┘
```

### Components

| Component                                                                                                                         | Source                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ProfileAvatar (rotating ring 88px + green online dot — `borderRotate 8s` linear, gradient stroke cyan→pur→mag, dasharray `"6 4"`) | DESIGN_SYSTEM > ProfileAvatar. ⚠ **FE has 6 visual bugs vs design-file** (Gap 35): `spin 4s` vs `borderRotate 8s`, dasharray sai, solid stroke vs gradient, 1px vs 2px border, **missing online dot**, missing inner/text shadow. → F3 bug task. |
| Hero stats inline                                                                                                                 | inline layout                                                                                                                                                                                                                                    |
| Tabs (4: Posts/Saved/Activity/About)                                                                                              | DESIGN_SYSTEM > TabButtons                                                                                                                                                                                                                       |
| EditProfileDrawer (self) — bổ sung `// avatar` section đầu drawer (FR-11.7)                                                       | DESIGN_SYSTEM > EditProfileDrawer                                                                                                                                                                                                                |
| AvatarUploadModal (FR-11.7) — react-easy-crop 1:1 + zoom + Upload/Cancel                                                          | DESIGN_SYSTEM > AvatarUploadModal (NEW)                                                                                                                                                                                                          |
| SkillChipInput (drawer)                                                                                                           | DESIGN_SYSTEM > SkillChipInput                                                                                                                                                                                                                   |
| PostCard (Posts/Saved)                                                                                                            | existing                                                                                                                                                                                                                                         |
| ActivityLogItem (Activity tab)                                                                                                    | DESIGN_SYSTEM > ActivityLogItem                                                                                                                                                                                                                  |
| MoodBar (sidebar mood breakdown)                                                                                                  | existing                                                                                                                                                                                                                                         |
| HeatmapGrid (sidebar 28d)                                                                                                         | DESIGN_SYSTEM > HeatmapGrid                                                                                                                                                                                                                      |
| TagPill (tags.used)                                                                                                               | existing                                                                                                                                                                                                                                         |
| StatSparkline (sidebar)                                                                                                           | DESIGN_SYSTEM > StatSparkline                                                                                                                                                                                                                    |

### State machine

| State         | Trigger                         | UI                              |
| ------------- | ------------------------------- | ------------------------------- |
| `loading`     | Mount fetch user + stats        | Skeleton hero + placeholder     |
| `404`         | User not found                  | `// user @{username} not found` |
| `ready`       | Data ok                         | Render hero + tabs + sidebar    |
| `editing`     | Self click `[ ✎ Edit Profile ]` | Drawer slide-in                 |
| `saving`      | Submit drawer profile section   | Button `⠋ saving...` disabled   |
| `pw-changing` | Submit security section         | Button `⠋ ...` + validation     |
| `error`       | PATCH/auth fail                 | Inline banner trong drawer      |

### Interactions

- **Tab switching**: URL `?tab=posts|saved|activity|about` (default `posts`). Saved tab + **Activity tab** visible chỉ self/admin (privacy FR-11.5 + FR-13.3).
- **Edit drawer**: Self click `[ ✎ Edit Profile ]` → drawer slide-in từ phải 420px, backdrop blur. Esc / outside-click close.
- **Profile section submit**: PATCH /users/:selfId → cache invalidate `/users/by-username` + `/users/:id/stats`.
- **Security section submit**: client-side check newPassword === confirm → POST /auth/change-password. Wrong current → 401 inline error, drawer giữ open.
- **Avatar section (FR-11.7)** — `// avatar` block đầu drawer (trước `// basic.info`):
  - Layout row: ProfileAvatar 56×56 preview (real avatarUrl nếu có / fallback default SVG) + 2 button column right (`↑ Upload` cyan + `× Remove` đỏ — Remove chỉ visible khi avatarUrl ≠ null).
  - **Upload flow:** click `↑ Upload` → `<input type=file accept="image/jpeg,image/png,image/webp" hidden>` trigger → user chọn file → FE validate inline (mime + size ≤ 5MB), reject với toast nếu sai → mở AvatarUploadModal với file URL (FileReader).
  - **AvatarUploadModal:** 480px portal, z-modal, animate-fade-up-sm. Body: `<Cropper>` (react-easy-crop) area 320×320 với image + aspect 1 + zoom 1-3 + showGrid false. Footer: zoom slider full-width + 2 button (Cancel + `↑ Upload` cyan filled). Esc / backdrop close.
  - **Submit:** click `↑ Upload` trong modal → canvas.toBlob từ cropped area → POST `/users/me/avatar/sign` → upload blob trực tiếp lên Cloudinary với signed FormData → PATCH `/users/me/avatar { url, publicId }` → modal close + drawer header preview update + TanStack Query invalidate `['user-by-username', username]` + `['users-me']`.
  - **Remove flow:** click `× Remove` → ConfirmDialog `Remove avatar?` → confirm → DELETE `/users/me/avatar` → cache invalidate giống trên → UI fallback default ProfileAvatar SVG.
  - **Loading states:** Upload button → `⠋ uploading...` disabled trong khi POST/upload/PATCH chain chạy. Remove button → `⠋ removing...`.
  - **Error states:** Cloudinary upload fail → toast error `upload failed — try again` + modal giữ open + user retry. PATCH 401 → authStore reset → redirect login (existing 401 interceptor logic).
- **Stats sparkline**: hover heatmap cell → tooltip `{date} · {count} posts`.
- **Activity tab** (FR-13):
  - Fetch `GET /users/:id/activity?page=1&limit=20` via `useUserActivity` (`useInfiniteQuery`).
  - List ProfileActivityItem: icon-left (📝 POST_CREATED / 💬 COMMENT_CREATED / 👍 LIKE_CREATED / 🔖 SAVE_CREATED) + middle text direction-aware (OUTGOING `You liked <snippet>` / INCOMING `<actor.username> commented on your post · <snippet>`) + relative time right.
  - Click target snippet → navigate `/post/:id`. Nếu `snippet === null` (target deleted) → render `[deleted post]` text-tm, không link.
  - Sentinel IntersectionObserver bottom → load next page (≤50 limit per page).
  - Empty state `// no activity yet`.
  - Error 403 (viewer ko phải self/admin) → render `// activity is private` defensive (tab đáng lý hidden, nhưng phòng URL force).

### Responsive

- `<lg` (1024px): ẩn right sidebar (single column).
- `<md` (640px): drawer full-width slide-up từ bottom thay vì right.

---

## Screen 8: Search (`/search?q=…`)

**Linked UCs:** UC-15 (anonymous/user search)
**User roles:** Public

### Layout (T-400 redesign per design-file/MyBlog Search.html)

```
┌────── TopBar (hideSearch=true, ⌘K vẫn còn) ──────────────┐
├── Hero (max-w 720px center) ─────────────────────────────┤
│  ❯ search                                                │
│  ┌────────────────────────────────────────────┐          │
│  │ search posts, #tags, files...        ⌘K   │          │  ← BigSearchInput
│  └────────────────────────────────────────────┘          │
│  [All][Saved][Files] │ [😊][⚡][💭][😌][😢][🙏][😠] [reset×] │  ← chip+divider+mood+reset
├──────────────────────────────────────────────────────────┤
│ EMPTY STATE (q='' + no filter, max-w 820px center) ─────│
│  // recent.searches                            [clear]   │
│  [↺ react hooks][↺ #code][↺ deploy][↺ cursor ai]…       │  ← chip-pill 13px
│                                                          │
│  // browse.tags                                          │
│  [#code 24][#life 18][#travel 9][#books 6][#ai 5]       │  ← custom chip per-color + count
│                                                          │
│  // all.posts {N} total                                  │
│  [ ResultCard preview × N ]                              │
├──────────────────────────────────────┬───────────────────┤
│ RESULTS (when q OR filter) MAIN     │ SIDEBAR 280px (lg+)│
│  // results · N match(es)            │ 4 StatBox          │
│  [ ResultCard với highlight × N ]    │ (Total/Imgs/       │
│  // tags                             │  Files/Saved)      │
│  [ TagPill × N ]                     │                    │
│  // files                            │                    │
│  [ pdf · filename.pdf × N ]          │                    │
│  Empty: ◎ no results for "{q}"       │                    │
└──────────────────────────────────────┴────────────────────┘
```

ResultCard layout (design-file 1:1):

```
┌── ResultCard ──────────────────────────────────  #idShort ┐
│ [A] ~/username [ ADMIN ] · [YYYY-MM-DD HH:MM]   😊 happy  │  ← top row (avatar 26 + 13/10/11 + mood ml-auto)
│ Content preview 15px line-clamp-2…                        │
│ [#tag1][#tag2][📎 N files]               ♡ N · 💬 N      │  ← bottom row (tags + files + stats ml-auto)
└───────────────────────────────────────────────────────────┘
```

### Components

| Component                   | Source                                                           |
| --------------------------- | ---------------------------------------------------------------- |
| BigSearchInput (hero)       | DESIGN_SYSTEM > BigSearchInput                                   |
| FilterChip (3 type)         | DESIGN_SYSTEM > FilterChip                                       |
| Mood emoji button (7)       | inline 14px rounded-[5px] 30×28                                  |
| ResultCard (enriched T-400) | inline — avatar + admin + ts + mood right + tags + files + stats |
| Recent search chip          | inline pill 13px + ↺ prefix                                      |
| Browse tag chip with count  | inline 13px per-color + postCount                                |
| StatBox (sidebar 4)         | inline                                                           |
| TagPill (tags results)      | shared `components/shared/TagPill`                               |

### State machine

| State       | Trigger                        | UI                                  |
| ----------- | ------------------------------ | ----------------------------------- |
| `idle`      | Mount, empty q                 | Sidebar stats only, main empty hint |
| `searching` | URL q changes (debounce 250ms) | `⠋ searching...`                    |
| `results`   | API 200 với items > 0          | ResultCard grid                     |
| `empty`     | API 200 với items=0            | `// no results for "{q}"`           |
| `error`     | API 5xx                        | Inline error                        |
| `throttled` | 429                            | `// too many searches · retry`      |

### Interactions

- **Input → URL**: debounce 250ms → `setSearchParams({ q })`. Triggers refetch.
- **FilterChip click**: toggle `?type` (All/Saved/Files) hoặc `?mood`.
- **ResultCard click**: navigate `/post/:id`.
- **Highlight match**: split content theo regex `new RegExp(q, 'gi')` → wrap `<mark className="bg-cyan/30 text-cyan">{match}</mark>` (KHÔNG `dangerouslySetInnerHTML`).
- **Recent searches**: localStorage key `myblog.recentSearches` (FIFO max 10 dedupe). Click entry → fill input + navigate.
- **Browse.tags**: click → navigate `/?tag=name` Feed.
- **Throttle 429**: show banner `// too many searches · retry in {retryAfter}s` — disable submit cho đến khi hết.
- **SEO**: `<meta name="robots" content="noindex">` trên page mount.

### Responsive

- `<lg`: ẩn sidebar.
- `<md`: 1-col result grid.

---

## Screen 9: Tags (`/tags` — admin actions conditional)

**Linked UCs:** UC-13
**User roles:** Public browse + ADMIN CRUD

### Layout

```
┌────── TopBar ──────┐
├── Header section (max-w 1200px) ───────────────────┤
│  // tags.all                                        │
│  [ Stat card × 4: Total / Tagged posts / Most used / Recent ] │
├── Toolbar ─────────────────────────────────────────┤
│  [❯ search tags...]  [ sort: posts ▾ ]  [ grid ▦ ] [ list ☰ ] │
│                                       [ + New Tag ]  ← admin │
├── Grid view (responsive 1/2/3/4 cols) ─────────────┤
│  ┌─ TagCard ─────────┐  ┌─ TagCard ──────┐         │
│  │ ● #code  24 posts │  │ ● #life  18 .. │         │
│  │ Lập trình, debug. │  │ Cuộc sống ...  │         │
│  │ ⌒⌒⌒ sparkline7d │  │ ⌒⌒⌒          │         │
│  │ ████████░░ 90%   │  │ ███████░░░ 75% │         │
│  │ (hover admin:    │  │                 │         │
│  │  ✎ Edit · 🗑 Del)│  │                 │         │
│  └───────────────────┘  └─────────────────┘         │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

### Components

| Component              | Source                          |
| ---------------------- | ------------------------------- |
| Stat card (4)          | reuse Admin StatCard pattern    |
| Search input           | reuse `.srch-inp` style         |
| Sort dropdown          | DESIGN_SYSTEM > Dropdown        |
| View toggle            | DESIGN_SYSTEM > SegmentedToggle |
| TagCard                | DESIGN_SYSTEM > TagCard         |
| TagModal (create/edit) | DESIGN_SYSTEM > TagModal        |
| DeleteConfirm dialog   | DESIGN_SYSTEM > ConfirmDialog   |
| MiniSparkline          | reuse `Sparkline` T-077         |

### State machine

| State            | Trigger                   | UI                                 |
| ---------------- | ------------------------- | ---------------------------------- |
| `loading`        | Mount fetch tags          | Skeleton grid                      |
| `ready`          | API ok                    | Render grid/list                   |
| `modal-create`   | Admin click `+ New Tag`   | TagModal open create variant       |
| `modal-edit`     | Admin click ✎ trên card   | TagModal open edit variant         |
| `modal-saving`   | Submit modal              | Button `⠋ ...` disabled            |
| `confirm-delete` | Admin click 🗑            | DeleteConfirm dialog với postCount |
| `error`          | API 5xx hoặc 409 dup name | Inline banner trong modal          |

### Interactions

- **Card click**: navigate `/?tag=name` Feed filter.
- **Admin hover overlay**: render `✎ Edit` (open TagModal edit) + `🗑 Delete` (open ConfirmDialog).
- **Create form**: name (required, unique) + color (swatch grid từ TAG_COLORS palette) + description (max 280) + preview chip live. Submit POST /tags → cache invalidate.
- **Edit form**: pre-fill values. Submit PATCH /tags/:id.
- **Delete confirm**: nếu `postCount > 0` → text `"This tag is used by N posts. Are you sure?"` + button `[ Force Delete ]` (double-confirm). Submit DELETE /tags/:id?force=true.
- **Sort**: dropdown values `name|posts|recent` → update query → refetch.
- **View toggle**: localStorage persist `myblog.tagsView = grid|list`.

### Responsive

- `<1024px`: 2-col grid; `<640px`: 1-col.
- Modal: max-w 480px, center.

---

## Screen 10: Saved (`/saved`)

**Linked UCs:** UC-05 (auth user save bài)
**User roles:** Authed only (redirect `/auth/login?next=/saved` nếu guest)

### Layout

- Reuse Feed page pattern (FeedPage + PostList).
- Header `// saved.posts {total} items`.
- Empty state `// no saved posts yet — browse feed and 🔖 to save`.

### Interactions

- Hooks: `useSavedPosts` (existing `listSavedPosts` service T-saved).
- Unsave: `useTogglePostSave` (existing) → optimistic remove khỏi list.

---

## Screen 11: Notifications (`/notifications`) — REWRITE 2026-05-24 design-file sync

**Linked UCs:** UC-17 (receive), UC-18 (manage)
**User roles:** Authed only (redirect `/auth/login?next=/notifications` nếu guest)
**Reference (source of truth):** [`design-file/MyBlog Notifications.html`](../design-file/MyBlog%20Notifications.html) L52-256
**Status:** ⚠ Scope expanded vs current FR-14 — flag F2 amend FR-14 trước F1 implement (6 type tabs + search + bulk + toast).

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ TopBar (52px) — Logo + Search + Online + Bell🔔(N) + Avatar  │
├── SubBar (44px) ─────────────────────────────────────────────┤
│ ~/notifications · N total · M unread        [ ✓ mark all read │
│                                              ] [ ✕ clear all ]│
├──────────────────────────────────────────────────────────────┤
│ [◉ All N] [● Unread M] [❤ Reactions K] [💬 Comments L]       │
│ [↩ Replies P] [↗ Shares Q]                                   │ ← 6 type tabs
│ ─────────────────────────────────────────────────────────    │
│ ⌕ search by user, content, post id...        [☐ select all]  │
│ ─────────────────────────────────────────────────────────    │
│ // showing N of M notifications · filter "..." · tab reply   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ // today · 5                                           │   │
│ │ ☐ ⭕@bob ❤️badge reacted to your post  "<snip>..."     │   │
│ │                                          2m · ● new  ○ ✕│   │
│ │ ☐ ⭕@alice 💬badge commented on your post                │   │
│ │                                          5m         ● ✕ │   │
│ │ ☐ ⭕@user2 ↩badge replied to your comment on …          │   │
│ │           from @user1                  8m · ● new  ○ ✕ │   │ ← reply variant
│ │ ─ // yesterday · 2 ──────────────────────────────────  │   │
│ │ ...                                                    │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ Bulk action bar (visible khi selected > 0):                  │
│   N selected  [✓ mark read] [✕ delete] [clear]               │
│                                                              │
│ Toast (bottom-right slideDown 2500ms):                       │
│   ✓ All marked as read   /   ✕ Deleted 3 notifications       │
├──────────────────────────────────────────────────────────────┤
│ StatusBar (28px) — path ~/notifications + build + online     │
└──────────────────────────────────────────────────────────────┘

Empty states (2 variants):
   ◎ // no notifications yet · inbox zero achieved        (notifs.length === 0)
   ◎ // no notifications matching filters [← clear]       (filtered === 0)
```

### Components (updated 2026-05-24 design-file sync)

| Component        | Source                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| NotificationBell | DESIGN_SYSTEM > NotificationBell (SVG bell + bordered button + ring badge + threshold 9+)                                    |
| SubBar           | DESIGN_SYSTEM > SubBar (`~/notifications · N total · M unread` + actions right)                                              |
| TabBar (6 types) | local — All / Unread / Reactions / Comments / Replies / Shares — `.tab-btn` style with count badges                          |
| Search input     | DESIGN_SYSTEM > Input (search variant) — `⌕ search by user, content, post id...` with × clear                                |
| Bulk action bar  | local — visible khi `selected.size > 0`: `N selected` cyan + mark read + delete + clear buttons                              |
| NotifRowPage     | DESIGN_SYSTEM > **NotifRowPage** (40×40 avatar + 20×20 badge + 3px border + checkbox + replyTo field)                        |
| Avatar           | DESIGN_SYSTEM > Avatar                                                                                                       |
| Toast            | DESIGN_SYSTEM > Toast (bottom-right slideDown 2500ms 3 variants)                                                             |
| ConfirmDialog    | DESIGN_SYSTEM > ConfirmDialog (used for `clear all` — design-file currently uses native `window.confirm`, recommend replace) |

### State machine

| State              | Trigger               | UI                                                               |
| ------------------ | --------------------- | ---------------------------------------------------------------- |
| loading            | mount, filter change  | skeleton 5 rows + spinner                                        |
| empty (all)        | `notifs.length === 0` | `◎ // no notifications yet · inbox zero achieved`                |
| empty (filtered)   | `filtered === 0`      | `◎ // no notifications matching filters` + `← clear` button      |
| list               | items > 0             | rows group time (today/yesterday/older) sticky labels + sentinel |
| bulk-select-active | `selected.size > 0`   | bulk action bar visible (mark read / delete / clear)             |
| error              | query fail            | `// failed to load — retry`                                      |

### Interactions (updated 2026-05-24 design-file sync)

- Hook: `useNotifications({ filter, search, page, limit })` qua `useInfiniteQuery`, key `qk.notifications.list({filter, search})`, page-based getNextPageParam.
- Hook `useUnreadCount()` polling 30s (defer WS T-315).
- **Tab switching:** 6 type tabs (All/Unread/Reactions/Comments/Replies/Shares) — click → set `tab` state + count badges per tab. Filter list theo `n.type === tab` (hoặc all/unread special).
- **Search input:** filter by `n.user / n.snippet / n.post`. Debounce 150ms.
- Click row → navigate target post + PATCH `:id/read` optimistic.
- **Actions row right per NotifRowPage:** `○`/`●` mark read toggle (color cyan if unread, muted if read) + `✕` delete (instant, no confirm — toast feedback).
- **Checkbox column (16×16 left of each row):** click tick → `selected` Set; bulk action bar appears.
- **Select all visible button** (when no selection): `☐ select all visible` mono 11 muted.
- **Bulk action bar (visible when `selected.size > 0`):** `N selected` cyan + `✓ mark read` (PATCH bulk) + `✕ delete` (DELETE `/notifications/bulk { ids }`) + `clear` (deselect all).
- **Mark all read button** (sub-bar right, visible khi unread > 0) → PATCH `/notifications/mark-all-read` → invalidate `['notifications']` + `['unread-count']` + toast `✓ All marked as read`.
- **Clear all button** (sub-bar right, visible khi `notifs.length > 0`) → `window.confirm("Delete all N notifications?")` → DELETE all → toast `✕ All notifications cleared`. **Recommend replace `window.confirm` bằng `ConfirmDialog` Tags variant 360px** (consistent UX).
- **Toast feedback:** mọi action (mark read / delete / bulk / clear) → trigger toast bottom-right slideDown 2500ms.
- **Reply notification special:** `n.type === 'reply'` → row hiển thị `from @<replyTo>` clause after verb (KHÔNG `your post`).

### Responsive

- `<768px`: Tab All/Unread stack vertical; toolbar `delete N` full-width sticky bottom.
- `<640px`: Avatar size sm (28px), snippet truncate 60 chars.
- `<480px`: ẩn meta timestamp inline → tooltip on tap.

### Real-time

- WS event `notification:new { notification }` → `qk.notifications.list` + unread-count invalidate (FR-14.6, defer T-315).

---

## Screen 12: Manage Posts (`/admin/posts`)

**Linked UCs:** UC-19 (quick edit), UC-20 (browse/filter)
**User roles:** ADMIN only (`ProtectedRoute requireRole=ADMIN`)
**Reference prototype:** [`design-file/MyBlog Manage Posts.html`](../design-file/MyBlog%20Manage%20Posts.html) (tham khảo)

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ TopBar (52px)                                                │
├──────────────────────────────────────────────────────────────┤
│ ~/admin/posts · {total} posts          [ + New Post → ]      │
│ ─────────────────────────────────────────────────────────    │
│ ⌕ search... | status ▾ | mood ▾ | sort ▾ | [☰ list | ▦ card]│
│ ─────────────────────────────────────────────────────────    │
│ LIST view (table 6-col):                                     │
│ ☐ | content snippet      | PUBLISHED | 😊 | #tag | ❤12 💬3 👁100 | ✎🗑│
│ ☐ | ...                  | DRAFT     | 😆 | #tag | ...           | ✎🗑│
│ ▼ load more / pagination                                     │
│                                                              │
│ CARD view (grid 2-col @ desktop):                            │
│ ┌──────────────┐ ┌──────────────┐                            │
│ │ snippet      │ │ snippet      │                            │
│ │ DRAFT 😊     │ │ PUBLISHED 😆 │                            │
│ │ ❤12 💬3 👁100│ │ ...          │                            │
│ │ ✎ Edit  🗑   │ │              │                            │
│ └──────────────┘ └──────────────┘                            │
│                                                              │
│ QuickEditModal (overlay):                                    │
│ ┌─────────────────────────────────────┐                      │
│ │ Edit post #abc123                ✕  │                      │
│ │ ─────────────────────────────────── │                      │
│ │ Status: [ PUBLISHED ▾ ]             │                      │
│ │ Mood:   [😊][😆][😢][...]            │                      │
│ │ Content: [textarea]                 │                      │
│ │ Tags:    [#tag1] [#tag2] [+ add]    │                      │
│ │ ─────────────────────────────────── │                      │
│ │           [ Cancel ] [ ✓ Save ]     │                      │
│ └─────────────────────────────────────┘                      │
│                                                              │
│ DeleteConfirm modal:                                         │
│ ┌─────────────────────────────────────┐                      │
│ │ ⚠️  Delete post?                     │                      │
│ │ "<snippet 80 chars>..."             │                      │
│ │ Hành động này không reverse.        │                      │
│ │           [ Cancel ] [ 🗑 Delete ]  │                      │
│ └─────────────────────────────────────┘                      │
├──────────────────────────────────────────────────────────────┤
│ StatusBar (28px) — path ~/admin/posts                        │
└──────────────────────────────────────────────────────────────┘
```

### Components

| Component             | Source                                      |
| --------------------- | ------------------------------------------- |
| FilterChip            | DESIGN_SYSTEM > FilterChip (reuse T-211)    |
| SegmentedToggle       | DESIGN_SYSTEM > SegmentedToggle             |
| StatusBadge           | DESIGN_SYSTEM > Status badge palette (mới)  |
| MoodBadge             | DESIGN_SYSTEM > MoodBadge                   |
| TagPill               | DESIGN_SYSTEM > TagPill                     |
| PostRow / PostCardMng | local (`components/admin/manage-posts/`)    |
| QuickEditModal        | local (`components/admin/QuickEditModal`)   |
| ConfirmDialog         | DESIGN_SYSTEM > ConfirmDialog (reuse T-211) |

### State machine

| State               | Trigger              | UI                                     |
| ------------------- | -------------------- | -------------------------------------- |
| loading             | mount, filter change | skeleton 6 rows                        |
| empty               | items.length=0       | `// no posts match filter`             |
| list-view           | URL `?view=list`     | table 6-col                            |
| card-view           | URL `?view=card`     | grid 2-col @ desktop                   |
| edit-modal-open     | click Edit           | QuickEditModal overlay + form pre-fill |
| delete-confirm-open | click Delete         | ConfirmDialog với snippet              |
| saving              | submit modal         | Save button → `[ saving... ]` spinner  |
| error               | query/mutation fail  | inline error banner trong modal        |

### Interactions

- Hook `useAdminPosts({ status, mood, sort, q, page, limit })` qua `useInfiniteQuery`, key `qk.admin.posts(filter)`.
- Mutations: `useUpdateAdminPost(id)` (PATCH), `useDeleteAdminPost(id)` (DELETE) → invalidate `['admin','posts']` + `['posts']`.
- Filter/sort/search → debounce 300ms → update URL query → refetch.
- View toggle → URL `?view=list|card` persist.
- Edit row → modal mở, prefill data từ row item. Save → optimistic patch + invalidate. Esc/Cancel/backdrop → close.
- Delete → ConfirmDialog hiện snippet (truncate 80). Confirm → DELETE 204 → row disappears optimistic.
- Bulk select (defer endpoint phase sau): UI checkbox + toolbar count.
- `[+ New Post →]` → navigate `/admin/create`.

### Responsive

- `<980px`: card grid 2 → 1 col; filter bar wrap.
- `<760px`: list view collapse stats column; modal full-width.
- `<640px`: filter bar stack vertical; view toggle hidden (default list).

### Real-time

- N/A v1 (không có realtime push cho admin posts).

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
