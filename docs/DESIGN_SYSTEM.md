# Design System

> **Single source of truth** cho design tokens + component primitives.
> Reference trực quan: [`design-file/`](../design-file/) HTML/JSX prototype — **tham khảo** (đối chiếu khi cần), không authoritative. Token spec chính thức là chính file này.
> Mọi screen wireframe ở [UI_DESIGN.md](./UI_DESIGN.md) PHẢI dùng token/component từ đây.

## Theme: Cyberpunk / Terminal (Dark-only)

**Light mode:** removed. Sẽ document khi có yêu cầu.

**Concept:** Deep navy background, neon cyan accent, JetBrains Mono terminal text, CRT scanline overlay (toggle-able), glitch animation on logo. Inspired by Tokyo Night, dev IDE aesthetic, retro CRT terminal.

## Design Tokens

### Color (CSS variables)

#### Background layers (depth)

| Token    | Value     | Use                                           |
| -------- | --------- | --------------------------------------------- |
| `--bg`   | `#0A0E1A` | Page background (deepest)                     |
| `--surf` | `#11151F` | Card, panel surface                           |
| `--elev` | `#1A1F2E` | Elevated (hover state, dropdown, dialog body) |
| `--over` | `#232936` | Overlay top layer (button bg subtle)          |

#### Borders

| Token  | Value     | Use                                              |
| ------ | --------- | ------------------------------------------------ |
| `--b1` | `#1F2A3A` | Subtle divider (status bar, inner row separator) |
| `--b2` | `#2A3548` | Default border (cards, inputs)                   |
| `--b3` | `#3D4A63` | Hover border                                     |

#### Text

| Token  | Value     | Use                                            |
| ------ | --------- | ---------------------------------------------- |
| `--tp` | `#E6EDF3` | Primary text (headings, body important)        |
| `--ts` | `#A0AEC0` | Secondary text (sub-info)                      |
| `--tm` | `#8B96AA` | Muted text (captions, placeholder, timestamps) |
| `--td` | `#566176` | Disabled / very subtle                         |

#### Accent (8 colors)

| Token    | Value     | Tag           | Use                                              |
| -------- | --------- | ------------- | ------------------------------------------------ |
| `--cyan` | `#00FFE5` | Primary brand | CTA, link, brand accent, focus glow, online dot  |
| `--mag`  | `#FF6E96` | Magenta       | Like (heart), tag rotation                       |
| `--pur`  | `#BB9AF7` | Purple        | Tag rotation, secondary accent                   |
| `--grn`  | `#9ECE6A` | Green         | Success, code text, GRATEFUL mood, online status |
| `--yel`  | `#E0AF68` | Yellow        | Warning, saved (bookmark), tag rotation          |
| `--ora`  | `#FF9E64` | Orange        | Admin badge, EXCITED mood, tag rotation          |
| `--red`  | `#F7768E` | Red           | Error, ANGRY mood, destructive action            |
| `--blu`  | `#7DCFFF` | Blue          | Username link, CALM mood, info                   |

### Typography

| Token          | Family         | Size    | Weight  | Line height | Use                                          |
| -------------- | -------------- | ------- | ------- | ----------- | -------------------------------------------- |
| `text-brand`   | Space Grotesk  | 16px    | 700     | 1           | Logo "kha.blog" (letter-spacing -0.04em)     |
| `text-display` | Space Grotesk  | 28px    | 700     | 1           | Stat card value                              |
| `text-h1`      | Space Grotesk  | 22px    | 600     | 1.3         | Page title hero                              |
| `text-h2`      | Space Grotesk  | 18px    | 600     | 1.4         | Section heading                              |
| `text-h3`      | Inter          | 14px    | 600     | 1.4         | Card title                                   |
| `text-body`    | Inter          | 14-16px | 400     | 1.65        | Body text (post content 15px, regular 14px)  |
| `text-small`   | Inter          | 12-13px | 400     | 1.5         | Caption, meta                                |
| `text-xs`      | Inter          | 10-11px | 400     | 1.4         | Microcopy                                    |
| `text-mono-lg` | JetBrains Mono | 14px    | 400/500 | 1.6         | Terminal text input, code block (large)      |
| `text-mono`    | JetBrains Mono | 12px    | 400/500 | 1.5         | UI labels, timestamps, button text           |
| `text-mono-sm` | JetBrains Mono | 10-11px | 400/500 | 1.4         | Section labels `// section.name`, status bar |
| `text-mono-xs` | JetBrains Mono | 9px     | 400     | 1.3         | Badges, IDs (hex), corner deco               |

**Italic** style: `text-mono` italic 400 cho placeholder + `// quote` style.

**v2 design refinement (M11.7):** Design v2 chọn upper bound của token ranges (UI label 11px thay 10px; mono text 13px thay 12px; body content 15px thay 14px) để dễ đọc. Editor Create Post chuyển từ JetBrains Mono → **Inter** cho phần content prose (UI chrome vẫn mono).

### Spacing (4px base)

| Token      | Value | Use                   |
| ---------- | ----- | --------------------- |
| `space-1`  | 4px   | Tight inline gap      |
| `space-2`  | 8px   | Default inline gap    |
| `space-3`  | 12px  | Element padding       |
| `space-4`  | 16px  | Card padding default  |
| `space-5`  | 20px  | Section gap           |
| `space-6`  | 24px  | Block separation      |
| `space-8`  | 32px  | Section padding large |
| `space-12` | 48px  | Page section gap      |
| `space-16` | 64px  | Hero spacing          |

### Radius

| Token         | Value  | Use                                 |
| ------------- | ------ | ----------------------------------- |
| `radius-xs`   | 2px    | Inline badge ([ ADMIN ], hex IDs)   |
| `radius-sm`   | 4px    | Tag pill, small badge, button ghost |
| `radius-md`   | 6px    | Input, button default               |
| `radius-lg`   | 8px    | Card, panel                         |
| `radius-xl`   | 12px   | Modal, terminal card                |
| `radius-full` | 9999px | Avatar, mood badge (pill)           |

### Shadow

| Token                 | Value                                                     | Use                   |
| --------------------- | --------------------------------------------------------- | --------------------- |
| `shadow-sm`           | `0 1px 2px rgba(0,0,0,.05)`                               | Card resting subtle   |
| `shadow-md`           | `0 4px 12px rgba(0,0,0,.08)`                              | Card hover, dropdown  |
| `shadow-lg`           | `0 12px 32px rgba(0,0,0,.4)`                              | Modal, popover        |
| `shadow-glow-cyan-sm` | `0 0 8px rgba(0,255,229,.15)`                             | Focus glow subtle     |
| `shadow-glow-cyan-md` | `0 0 14px rgba(0,255,229,.22)`                            | Input focus           |
| `shadow-glow-cyan-lg` | `0 0 24px rgba(0,255,229,.1), 0 4px 24px rgba(0,0,0,.3)`  | Card hover            |
| `shadow-glow-cyan-xl` | `0 0 40px rgba(0,255,229,.22), 0 8px 32px rgba(0,0,0,.4)` | Glow-hi modal/special |
| `shadow-mood`         | `0 0 8-14px <mood-color>30/50`                            | Mood badge glow       |

### Breakpoint

| Token     | Value        | Range                              |
| --------- | ------------ | ---------------------------------- |
| `mobile`  | `< 640px`    | base                               |
| `tablet`  | `640-1024px` | `sm:` / `md:`                      |
| `desktop` | `> 1024px`   | `lg:`                              |
| `wide`    | `> 1100px`   | `xl:` (page-specific wide layouts) |

> **v2 sub-breakpoints (design v2 M11.7):** prototype design dùng 5-tier compress chi tiết hơn — `980` (desktop tight) / `760` (tablet) / `640` (mobile-lg) / `480` (mobile-md) / `420` (mobile-sm). Map vào token gốc: ≤640 = `mobile`, 640-1024 = `tablet`, >1024 = `desktop`. CSS dùng raw `@media (max-width: 980px)` etc. cho các screen v2 (theo `myblog-shared-ui.jsx`).

### Motion

| Token            | Duration  | Easing               | Use                                   |
| ---------------- | --------- | -------------------- | ------------------------------------- |
| `motion-instant` | 100ms     | linear               | Backdrop fade                         |
| `motion-fast`    | 150ms     | ease                 | Hover, focus, state change            |
| `motion-base`    | 200-250ms | ease-in-out          | Modal open, dropdown                  |
| `motion-slow`    | 300-400ms | ease                 | Page transition, fadeUp content       |
| `motion-glitch`  | 9s        | infinite             | Logo glitch (every 9s, 88-92% timing) |
| `motion-pulse`   | 2s        | ease-in-out infinite | Online dot, status                    |
| `motion-blink`   | 530ms     | step-start infinite  | Cursor blink                          |
| `motion-shake`   | 400ms     | ease                 | Error shake (±5px X)                  |

### Background pattern

**Radial dot grid:**

```css
background: #0a0e1a radial-gradient(circle, #2a354822 1px, transparent 1px);
background-size: 24px 24px;
```

### CRT scanline overlay (toggle-able)

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0,
    transparent 2px,
    rgba(0, 0, 0, 0.028) 2px,
    rgba(0, 0, 0, 0.028) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
body.no-crt::after {
  opacity: 0;
}
```

Toggle via Tweaks panel (dev tool, không document).

---

## Components (Primitives)

> Base: `shadcn/ui` cho primitives chuẩn (Button, Input, Card, Dialog, ...). Custom + variants ghi rõ ở đây.
> Mỗi component cần spec: variants, sizes, states, props, a11y, usage, tokens dùng.

### TopBar

- **Mục đích:** Global header, fixed top 52px, z-100.
- **Layout:** `flex` 3 zones — Logo (left) + Search⌘K (center 440px) + Right cluster (version + online + avatar)
- **Surface:** `rgba(17,21,31,.96)` + `backdrop-filter: blur(8px)` + border-bottom `--b1`
- **Tokens:** `--surf` (bg), `--b1` (border)
- **A11y:** logo `<a>` with `aria-label="kha.blog home"`, search input with `aria-label="Search posts, tags, users"`, avatar button with `aria-haspopup="menu"`
- **Responsive:** `<768px` ẩn search center + version badge

### StatusBar

- **Mục đích:** Terminal-style footer fixed bottom 28px.
- **Surface:** `#070A14` (darker than `--bg`) + border-top `--b1`
- **Sections separated by `border-right: 1px --b1`**
- **Props:** `path` (string, default `~/`), `info` (string, optional middle info)
- **Tokens:** `--cyan` (path highlight), `--grn` (online dot), `--tm` (default text)

### CommandPalette

- **Mục đích:** ⌘K overlay quick nav/action (FR-08)
- **Trigger:** ⌘K / Ctrl+K global keydown listener
- **Variants:** default (560px), narrow (mobile fullscreen)
- **Surface:** `--elev` (#1A1F2E) + border cyan 35% + `shadow-glow-cyan-lg`
- **Behavior:** focus trap input on mount, Esc close, click backdrop close, ↑↓ navigate, ↵ select
- **Items grouped by `g` field** (navigate / actions / recent)
- **A11y:** `role="dialog" aria-modal="true"`, items `role="option"`
- **Tokens:** `--cyan` (selected highlight), JetBrains Mono text

> **DROPPED — Sidebar + RightPanel:** Design refactor 2026-05-18. Global Sidebar (admin nav) và RightPanel (mood.distribution + activity.heatmap + live.visitors) đã bị bỏ. Aside content giờ là **page-specific**: mood.distribution + activity.log nằm trong Admin Dashboard page, post.meta/tags/share/related nằm trong Post Detail page, live.preview nằm trong Create Post page. Component primitives MoodBar / Activity Heatmap / Anonymous Visitor Card vẫn giữ cho consumer page reuse.

### PostCard

- **Mục đích:** Post item in feed
- **Surface:** `--surf` + border `--b2` + radius `radius-lg` + padding `space-4 space-5`
- **Hover:** border cyan 45% + `shadow-glow-cyan-lg`; pseudo `::before` 1px top gradient line cyan
- **Structure:**
  - Corner deco `#abc123` (text-mono-xs, `--b2` color, top right)
  - Header: avatar 36px + username `~/admin` + `[ ADMIN ]` badge + timestamp `[YYYY-MM-DD HH:MM]` + relative time `2h ago` + pulse dot + MoodBadge (right)
  - Content: PostContent renderer (markdown + code block)
  - ImageGrid (if images > 0)
  - FileAttachments (if files > 0)
  - Tags row (TagPill list)
  - Divider line `─────────────────────` (text-mono `--b1`)
  - Actions: like ❤ / comment 💬 / save 🏷 / share ↗ + `⋯` more menu right-aligned
- **Variants:** default, `glow-hi` (with stronger glow on hover)
- **Animation:** `fadeUp 0.3s ease both` on mount with stagger delay (60ms per item)

### PostHeader (Post Detail variant)

- Larger avatar 40px, larger username + admin tag, timestamp + mood badge stacked

### PostContent (markdown renderer)

- **Mục đích:** Render markdown (paragraph + code block)
- **Code block:** `<pre class="code-bl">` — `font: JetBrains Mono 12-13px`, bg `#070A14`, border `--b2`, border-left 2px `--grn40`, padding `space-3 space-4`, color `--grn`, radius `radius-md`
- **Paragraph:** `text-body` (14-15px), `--tp`/`--ts` mix, `margin-bottom: space-2`
- **Inline code:** `text-mono` background `--elev` color `--grn`
- **Headings:** map markdown `#` → `text-h1/h2/h3`

### ImageGrid (Feed)

- **Mục đích:** Hiển thị 1-N ảnh trong PostCard
- **Layout:**
  - 1 ảnh: full width 200px height
  - 2 ảnh: 2-col grid 160px height
  - 3+ ảnh: 2-col asymmetric (1 large left + N-1 stacked right), 180px height; 4+ ảnh: hiển thị 4 đầu, "+N" overlay trên ảnh thứ 4
- **Placeholder:** diagonal stripe pattern (`repeating-linear-gradient 135deg`) với mood color accent
- **Tokens:** radius `radius-sm` (inner), radius `radius-md` (outer container)

### ImageCarousel (Post Detail)

- **Mục đích:** Single image + prev/next + dot indicator
- **Height:** 280px
- **Controls:**
  - Prev/next buttons: `position: absolute, left/right 12px`, bg `rgba(10,14,26,.75)` + border `--b2` + radius `radius-md` + `backdrop-filter: blur(4px)`
  - Dot indicator: bottom centered, active dot 16x6 rounded `--cyan` glow, inactive 6x6 `--b2`
- **A11y:** `<button aria-label="Previous image">` / `"Next image"`
- **Keyboard:** ← → arrows (when focused)

### FileAttachments

- **Mục đích:** List file attachment dưới ImageGrid
- **Header:** `// attachments [N]` text-mono-sm `--tm`
- **Each row:**
  - Type badge (PDF/DOC/DOCX/XLS/XLSX/TXT/CSV): text-mono-xs với type color (xem File Type Color Map dưới)
  - Filename (text-mono 12px, `--tp`)
  - Size (text-mono `--tm`)
  - Download button ↓ (with type color)
- **Surface:** `--elev` + border type-color 28% + border-left 2px type-color 80%

### MoodBadge

- **Mục đích:** Hiển thị mood của post (1 trong 7)
- **Style:** `inline-flex` + emoji + label
- **Bg:** `<mood-color>18` (18% opacity)
- **Border:** 1px `<mood-color>55`
- **Color:** `<mood-color>`
- **Radius:** `radius-sm` (Feed) hoặc `radius-full` pill
- **Shadow:** `shadow-mood` (glow `<mood-color>30`)
- **Tokens:** xem Mood Color Map dưới

### TagPill

- **Mục đích:** Hiển thị hashtag với per-tag color
- **Style:** text-mono 11px, padding `2px space-2`, radius `radius-sm`
- **Bg:** `<tag-color>15` (15% opacity)
- **Border:** 1px `<tag-color>40`
- **Color:** `<tag-color>`
- **Hover:** bg `<tag-color>28`, border `<tag-color>70`, color `--tp`, shadow `0 0 8px <tag-color>50`
- **Tag color rotation:** cycle qua 7 accent colors khi tạo tag mới (xem rotation palette)

### TagBadge (Create Post variant)

- Same as TagPill nhưng có `×` remove button bên phải

### Avatar

- **Sizes:** `xs` (24) | `sm` (28) | `md` (32) | `lg` (36) | `xl` (40, 56, 80)
- **Style:**
  - Border: 2px `--cyan` (default) hoặc 1.5px subtle
  - Bg: `linear-gradient(135deg, #00FFE520, #BB9AF720)` — cyan→purple gradient 20% opacity
  - Text: Space Grotesk 700, color `--cyan`, first letter of username
- **Status dot (optional):** bottom-right 8px circle `--grn` (online) / `--yel` (idle) / `--td` (offline) + border 1.5px `--surf`
- **Glow (active):** `0 0 12-18px rgba(0,255,229,.25-.4)`
- **Variants:** `default` (admin gradient), `anon` (no gradient, gray, `?` text)

### Sparkline

- **Mục đích:** Inline SVG line chart cho stats (StatCard)
- **Width:** 80px, height 22-24px
- **Style:**
  - Polyline với linearGradient stroke (0% color 20% opacity → 100% color 100%)
  - Endpoint dot 2.5px với `filter: drop-shadow(0 0 3px <color>)`
- **Data:** array of 12 numbers (12 buckets)
- **Color:** mặc định `--cyan`, override per stat (likes=mag, comments=pur, views=grn)

### AsciiBar

- **Mục đích:** ASCII progress bar `██████░░░░`
- **Style:** text-mono-sm, char `█` filled + `░` empty
- **Width:** số chars (default 10)
- **Color:** override per use

### StatCard (Admin)

- **Surface:** `--surf` + border `--b2` + radius `radius-lg` + padding `space-4`
- **Left bar:** 3px solid color (per stat)
- **Layout:**
  - Top row: label `POSTS` (text-mono-xs `--tm` letter-spacing 0.08em) + delta `+5 today` (text-mono text-color)
  - Bottom row: value `42` (text-display 28px text-color font-weight 700) + Sparkline (right)
- **Hover:** border cyan 30% + `shadow-glow-cyan-sm`
- **Cursor:** pointer (click → detail page TBD)

### MoodBar (Admin)

- **Layout:** label row (emoji + name + count·%) + progress bar 4px height
- **Bar:** bg `--elev` (#1A1F2E), fill `linear-gradient(90deg, <color>80, <color>)` + `shadow 0 0 6px <color>60`
- **Animation:** `transition: width 0.4s ease`

### UploadZone (Create Post)

- **Style:** border 2px dashed `--b2`, radius `radius-lg`, padding `space-7 space-5`, text center, cursor pointer
- **Animation:** `dashedPulse` 2s ease-in-out infinite (border color `--b2` ↔ `--b3`)
- **Hover:** border `--cyan80`, bg `rgba(0,255,229,.03)`
- **Content:**
  - Title: `❯ drag & drop or click to upload` (text-mono `--ts`)
  - Hint: `PNG, JPG, WebP · max 5MB each` (text-mono-xs `--td`)

### ImageThumb (Create Post preview)

- **Size:** 60x60px, radius `radius-md`
- **Bg:** diagonal stripe pattern (theme color per index)
- **Remove button:** top-right 16x16 circle, `rgba(10,14,26,.8)`, color `--red`

### CommentItem

- **Layout:** avatar 28px + meta row (username/anon tag/time) + content (margin-left 36px) + actions (like, reply)
- **Anonymous variant:** avatar bg `--elev` (no gradient), text `?`, color `--tm`, `[ anon ]` badge inline
- **Like state:** `--red` when liked
- **Border-bottom:** `--b1` divider

### CommentForm

- **Surface:** `--surf` + border `--b2` + radius `radius-lg` + padding `space-3 space-4`
- **Textarea:** background `--bg`, focus border `--cyan` + shadow-glow-cyan-md
- **Footer:** `as: ~/admin` indicator (`--blu`) OR `<input>` for anonymousName + toggle `[as anon] / [use account]` button + Send button (cyan)

### Button

- **Variants:**
  - `primary terminal` — bg `rgba(0,255,229,.08)`, border 1px cyan 40%, color cyan, shadow-glow-cyan-sm. Hover: bg cyan 14%, shadow-glow-cyan-md. Disabled: muted bg + border.
  - `primary solid` (publish) — bg `--cyan`, color `--bg`, shadow-glow-cyan-md. Hover: cyan 80% + stronger glow.
  - `ghost` — bg transparent, color `--tm`. Hover: color `--tp`, bg `--elev`.
  - `destructive` — color `--red`, border `--red`50%. Hover: bg `--red`10%.
  - `act-btn` (action row) — text-mono-xs, color `--tm`, hover color `--tp` + bg `--elev`. State: liked (red), saved (yel).
  - `flt-btn` (filter pill) — text-mono-xs, padding `5px space-3`, border `--b2`, color `--ts`, bg `--elev`, radius `radius-sm`. Active: cyan border + bg cyan 10% + shadow-glow-cyan-sm.
  - `act-ghost` (admin table) — text-mono-xs, padding `3px space-2`, border 1px color (per action: red ban, green approve, blue view), color matching.
  - `toolbar-btn` (editor toolbar) — bg transparent, border `--b2`, color `--tm`. Hover: bg `--elev`, color `--tp`.
- **Sizes:** `sm` (32px), `md` (40px), `lg` (48px), `icon` (40x40)
- **States:** default, hover, focus (ring 2px cyan offset 2px), active, disabled (opacity 50%), loading (with ASCII spinner)

### Input

- **Variants:**
  - `default` — bg `--bg`/`--surf`, border `--b2`, color `--tp`, radius `radius-md`, padding `space-2 space-3`
  - `terminal` — JetBrains Mono, prefix `❯` icon left, focus border cyan + shadow-glow-cyan-md
  - `search` — wide, with `⌕` icon left and ⌘K hint right
- **States:** default, focus (border cyan + glow), error (border `--red`), disabled

### Dialog / Modal

- **Backdrop:** `rgba(0,0,0,.72)` + `backdrop-filter: blur(6px)`, z 200
- **Surface:** `--elev` + border `--b2` (or cyan 35% accent) + `shadow-glow-cyan-lg`
- **Radius:** `radius-xl` (12px)
- **Animation:** `fadeUp 0.15s ease`
- **Close:** Esc + click backdrop + `×` button

### Dropdown (menu)

- **Surface:** `--elev` + border `--b2` (or cyan 25%) + `shadow-glow-cyan-md` + radius `radius-lg`
- **Item:** padding `space-2 space-3`, hover bg `rgba(0,255,229,.08)`
- **Separator:** 1px `--b2`, vertical margin `space-1`

### Breadcrumb

- **Style:** text-mono-sm `--tm`
- **Back link:** `← feed` cyan + text-decoration none
- **Separator:** `/` `--td`
- **Current:** `~/post/abc123` `--tm`

### Table (Admin)

- **Header row:** bg `--bg` (darker), border-bottom `--b2`, text-mono-xs `--tm` letter-spacing 0.05em
- **Body row:** border-bottom `--b1`, hover bg `--elev`, padding `space-2 space-3`
- **Cell:** text-mono 12px `--tp` truncate
- **Layout:** CSS grid with explicit `gridTemplateColumns` per column

### RoleBadge

- **Style:** text-mono-xs, padding `1px space-1`, border 1px, radius `radius-xs`
- **Variants:** `[ ADMIN ]` (`--ora` border 50% + text), `[ USER ]` (`--tm` border + text), `[ ANON ]` (`--pur` border + text)

### StatusBadge

**Comment moderation (CommentStatus — FR-03.4):**

- `pending` — `--yel` bg 10% + border 30% + text
- `approved` — `--grn` bg 10% + border 30% + text
- `rejected` — `--red` bg 10% + border 30% + text

**Post status (PostStatus — FR-15, M11.7):**

- `PUBLISHED` — `#9ECE6A` (grn) bg 12% + border 40% + text
- `DRAFT` — `#E0AF68` (yel) bg 12% + border 40% + text
- `ARCHIVED` — `#566176` (tm/muted) bg 12% + border 40% + text + opacity 80% (subtle "less active")

### ShareButton (Post Detail share panel)

- **Style:** `flex` with icon emoji + label, padding `space-2 space-3`, border `--b2`, bg `--elev`, color brand color (FB blue, X off-white, Telegram blue, Copy cyan)
- **Hover:** color `--tp`, border `--b3`

### AsciiSpinner

- **Frames:** `['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']`
- **Cycle:** 80ms per frame
- **Use:** loading state inline (`⠋ loading...`)

### Sub-toolbar (Create Post, Admin)

- **Position:** fixed `top: 52px` (below TopBar), height 40-44px, z-90
- **Surface:** `--surf` + border-bottom `--b1`
- **Content:** path `~/admin/create-post` + status indicator + action buttons right
- **Typography:** JetBrains Mono 11px

### Terminal Card (Login)

- **Surface:** `--surf` + border `--b2` + radius `radius-xl` (12px) + `shadow-lg`
- **Scan line:** 2px gradient strip cyan, animation `scanCard` 4s linear infinite top → bottom
- **Header:** bg `--bg`, border-bottom `--b1`, padding `space-4`, contains logo + version + path with blinking cursor
- **Form padding:** `space-5 space-5 space-6`

### EmojiPicker (Create Post — M11.5 FR-02.7)

- **Trigger:** 😀 button trên MarkdownEditor toolbar
- **Popover:** width 320px, absolute positioned below button, z-50, border `--b2`, bg `--surf`, radius `radius-lg`, shadow lg
- **Header:** 4 tab buttons (faces / hands / dev / nature) — active border-bottom `--cyan` 2px + text `--cyan`
- **Body:** grid 8-col emoji buttons 32×32px, hover bg `cyan/10` + border cyan
- **Data:** mỗi tab 16 emoji exact list từ design-file/MyBlog Create Post.html L186-189
- **Behavior:** click emoji → call `insertAtCursor(textareaRef, emoji)` (reuse `lib/insert-at-cursor.ts`). Close on outside-click hoặc Esc.

### EditProfileDrawer (Profile — M11.5 FR-11.3)

- **Trigger:** self click `[ ✎ Edit Profile ]` button trên ProfilePage hero
- **Surface:** slide-in từ phải 420px width, full height, bg `--surf`, border-left `--b2`. Backdrop `rgba(0,0,0,.6)` blur 4px overlay
- **Animation:** slide-in 280ms ease-out + backdrop fade 200ms
- **Sections (2 stacked):**
  1. `// profile` — title input (max 80) + bio textarea (max 500 markdown) + SkillChipInput (max 20)
  2. `// security` — current password + new password + confirm password
- **Submit:** mỗi section có button riêng → mutation riêng (PATCH /users/:id vs POST /auth/change-password)
- **Close:** Esc, backdrop click, hoặc `[ × ]` close button top-right

### SkillChipInput (Edit Profile drawer — M11.5)

- **Style:** flex-wrap container border `--b2` radius `radius-md`, padding `space-2`
- **Chip:** name + 8px color circle swatch + × remove button. Color cycle qua TAG_COLORS palette (7 colors, index modulo)
- **Input:** bottom of container, placeholder `❯ add skill...`. Enter/comma → add chip
- **Constraints:** max 20 chips, name max 32 chars, color hex regex `/^#[0-9A-Fa-f]{6}$/`
- **Counter:** footer `// max 20 · N used`

### TagCard (Tags page — M11.5 FR-10.3)

- **Surface:** `--surf` + border `--b2` + radius `radius-md` + padding `space-4` + hover border `--cyan` + glow shadow
- **Layout (grid view):** name `#code` + color swatch (8px circle) inline + post count badge top-right
- **Body:** description text-sm `--tm` (truncate 1 line, ellipsis), optional
- **Footer:** Sparkline 7d mini (60×16) + progress bar 4px height (% so với max tag postCount across all)
- **Admin overlay (hover):** top-right `✎ Edit` + `🗑 Delete` icon buttons, opacity 0 → 1 transition
- **Click:** navigate `/?tag=name` Feed
- **List variant:** flex-row layout (name + count + sparkline trên 1 hàng)

### TagModal (Tags page create/edit — M11.5 FR-10.4)

- **Surface:** centered modal width 480px, bg `--elev`, border `--b2`, radius `radius-lg`, shadow xl
- **Header:** `// create.tag` hoặc `// edit.tag` (variant prop)
- **Fields:**
  - Name (required, lowercase, auto-prefix `#`, unique check qua API 409)
  - Color picker — swatch grid (7 từ TAG_COLORS palette + custom hex input)
  - Description textarea max 280 chars + counter
  - Preview chip — live render `<TagPill>` với current values
- **Actions:** `[ Cancel ]` (close) + `[ Create ]` hoặc `[ Save ]` (submit)
- **Error states:** inline banner cho 409 DUPLICATE_TAG, 400 validation
- **Behavior:** Esc close, backdrop click close (confirm nếu dirty)

### BigSearchInput (Search page hero — M11.5 FR-12.4)

- **Style:** full-width centered, max-w 720px, height 56px, padding `space-3 space-12 space-3 space-12`, border `--b2`, radius `radius-lg`, bg `--bg`, font 22px JetBrains Mono
- **Prefix:** `❯` icon left 16px, `--cyan`
- **Suffix:** `×` clear button right (hiển thị khi value non-empty)
- **Focus:** border `--cyan` + glow shadow lg `--cyan-40`
- **Placeholder:** `search posts, #tags, files...` italic `--tm`

### FilterChip (Search filters — M11.5 FR-12.4)

- **Style:** inline-flex, padding `space-1 space-3`, border `--b2`, radius `radius-sm`, bg `--surf`, font-mono 11px `--tm`
- **States:**
  - default: `--b2` + `--tm`
  - hover: `--b3` + `--ts`
  - active: `--cyan` border 50% + bg cyan 8% + text `--cyan` + glow sm
- **Use:** Search page (All/Saved/Files + 5 mood emoji chips)
- **Toggle behavior:** single-select trong group hoặc multi-select tuỳ context

### ResultCard (Search result — M11.5 FR-12.4)

- **Style:** compact PostCard variant — surface `--surf` border `--b2` radius `radius-md` padding `space-3`
- **Layout:** author row + content body (3-line clamp) + tags row + actions footer
- **Highlight match:** content text split theo regex `new RegExp(q, 'gi')` → wrap matched substring trong `<mark>` styled `bg-cyan/30 text-cyan` (KHÔNG `dangerouslySetInnerHTML`)
- **Click:** navigate `/post/:id`

### HeatmapGrid (Profile sidebar — M11.5 FR-11.4)

- **Layout:** 4 rows × 7 cols (28 cells total), gap 3px, cell 12×12px radius 2px
- **Color scale:** 4 intensity levels theo count quartile:
  - 0 → `--b1` (`#1A1F2E`)
  - 1 → `--b2` (`#2A3548`)
  - 2 → cyan 35% (`#00FFE535`)
  - 3+ → cyan 90% (`#00FFE590`)
- **Hover:** tooltip `{date} · {count} posts`
- **Day labels:** optional left column `M/T/W/T/F/S/S` text-mono-xs `--td`

### ProfileAvatar (Profile hero — M11.5 FR-11.1)

- **Variant của Avatar:** size prop (default 88px)
- **Rotating ring:** SVG circle stroke `--cyan` 2px, dasharray gap, animation `spin 4s linear infinite`
- **Inner avatar:** gradient bg (cyan→purple 20% opacity) + initial char letter `--cyan` font-brand bold
- **Status dot:** absolute bottom-right green pulse (reuse online indicator)

### StatSparkline (Profile stats inline — M11.5 FR-11.4)

- **Variant của Sparkline (T-077):** size 60×20 compact, color prop (theo metric: cyan/mag/pur/grn)
- **Use:** inline với stat label trong hero stats row hoặc sidebar mini stats

### TabButtons (Profile tabs — M11.5 FR-11.1)

- **Style:** flex-row border-bottom `--b2`, mỗi button padding `space-2 space-4`, font-mono 12px `--tm`, border-bottom 2px transparent
- **Active:** color `--cyan` + border-bottom `--cyan`
- **Hover (not active):** color `--ts`
- **Use:** Profile 4 tabs (Posts/Saved/Activity/About). URL state qua `?tab=`

### SegmentedToggle (Tags view toggle — M11.5)

- **Style:** flex-row, 2 button group, border `--b2` radius `radius-sm`, padding 2px
- **Item:** padding `space-1 space-2`, font-mono 11px, transparent bg
- **Active:** bg `--elev` + text `--cyan`
- **Use:** Tags page grid/list toggle, future filter UIs

### ConfirmDialog (Delete confirm — M11.5)

- **Surface:** centered modal width 400px, bg `--elev`, border `--red` 30%, radius `radius-md`, shadow xl
- **Header:** icon ⚠️ + title `// confirm.delete`
- **Body:** warning text describing impact (vd `"5 posts use this tag. Are you sure?"`)
- **Actions:** `[ Cancel ]` (close) + `[ Delete ]` (red, submit). Khi destructive action có dependency → double-confirm pattern (`[ Force Delete ]` second click)

### ProfileActivityItem (Profile Activity tab — M11.6 FR-13)

- **Layout:** flex-row, padding `space-2 space-3`, border-bottom `--b1` between items
- **Icon (left, w 32px):** Map per `ActivityType` — 📝 POST_CREATED · 💬 COMMENT_CREATED · 👍 LIKE_CREATED · 🔖 SAVE_CREATED
- **Middle (flex-1):** direction-aware text template:
  - `direction === 'OUTGOING'` (actor là chính user): `You {verb} <target snippet>` (verb map: created post / commented on / liked / saved)
  - `direction === 'INCOMING'` (others tương tác với content của user): `<actor.username> {verb} your post · <target snippet>`
- **Snippet:** truncate 80 char, link tới `/post/:targetId`. Nếu snippet null (target deleted) → render `[deleted post]` text-tm, không link, cursor not-allowed.
- **Right:** relative time mono-xs text-tm (`2m ago`, `5h ago`, `3d ago`).
- **Hover:** bg `--elev` highlight nhẹ.
- **Loading skeleton:** 3 row placeholder grayscale flex-row khi initial fetch.
- **Empty state:** centered `// no activity yet · interact with posts to build history` text-tm.
- **Reuse:** share base với existing `ActivityLogItem` (admin) — prop `variant: 'admin' | 'profile'` switch text template + visibility logic.

### NotificationBell (FR-14, M11.7)

- **Position:** TopBar right cluster, trước Avatar dropdown.
- **Icon:** bell 🔔 18px, color `--tm` default → `--cyan` on hover/active.
- **Badge:** vòng tròn `--mag` (`#FF6E96`) 14px top-right anchor, text trắng 9px JetBrains Mono. Hiện khi `unreadCount > 0`, pulsing 2s ease-in-out infinite. `99+` nếu > 99.
- **Dropdown panel:** absolute below bell, width 360px, max-height 480px scroll, `bg --surf`, border `--b2`, radius `radius-lg`, shadow xl.
  - Header: `// notifications · N unread` + button `✓ mark all read` (visible khi unread > 0).
  - Tab bar: `All (N)` / `Unread (N)` segmented.
  - List 10 items gần nhất, group time (today/yesterday/older). Mỗi row: avatar sm + verb + snippet 40 chars + relative time + dot `●` blue nếu unread.
  - Footer link `// view all → /notifications` border-top `--b1`.
- **Interactions:** click bell → toggle open; click outside / Esc → close; click row → navigate target + mark read; sync với `useUnreadCount()` polling 30s.
- **Accessibility:** `aria-label="Notifications, N unread"`, role `button` aria-expanded; arrow keys nav list rows; Enter activate.
- **Reference:** `design-file/myblog-shared-ui.jsx:101-257`.

### ReactionPicker (FR-16, M11.7)

- **Trigger:** hover/long-press reaction button (👍) trên PostCard hoặc PostDetail.
- **Popover:** flex row 6 emoji buttons 36×36px, absolute above trigger, padding `space-2`, bg `--surf`, border `--b2`, radius `radius-full` (pill), shadow lg.
- **Emoji map (ReactionType enum):**
  - `LIKE` 👍 — `--cyan`
  - `LOVE` ❤️ — `--red`
  - `HAHA` 😆 — `--yel`
  - `WOW` 😮 — `--ora`
  - `SAD` 😢 — `--blu`
  - `ANGRY` 😡 — `--red` (deep)
- **Hover state:** emoji scale 1.3x + tooltip label below (`LIKE` etc.) 300ms ease.
- **Selected indicator:** active reaction → button bg `<accent>/15` + border accent + emoji scale 1.1x.
- **Display dưới button** (PostCard / Detail):
  - Top 3 emoji icons stack + total count (vd `👍❤️😆 12`).
  - Click số → mở ReactionList modal (xem dưới).
- **Mobile:** popover transform full-width sticky bottom với 6 buttons large 48×48px.
- **Cross-ref:** [DATA_MODEL.md > Enum ReactionType](./DATA_MODEL.md).

### ReactionList modal (FR-16.5, M11.7)

- **Trigger:** click số count dưới reaction button.
- **Modal:** width 480px, header `// reactions · N` + close ✕. Tab bar: `All (N)` / `👍 LIKE (N)` / `❤️ LOVE (N)` / … (6 type tabs).
- **List:** scrollable, mỗi row: avatar + username + reaction type emoji + relative time. Pagination NFR-06 (`page=1&limit=20`).
- **Empty per tab:** `// no reactions of this type yet`.

---

## Patterns

### Code block style

- Bg `#070A14` (darker than `--bg`)
- Border `--b2` + border-left 2px `rgba(158,206,106,.4)` (subtle green)
- Padding `space-3 space-4`
- Color `--grn`
- Radius `radius-md`
- Font JetBrains Mono 12-13px
- `white-space: pre`, `overflow-x: auto`

### Loading state

- Skeleton: bg `--b1`, animate shimmer 1.5s OR pulse animation
- Inline: `⠋ <message>` AsciiSpinner + text-mono `--tm`
- Bottom of feed: `⠋ loading posts...`

### Empty state

- Big icon (40-48px) opacity 0.3 (vd: `◐`)
- Title text-mono `--tm`: `// no <items> matching <filter>`
- Optional hint text-mono-xs `--td`: terminal command hint `$ cd ../<x> && ls -la`

### Error state

- Inline error: bg `<color>08`, border `<color>30`, color `<color>`, text-small, padding `space-2 space-3`, radius `radius-md`
- Severity colors: error (`--red`), warning (`--yel`), info (`--blu`)

### Mood Color Map

> Cross-ref: [DATA_MODEL.md > Enum Mood](./DATA_MODEL.md). Thêm mood enum mới PHẢI update color trong cả 2 doc.

| Mood       | Color                                               | Emoji | Use in DESIGN_SYSTEM            |
| ---------- | --------------------------------------------------- | ----- | ------------------------------- |
| HAPPY      | `#FFD93D` (yellow-bright)                           | 😊    | MoodBadge, mood filter, MoodBar |
| EXCITED    | `#FF9E64` (orange)                                  | ⚡    | (same)                          |
| THOUGHTFUL | `#BB9AF7` (purple)                                  | 💭    | (same)                          |
| CALM       | `#7DCFFF` (blue)                                    | 😌    | (same)                          |
| SAD        | `#6BCFFF` (cyan-blue, slightly different from CALM) | 😢    | (same)                          |
| GRATEFUL   | `#9ECE6A` (green)                                   | 🙏    | (same)                          |
| ANGRY      | `#F7768E` (red)                                     | 😠    | (same)                          |

### File Type Color Map

| Type       | Color              | Badge label |
| ---------- | ------------------ | ----------- |
| PDF        | `#F7768E` (red)    | `PDF`       |
| DOC        | `#7DCFFF` (blue)   | `DOC`       |
| DOCX       | `#7DCFFF` (blue)   | `DOCX`      |
| XLS        | `#9ECE6A` (green)  | `XLS`       |
| XLSX       | `#9ECE6A` (green)  | `XLSX`      |
| TXT        | `#A0AEC0` (gray)   | `TXT`       |
| CSV        | `#E0AF68` (yellow) | `CSV`       |
| (fallback) | `#8B96AA` (muted)  | `FILE`      |

### Tag Color Rotation Palette

Khi tạo Tag mới chưa có color, cycle qua palette theo index của Tag (modulo 7):

```js
const TAG_COLORS = [
  '#00FFE5', // cyan
  '#FF6E96', // magenta
  '#BB9AF7', // purple
  '#9ECE6A', // green
  '#E0AF68', // yellow
  '#FF9E64', // orange
  '#7DCFFF', // blue
];
```

### Anonymous Visitor Card (RightPanel)

- Bg `--elev`, border `--b2`, border-left 2px `--grn40`, radius `radius-md`, padding `space-2 space-3`
- ID `0x7F·4A2C` (text-mono-xs `--blu` weight 500)
- Geo badge `HN` / `SG` (text-mono-xs `--td`, bg `--over`, padding `1px 5px`, radius `radius-xs`)
- Page path text-mono-sm `--tm`
- Action with pulse green dot

### Activity Heatmap (28-day)

- 7-col × 4-row grid, gap 3px
- Each cell 13px height, radius `radius-xs`
- Color levels: 0 (`--b1`), 1 (`--b2`), 2 (`--cyan35` = #00FFE535), 3 (`--cyan90`)
- Tooltip per cell: `N post(s)`
- Day labels above (`M T W T F S S`)
- Legend below `less ◾◾◾◾ more`

### Pulse animation

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 3px currentColor);
  }
}
.pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

Use cho: online status dot, "live mode" indicator.

### Glitch animation (logo)

```css
@keyframes glitch {
  0%,
  87%,
  100% {
    text-shadow: none;
    transform: none;
  }
  88% {
    text-shadow:
      2px 0 #ff6e96,
      -2px 0 #00ffe5;
    transform: skewX(-2deg) translateX(-2px);
  }
  90% {
    text-shadow:
      -2px 0 #bb9af7,
      2px 0 #ff9e64;
    transform: skewX(1deg) translateX(1px);
  }
  92% {
    text-shadow: none;
    transform: none;
  }
}
.logo-txt {
  animation: glitch 9s infinite;
}
```

### Scan card animation (Login)

```css
@keyframes scanCard {
  0% {
    top: -100%;
  }
  100% {
    top: 200%;
  }
}
```

2px gradient strip moves top → bottom in 4s linear infinite.

### Shake animation (error)

```css
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-5px);
  }
  40%,
  80% {
    transform: translateX(5px);
  }
}
```

Duration 400ms, applied on submit error.

### FadeUp entrance

```css
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(8-10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

Duration 150-350ms ease. Used on card mount, dropdown open, palette open, page transition.

### Dashed Pulse (upload zone)

```css
@keyframes dashedPulse {
  0%,
  100% {
    border-color: #2a3548;
  }
  50% {
    border-color: #3d4a63;
  }
}
```

Duration 2s ease-in-out infinite.

### Section labels (`sb-lbl`)

```css
.sb-lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--tm);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sb-lbl::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--b1);
}
```

Use: `// mood.distribution`, `// activity.log`, `// content` — pattern hợp với theme.

### Cursor blink (Login terminal)

```css
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
```

Apply to `_` cursor after `~/auth/login`, cycle 530ms.

### Scrollbar (custom)

```css
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: var(--bg);
}
::-webkit-scrollbar-thumb {
  background: var(--b2);
  border-radius: 3px;
}
```

---

## Accessibility Baseline (WCAG AA)

- **Color contrast:**
  - `--tp` (#E6EDF3) on `--surf` (#11151F) = 13.5:1 (AA Large + AA Normal)
  - `--ts` (#A0AEC0) on `--surf` = 6.4:1 (AA Normal)
  - `--tm` (#8B96AA) on `--surf` = 4.6:1 (AA Normal ≥ 4.5) ✓
  - `--td` (#566176) on `--surf` = 2.7:1 — chỉ dùng cho large text 18px+ hoặc decorative; KHÔNG dùng cho body text quan trọng
  - Cyan accent `--cyan` on `--bg` = 10.7:1 ✓
- **Focus visible:** ring 2px `--cyan` offset 2px on all interactive
- **Touch target:** ≥ 44x44px trên mobile (buttons trên TopBar có thể nhỏ hơn, nhưng tap zone phải đảm bảo 44x44 padding)
- **Keyboard navigation:** Tab order logic, Esc close modal/palette, Enter submit, ↑↓ navigate lists
- **Screen reader:**
  - `aria-label` cho icon-only button (avatar, search ⌘K, dropdown trigger)
  - `alt` cho image (sẽ là filename hoặc auto-gen từ Cloudinary)
  - `role="dialog" aria-modal="true"` cho overlay
- **Motion:** respect `prefers-reduced-motion` — disable glitch, pulse, scanLine, shake when user prefers reduced
- **Code blocks:** không có aria-live (static); inline code dùng `<code>` element

---

## Token Change Policy (versioning)

| Loại thay đổi                              | Mức độ          | Yêu cầu                                                                                                              |
| ------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| Thêm token mới                             | Non-breaking    | Update file + entry CHANGELOG (Added) + log entry trong Token Change History                                         |
| Đổi VALUE của token (vd: `--cyan` đổi hex) | Visual breaking | Update file + grep tất cả usage + screenshot before/after + CHANGELOG (Changed)                                      |
| Đổi NAME của token (rename)                | API breaking    | Update file + `grep -r "<old-name>" apps/` replace tất cả + test pass + CHANGELOG (Changed) + ADR nếu lý do phức tạp |
| Xóa token                                  | API breaking    | Verify zero usage trước khi xóa + CHANGELOG (Removed)                                                                |

**Rule:** Mỗi token change → task riêng (F1 nếu kèm code change, F5 nếu pure refactor token theo CLAUDE.md flow).

## Token Change History

### 2026-05-17 — design overhaul v2 (cyberpunk migration)

- **REWRITE TOÀN BỘ** từ pastel warm theme sang cyberpunk dark theme
- **Removed:** light mode (TBD)
- **Removed colors (light theme):** `--color-bg #FAF7F2`, `--color-primary #FF7E67`, etc.
- **Added colors (dark theme):** layer system (bg/surf/elev/over + b1/b2/b3 + tp/ts/tm/td) + 8 accent (cyan/mag/pur/grn/yel/ora/red/blu)
- **Added typography:** Space Grotesk (brand/heading), JetBrains Mono (terminal/code/UI labels), Inter (body)
- **Removed typography:** Plus Jakarta Sans (display)
- **Added motion:** glitch (9s), pulse (2s), blink (530ms), shake, scanCard, dashedPulse, fadeUp
- **Added shadow:** cyan glow system (sm/md/lg/xl)
- **Mood colors changed:** all 7 mood colors updated theo design source (HAPPY yellow #FFD93D, EXCITED orange #FF9E64, ...)
- **Mood emoji:** EXCITED 🎉 → ⚡
- **Related:** ADR-008 (OpenAPI), design-file/ (reference prototype — tham khảo)

### v2.0 (planned M11.7 — 2026-05-24) — Design v2 overhaul

- **Added typography note:** prefer upper bound của token ranges (UI 11px, mono 13px, body 15px). Editor Create Post sang Inter cho content prose.
- **Added breakpoints (v2 sub-tier):** 980 / 760 / 640 / 480 / 420 — applied per-screen trong design-file v2.
- **Added StatusBadge variant:** PostStatus (PUBLISHED `#9ECE6A` / DRAFT `#E0AF68` / ARCHIVED `#566176`).
- **Added primitive:** NotificationBell (FR-14) — TopBar bell + dropdown.
- **Added primitive:** ReactionPicker + ReactionList modal (FR-16) — multi-reaction (6 emoji) thay binary Like.
- **Reaction emoji map:** LIKE 👍, LOVE ❤️, HAHA 😆, WOW 😮, SAD 😢, ANGRY 😡 (cross-ref DATA_MODEL ReactionType enum).
- **Breaking:** Like primitive (binary) deprecated → migrate FE `useToggleLike` → `useUpsertReaction` (FR-16.6).
- **Related:** FR-14, FR-15, FR-16, M11.7 design v2 commit `a56ee72`.

---

## Template thêm component mới

```markdown
### <ComponentName>

- **Mục đích:** <1 câu>
- **Base:** shadcn `<X>` | custom
- **Variants:** ...
- **Sizes:** ...
- **States:** default, hover, focus, active, disabled, loading, error
- **Props chính:**
  | Prop | Type | Default | Notes |
  |------|------|---------|-------|
- **A11y:** ...
- **Usage:** `import { X } from "@/components/ui/<x>"`
- **Token dùng:** `--cyan`, `radius-md`, ...
```

## Template thêm design token

```markdown
### <Token category>

| Token    | Value     | Use        |
| -------- | --------- | ---------- |
| `<name>` | `<value>` | <use case> |
```

## Template thêm pattern

````markdown
### <Pattern name>

```css
/* CSS snippet */
```
````

Use: <when/where>

````

## Template Token Change History entry

```markdown
### YYYY-MM-DD — <short title>
- Added `--<token>` (#XXX) — <reason>
- Changed `--<token>` (#OLD → #NEW) — <reason>
- Removed `--<token>` — <reason, verified zero usage>
````
