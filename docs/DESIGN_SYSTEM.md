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

| Token          | Family         | Size    | Weight  | Line height | Use                                                              |
| -------------- | -------------- | ------- | ------- | ----------- | ---------------------------------------------------------------- |
| `text-brand`   | Space Grotesk  | 16px    | 700     | 1           | Logo "kha.blog" (letter-spacing -0.04em)                         |
| `text-display` | Space Grotesk  | 28px    | 700     | 1           | Stat card value                                                  |
| `text-h1`      | Space Grotesk  | 22px    | 600     | 1.3         | Page title hero                                                  |
| `text-h2`      | Space Grotesk  | 18px    | 600     | 1.4         | Section heading                                                  |
| `text-h3`      | Inter          | 14px    | 600     | 1.4         | Card title                                                       |
| `text-body`    | Inter          | 14-16px | 400     | 1.65        | Body text (post content 15px, regular 14px)                      |
| `text-small`   | Inter          | 12-13px | 400     | 1.5         | Caption, meta                                                    |
| `text-xs`      | Inter          | 10-11px | 400     | 1.4         | Microcopy                                                        |
| `text-mono-lg` | JetBrains Mono | 14px    | 400/500 | 1.6         | Terminal text input, code block (large)                          |
| `text-mono-md` | JetBrains Mono | 13px    | 400/500 | 1.5         | Secondary mono body (dense table, post meta)                     |
| `text-mono`    | JetBrains Mono | 12px    | 400/500 | 1.5         | UI labels, timestamps, button text, mood/tag badge, filter chips |
| `text-mono-sm` | JetBrains Mono | 11px    | 400/500 | 1.4         | Section labels `// section.name`, status bar, divider deco       |
| `text-mono-xs` | JetBrains Mono | 9px     | 400     | 1.3         | Hex IDs corner deco (`#a1b2c3`) only — NOT role badges           |

**Italic** style: `text-mono` italic 400 cho placeholder + `// quote` style.

**v2 design refinement (M11.7):** Design v2 chọn upper bound của token ranges (UI label 11px thay 10px; mono text 13px thay 12px; body content 15px thay 14px) để dễ đọc. Editor Create Post chuyển từ JetBrains Mono → **Inter** cho phần content prose (UI chrome vẫn mono).

**Implementation note (M11.8 — 2026-05-25):** 7 base tokens (`text-mono-md 13px` + `text-body 15px` + `text-small 13px` + `text-h1 22px` + `text-h2 18px` + `text-h3 14px` + `text-display 28px`) đã được spec đầy đủ trong table trên nhưng FE tailwind config trước đây chỉ implement 4 mono variants. Audit M11.8 phát hiện 18 font-size drift items across 8 implemented screens. Full FE migration via T-360 screen audit sweep. v2.1 variant tokens (`text-h1-hero 26`, `text-input-hero 18`, `text-display-sm 24`, `text-mono-tiny 7-8`, `text-display-glyph 32-48`) vẫn TODO trong T-360 chính.

**Feed PostCard pixel-exact (T-398 — 2026-05-29):** User chốt bám `design-file/MyBlog Feed.html` 1:1 cho PostCard meta line + action bar, **supersede quyết định "Option A token-scale / accepted-noise" của T-392**. Giá trị authoritative mới (dùng chung Feed + Post Detail vì design-file 2 màn khớp): author `~/username` 14px (`text-mono-lg`); `[ ADMIN ]` role badge **10px** (`text-[10px]` — đảo T-378 chốt 11px); separator + timestamp + relative time 12px (`text-mono`); MoodBadge + TagPill 12px (`text-mono`); divider deco 11px (`text-mono-sm`); action buttons + reaction label + code block 13px (`text-mono-md`); post body 15px (`text-body`, không đổi).

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

| Token                 | Duration  | Easing               | Use                                                                                                                                                                            |
| --------------------- | --------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `motion-instant`      | 100ms     | linear               | Backdrop fade                                                                                                                                                                  |
| `motion-fast`         | 150ms     | ease                 | Hover, focus, state change                                                                                                                                                     |
| `motion-base`         | 200-250ms | ease-in-out          | Modal open, dropdown                                                                                                                                                           |
| `motion-slow`         | 300-400ms | ease                 | Page transition, fadeUp content                                                                                                                                                |
| `motion-glitch`       | **8s**    | infinite             | Logo + Profile hero name glitch (88-92% timing trigger). Updated 2026-05-24: design-file chốt 8s (NOT 9s như previous). FE `tailwind.config.ts` `glitch 9s` cần bump xuống 8s. |
| `motion-pulse`        | 2s        | ease-in-out infinite | Online dot, status                                                                                                                                                             |
| `motion-blink`        | 530ms     | step-start infinite  | Cursor blink                                                                                                                                                                   |
| `motion-shake`        | 400ms     | ease                 | Error shake (±5px X)                                                                                                                                                           |
| `motion-borderrotate` | **8s**    | linear infinite      | ProfileAvatar rotating ring (NEW 2026-05-24)                                                                                                                                   |
| `motion-livedot`      | 1.5s      | ease-in-out infinite | Admin live mode dot (scale 1→1.4 + opacity .8→1) (NEW 2026-05-24)                                                                                                              |
| `motion-slidein`      | 250ms     | ease                 | Right-side drawer (EditProfileDrawer) translateX 40→0 (NEW 2026-05-24)                                                                                                         |
| `motion-slidedown`    | 200ms     | ease                 | Toast notification translateY -6→0 + opacity (NEW 2026-05-24)                                                                                                                  |
| `motion-scancard`     | **4s**    | linear infinite      | Login card scan line (top -100%→200%) (Updated 2026-05-24: 4s NOT 6s; FE `scan-line` cần rename `scanCard` + bump)                                                             |

### Z-index scale (NEW 2026-05-24)

| Token               | Value | Use                                                                       |
| ------------------- | ----- | ------------------------------------------------------------------------- |
| `--z-base`          | 0-3   | Inner avatar layers (rotating ring 1, body 2, status dot 3)               |
| `--z-popover`       | 50-60 | ReactionPicker (50), PostActionMenu (60) — relative trigger overlays      |
| `--z-subbar`        | 90    | Admin pages SubBar (fixed below TopBar)                                   |
| `--z-topbar`        | 100   | TopBar fixed top + StatusBar fixed bottom                                 |
| `--z-dropdown`      | 200   | CommandPalette overlay, AvatarMenu, NotificationBell dropdown, Toast      |
| `--z-modal`         | 300   | CommentsModal, DeleteConfirm, EditProfileDrawer, QuickEditModal, TagModal |
| `--z-modal-stacked` | 400   | AISuggestModal (modal opens above another modal — Create Post AI flow)    |
| `--z-lightbox`      | 500   | ImageLightbox full-screen image viewer                                    |
| `--z-dev-tweaks`    | 9999  | TweaksPanel (dev tool) + CRT scanline overlay                             |

> Stacking principle: components at higher z always render above lower. Use these tokens (CSS variables) thay vì hardcode z-index numbers. Tránh confusion khi stacking modal trên modal — dùng `--z-modal-stacked` cho AI suggest scenario.

### Shadow recipes (NEW 2026-05-24)

Repeating shadow patterns extracted từ design-file để DRY-up component specs.

| Token                      | Value                                                      | Use                                                                |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `--shadow-glow-cyan-xs`    | `0 0 6-8px rgba(0,255,229,.40-.60)`                        | Badge ring, small button glow (bell badge)                         |
| `--shadow-glow-cyan-sm`    | `0 0 10-14px rgba(0,255,229,.12-.25)`                      | Input focus, small modal border, StatCard hover                    |
| `--shadow-glow-cyan-md`    | `0 0 20-24px rgba(0,255,229,.08-.15)`                      | Card hover, picker container, PostActionMenu                       |
| `--shadow-glow-cyan-lg`    | `0 0 40-50px rgba(0,255,229,.10-.15)`                      | Modal cyan border (CommentsModal, CommandPalette)                  |
| `--shadow-glow-<color>-md` | `0 0 12px <color>/40-60`                                   | Per-color glow (ReactionPicker hover, mood badge, tag color hover) |
| `--shadow-drop-sm`         | `0 4px 20px rgba(0,0,0,.4)`                                | Toast shadow                                                       |
| `--shadow-drop-md`         | `0 12px 40px rgba(0,0,0,.5-.6)`                            | Dropdown shadow (AvatarMenu, NotificationBell)                     |
| `--shadow-drop-lg`         | `0 16-24px 50-64px rgba(0,0,0,.6-.8)`                      | Modal shadow (CommentsModal, EditProfileDrawer)                    |
| `--shadow-drop-xl`         | `-20px 0 60px rgba(0,0,0,.8)`                              | Right-side drawer offset shadow                                    |
| `--shadow-stack`           | `<glow-cyan-lg> + <drop-lg>` (compound)                    | Compound modal shadow recipe — CommentsModal/CommandPalette        |
| `shadow-glow-cyan-modal`   | `0 0 50px rgba(0,255,229,.1), 0 24px 60px rgba(0,0,0,.7)`  | Big modal (TagModal, QuickEditModal) — T-391                       |
| `shadow-glow-cyan-panel`   | `0 0 30px rgba(0,255,229,.08), 0 16px 50px rgba(0,0,0,.6)` | Dropdown panel (NotificationBell) — T-391                          |
| `shadow-glow-cyan-input`   | `0 0 14px rgba(0,255,229,.22)`                             | Input focus glow (search/filter inputs) — T-391                    |

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
  - ImageGrid (if images > 0) — click image → opens [[#ImageLightbox]] overlay
  - FileAttachments (if files > 0)
  - Tags row (TagPill list)
  - Divider line `─────────────────────` (text-mono `--b1`)
  - **Actions (3 buttons + menu — design-file sync 2026-05-24):**
    - `[React]` — [[#ReactionButton (FR-16, M11.7)]] wrapping [[#ReactionPicker (FR-16, M11.7)]] + [[#ReactionList modal (FR-16.5, M11.7)]]. Default trigger button shows SVG line-art icon (KHÔNG emoji) via [[#ReactionIcon (FR-16, design-file 2026-05-24)]].
    - `💬 N` — **click → mở [[#CommentsModal (Feed — design-file 2026-05-24)]] popup (KHÔNG navigate `/post/:id`)**. Đây là pattern DEFINITIVE từ design-file. Post Detail page vẫn tồn tại cho deep-link/SEO khi user truy cập trực tiếp URL.
    - `↗ Share` — open share dropdown.
    - `(ml-auto) ⋯` — opens [[#PostActionMenu (Feed — design-file 2026-05-24)]] context menu (Open detail / Copy link / 🔖 Save post / admin actions / Delete).
  - **KHÔNG có SaveButton standalone trong action row** — save accessed via `⋯` menu item `🔖 Save post`.
- **Variants:** default, `glow-hi` (with stronger glow on hover, controlled bởi Tweaks panel `glowLevel` dev prop)
- **Animation:** `fadeUp 0.3s ease both` on mount with stagger delay (60ms per item)
- **Reference:** `design-file/MyBlog Feed.html` L826-925.

### PostHeader (Post Detail variant)

- Larger avatar 40px, larger username + admin tag, timestamp + mood badge stacked
- **Action row (Post Detail variant — design-file sync 2026-05-24):** Chỉ 3 button (React/Comment/Share) + `(ml-auto) 👁 N views` counter. **KHÔNG có Save button, KHÔNG có ⋯ menu** (khác PostCard Feed variant).
- **Comment `💬` button trên Post Detail:** scroll-to comment section inline (KHÔNG mở modal — đã có inline form ở dưới content). Differs từ Feed variant.
- **Reference:** `design-file/MyBlog Post Detail.html` L323-445.

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

### EditProfileDrawer (Profile — M11.5 FR-11.3, design-file Profile.html L347-439)

- **Trigger:** self click `[ ⚙️ Settings ]` button trên ProfilePage hero
- **Surface:** slide-in từ phải **480px** width (T-409, was 420), full height, bg `--surf`, border-left `1px solid rgba(0,255,229,.2)` cyan tint, shadow `-20px 0 60px rgba(0,0,0,.8)`. Backdrop `rgba(0,0,0,.6)` blur 4px overlay
- **Header (2-line, T-409):** title `// edit.profile` (12px cyan) + subline `~/settings/profile` (11px text-td) + `×` close plain inline 24px right
- **Animation:** slide-in 280ms ease-out + backdrop fade 200ms
- **Sections (4-5 stacked, scrollable body):**
  1. `// avatar` (FR-11.7, NEW T-412) — ProfileAvatar 56 preview + `↑ Upload` button cyan + `× Remove` button đỏ (chỉ khi avatarUrl ≠ null) — opens AvatarUploadModal
  2. `// basic.info` — Full name + Handle readonly + Title (max 80) + Bio textarea (max 500)
  3. `// contact.links` — Location + Born year + GitHub + Website (2-col grid)
  4. `// skills.stack` — SkillChipInput (max 20)
  5. `// security` — current password + new password + confirm password + `Change password` button (separate mutation)
- **Footer (sticky):** Cancel + `✓ Save Changes` filled solid cyan button (T-409). Save Changes submits profile-form (sections 2-4); avatar có own mutation flow; security có own button.
- **Field labels (T-409):** UPPERCASE 11px + `letter-spacing:.05em` qua CSS (vd `Full name` → render `FULL NAME` via `.uppercase tracking-[0.05em]`)
- **Input style (T-409 per .edit-inp design):** 14px JetBrains Mono, bg `--bg`, padding 8×12, radius `--radius-md`, focus border cyan + shadow-glow-cyan-sm
- **Close:** Esc, backdrop click, hoặc `×` close button top-right

### AvatarUploadModal (Profile Settings — FR-11.7, NEW T-411)

- **Trigger:** click `↑ Upload` trong `// avatar` section của EditProfileDrawer → user chọn file qua native file picker (`accept="image/jpeg,image/png,image/webp"`) → file validate inline (mime + size ≤ 5MB) → modal mở với FileReader URL
- **Surface:** centered modal portal 480px width (max-w 95vw), bg `--elev`, border `--b2`, radius `--radius-lg`, shadow `--shadow-glow-cyan-modal`, z-modal (300). Backdrop blur 4px.
- **Header:** `// upload.avatar` (12px cyan) + `~/settings/avatar/crop` subline (11px text-td) + `×` close
- **Body:**
  - **Crop area:** 320×320 square container, `react-easy-crop@^5` `<Cropper>` với `aspect={1}`, `showGrid={false}`, `objectFit="contain"`, cyan border 1px khi active
  - **Zoom slider:** below crop area, full-width, `<input type=range min=1 max=3 step=0.1>` cyan styled, label `zoom: 1.5×`
  - **Preview:** optional 120×120 circle right of crop (large screens) showing cropped preview real-time
- **Footer (sticky):** Cancel (left) + `↑ Upload` filled solid cyan (right). Upload button disabled khi processing với `⠋ uploading...` braille spinner.
- **Flow:**
  1. canvas.toBlob từ cropped area → POST `/users/me/avatar/sign` → BE return signed params
  2. FormData append blob + signed params → fetch Cloudinary direct upload → return `secure_url + public_id`
  3. PATCH `/users/me/avatar { url, publicId }` → BE cleanup old + save → return 200
  4. Modal close + drawer preview update + TanStack Query invalidate `['user-by-username']` + `['users-me']`
- **Errors:** Cloudinary upload fail → toast `upload failed — try again` + modal giữ open. PATCH 401 → trigger 401 interceptor (existing).
- **Animation:** fade-up-sm 200ms + backdrop fade 150ms
- **Close:** Esc, backdrop click, `×` close (KHÔNG submit). Once upload kick off, button changes to Cancel (abort fetch nếu API hỗ trợ).

### SkillChipInput (Edit Profile drawer — M11.5)

- **Style:** flex-wrap container border `--b2` radius `radius-md`, padding `space-2`
- **Chip:** name + 8px color circle swatch + × remove button. Color cycle qua TAG_COLORS palette (7 colors, index modulo)
- **Input:** bottom of container, placeholder `❯ add skill...`. Enter/comma → add chip
- **Constraints:** max 20 chips, name max 32 chars, color hex regex `/^#[0-9A-Fa-f]{6}$/`
- **Counter:** footer `// max 20 · N used`

### TagCard (Tags page — M11.5 FR-10.3)

- **Surface:** `--surf` + border `--b2` + radius `radius-md` + padding `space-4` + hover border `--cyan` + glow shadow
- **Layout (grid view):** name `#code` + color swatch (8px circle) inline + post count badge top-right
- **Name subline (since-date):** `since {month year}` mono 10px màu `--tm` (text-tm). ⚠️ **Readability override (T-425):** design-file `MyBlog Tags.html` L239 dùng `#566176` (= text-td) — đã bump lên `--tm` vì user thấy mờ quá. **KHÔNG revert về text-td** khi sync design-file 1:1.
- **Body:** description text-[13px] màu `--ts` (text-ts), min-h-[36px]. ⚠️ **Readability override (T-425):** design-file `MyBlog Tags.html` L252 dùng `#8B96AA` (= text-tm) — đã bump lên `--ts` cho dễ đọc. **KHÔNG revert về text-tm** khi sync design-file 1:1. (placeholder `// no description` giữ text-td italic.)
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

### ProfileAvatar (Profile hero — M11.5 FR-11.1 — updated 2026-05-24 design-file sync)

- **Variant của Avatar:** size prop (default 88px). Used: 88 (Profile hero), 56 (EditProfileDrawer), 32-40 (CommentsModal header, ResultCard).
- **Rotating ring (SVG outer, z 1, pointer-events none):**
  - `<svg>` width/height = size, absolute top-left.
  - `<circle cx={size/2} cy={size/2} r={size/2-2}>` fill none, stroke `url(#avatarGrad)` 2px, `strokeDasharray="6 4"` (NOT "20 12"), opacity full (NOT 0.7).
  - `<linearGradient id="avatarGrad" x1=0 y1=0 x2=1 y2=1>` 3 stops: cyan 80% (0%) → pur 40% (50%) → mag 60% (100%).
  - **Animation:** `borderRotate 8s linear infinite` (rotate 0→360deg). **KHÔNG `spin 4s`** — design-file 2026-05-24 chốt 8s.
- **Inner avatar (z 2):**
  - Absolute top:4 left:4 right:4 bottom:4, radius 50%.
  - Bg `linear-gradient(135deg, cyan/18, pur/18)`, **border `2px solid cyan` full** (NOT 1px cyan/40 faint).
  - Shadow `0 0 20px cyan/20 + inset 0 0 20px cyan/5` (NEW depth shadow).
  - Center: initial letter Space Grotesk 700, font-size `${size/3}`, color `--cyan`, **text-shadow `0 0 20px cyan/80`** (NEW glow).
- **Online status dot (z 3):** absolute bottom:4 right:4, 12×12 green `#9ECE6A`, border 2px `--bg`, shadow `0 0 8px grn`, animation `pulse 2s`.
- **Reference:** `design-file/MyBlog Profile.html` L260-289.
- **⚠ Code drift (F3 user-reported bug — Gap 35):** FE `apps/web/src/components/shared/ProfileAvatar.tsx` hiện có 6 visual bugs vs design-file:
  1. `spin 4s` thay `borderRotate 8s` — 2× quá nhanh.
  2. Stroke solid cyan opacity 0.7 thay linearGradient 3 stops.
  3. `strokeDasharray="20 12"` thay `"6 4"`.
  4. Inner border `1px cyan/40` thay `2px cyan` full.
  5. Missing inner shadow + text-shadow trên initial.
  6. **Missing online status dot entirely**.
     → Recommend F3 BUG task riêng để refactor + add `borderRotate` keyframe vào `tailwind.config.ts`.

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

### NotificationBell (FR-14, M11.7 — updated 2026-05-24 design-file sync)

- **Position:** TopBar right cluster, trước Avatar dropdown.
- **Button:** 32×32, radius `radius-md` (6px), **border `1px --b2`, bg `--elev` (#1A1F2E)**, color `--ts` default. Hover/open: bg `cyan/8` + color `--cyan` + shadow `0 0 12px cyan/20`. (Design-file 2026-05-24 thay đổi từ emoji bell + no-border → SVG bell + bordered button container.)
- **Icon (SVG, KHÔNG emoji):** inline SVG 15×15 viewBox 0 0 24 24, `stroke=currentColor strokeWidth=2 strokeLinecap=round strokeLinejoin=round`, 2 paths:
  - Bell body: `M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9`
  - Clapper: `M10.3 21a1.94 1.94 0 0 0 3.4 0`
- **Badge:** position `top:-3 right:-3`, min-w 16, h 16, padding 0/4, radius 8, bg `--mag` (`#FF6E96`), color `--bg` (`#0A0E1A`, NOT white), font JetBrains Mono 10px bold, **ring `1.5px solid --surf` (#11151F)** (key detail — separates badge khỏi button container), shadow `0 0 6px mag/80`, animation `pulse 2s`. Hiện khi `unreadCount > 0`.
- **Threshold:** `> 9 → "9+"` (KHÔNG `> 99 → "99+"` như previous spec — design-file chốt 9+ để tránh badge overflow vào icon).
- **Dropdown panel:** absolute top:42 right:0, width 380px (95vw max), `bg --surf`, border `cyan/25`, radius `radius-lg` (10), shadow `0 0 30px cyan/8 + 0 16px 50px black/60`, animation `fadeUp .15s`, z 200.
  - Header (padding 14/16 bg `--bg`): 2-line text — `// notifications` cyan + `{unread} unread · {total} total` mono 10 muted. Right: `✓ mark all read` cyan button (visible khi unread > 0).
  - Tab bar (padding 8/12 border-bottom `--b1`): `All (N)` / `Unread (N)` segmented mono 11, active cyan border + bg `cyan/8`.
  - List (maxH 400 scroll) — render `NotifRowBell` items (xem [[#NotifRowBell (TopBar dropdown)]]). Group time (today/yesterday/older), label `// <group>` mono 10.
  - Empty state: `◎` 28px muted + `// all caught up!` (unread tab) hoặc `// no notifications yet`.
  - Footer (padding 10/16 border-top `--b1` bg `--bg`): `// click to mark as read` mono 10 muted + `view all →` cyan link to `/notifications`.
- **Interactions:** click bell → toggle open; click outside (mousedown listener) / Esc → close; click row → navigate target + mark read; sync với `useUnreadCount()` polling 30s.
- **Accessibility:** `aria-label="Notifications, N unread"`, role `button` aria-expanded; arrow keys nav list rows; Enter activate.
- **Reference:** `design-file/myblog-shared-ui.jsx` L101-257 + `design-file/MyBlog Feed.html` L1057-1196.
- **Code drift:** RESOLVED 2026-05-27 (T-359) — FE đã refactor sang SVG bell + bordered button + ring badge + threshold `>9 → "9+"` + color `--bg`.

### ReactionPicker (FR-16, M11.7 — updated 2026-05-24 design-file sync)

- **Trigger:** hover reaction button trên PostCard / PostDetail (KHÔNG long-press — desktop pattern). Hover container có 250ms close debounce ([[#Hover-reveal popover with grace period]] pattern — quan trọng để fix user-reported bug picker biến mất khi hover qua gap).
- **Popover (panel shape, KHÔNG pill):** flex row 6 buttons 40×40px (KHÔNG 36×36), absolute `bottom:calc(100% + 6px) left:0 z:50`, padding 6, gap 2, bg `--bg` (#0A0E1A — darker than `--surf`), border `cyan/30`, **radius `radius-lg` (8px) panel** (KHÔNG `radius-full` pill), shadow `0 0 24px cyan/15 + 0 8px 30px black/70`, animation `fadeUp .12s`.
- **Reaction icon (SVG line-art, KHÔNG emoji — design-file 2026-05-24):** Dùng [[#ReactionIcon (FR-16, design-file 2026-05-24)]] component. 6 custom SVG line-art 24×24 viewBox, stroke per-reaction color:
  - `LIKE` `#7DCFFF` (blu): thumbs-up — rectangle palm + curved fingers + thumb line.
  - `LOVE` `#FF6E96` (mag): heart outline path.
  - `HAHA` `#E0AF68` (yel): rounded-square smile face + mono `LOL` text.
  - `WOW` `#BB9AF7` (pur): circle face + small eye dots + O-mouth ellipse.
  - `SAD` `#7DCFFF` (blu): circle + frown + single teardrop.
  - `ANGRY` `#F7768E` (red): circle + angry eyebrow strokes + dot eyes + small frown.
- **Hover state (per-button):** `translateY(-2px) + background ${color}22 + border ${color}A0 + boxShadow 0 0 10px ${color}50, inset 0 0 8px ${color}30`. KHÔNG scale.
- **Selected indicator (active):** button bg `${color}18` + border `${color}80` + ReactionIcon với `glow={true}` (filter `drop-shadow(0 0 4px ${color})`).
- **Display dưới button** (PostCard / Detail):
  - Top 3 reaction SVG icons stack (negative-margin overlap) + total count.
  - Click count → mở ReactionList modal (xem dưới).
- **Mobile:** popover transform full-width sticky bottom với 6 buttons 48×48px.
- **Cross-ref:** [DATA_MODEL.md > Enum ReactionType](./DATA_MODEL.md), [[#ReactionIcon (FR-16, design-file 2026-05-24)]], [[#Hover-reveal popover with grace period]].
- **Reference:** `design-file/MyBlog Feed.html` L717-758 + `design-file/MyBlog Post Detail.html` L281-321.
- **Code drift (flag F1/F5 task):** FE `apps/web/src/components/feed/ReactionPicker.tsx` hiện dùng pill (`rounded-full`) + 36×36 emoji buttons + scale-125 hover. Cần refactor sang panel shape + 40×40 SVG buttons + translateY hover.

### ReactionList modal (FR-16.5, M11.7)

- **Trigger:** click số count dưới reaction button.
- **Modal:** width 480px, header `// reactions · N` + close ✕. Tab bar: `All (N)` / `👍 LIKE (N)` / `❤️ LOVE (N)` / … (6 type tabs).
- **List:** scrollable, mỗi row: avatar + username + reaction type emoji + relative time. Pagination NFR-06 (`page=1&limit=20`).
- **Empty per tab:** `// no reactions of this type yet`.

### ReactionButton (FR-16.4/16.5, M11.7)

Composite wrapper kết hợp [[#ReactionPicker (FR-16, M11.7 — updated 2026-05-24 design-file sync)]] + [[#ReactionList modal (FR-16.5, M11.7)]] + display row. Dùng trong PostCard + PostDetail actions row.

- **Props:** `postId` + `myReaction: ReactionType | null` + `topReactions: ReactionType[]` + `count: number` (từ `Post.counts.reactions`).
- **Trigger button (left, design-file 2026-05-24 — SVG icon thay emoji):** `<ReactionIcon> <Label>` — default thumbs-up SVG line-art (16px stroke `--tm`) + `React` text-tm, active `<ReactionIcon glow={true}>` + reaction label với inline `color + textShadow 0 0 8px ${color}60` theo `REACTION_CONFIG[type].color`. `aria-pressed={!!active}`.
- **Hover trigger container (250ms grace pattern):** dùng `useRef<NodeJS.Timeout>` với `openPicker = () => { clearTimeout(timer.current); setOpen(true) }` + `closePicker = () => { timer.current = setTimeout(() => setOpen(false), 250) }`. Cho user buffer 250ms để di chuyển qua 6px gap giữa button + picker. **CRITICAL bug fix** — không có debounce thì picker biến mất khi user hover qua gap (Gap 7 user-reported).
- **Click trigger:**
  - Không có `myReaction` → `useUpsertReaction({ type: 'LIKE' })` (default).
  - Có `myReaction` → `useRemoveReaction()` (toggle off).
- **Hover container:** mở ReactionPicker. `onMouseLeave` ignore khi `relatedTarget` vẫn trong container (tránh gap với absolute picker).
- **Picker click:** cùng type với `myReaction` → remove; khác → upsert.
- **Count display button (right, only if `count > 0`):** top-3 stacked emoji (negative margin overlap) + total count. `aria-label="View N reactions"`. Click → mở ReactionList modal.
- **Optimistic state:** local mirror `{ myReaction, topReactions, count }` áp dụng ngay khi click; `useEffect` reset khi parent props đổi (cache invalidate → BE response qua TanStack Query re-flow xuống). `onError` → restore snapshot.
- **410 Gone graceful:** nếu mutation hit legacy `/posts/:id/like` trả 410 → set `gone=true` → trigger disabled + `cursor-not-allowed` + inline `role="alert" text-red`: `// reactions endpoint unavailable`.
- **A11y:** trigger có `aria-label` đầy đủ ("React to post — default Like" hoặc "Remove `<Label>` reaction"); count button có `aria-label="View N reactions"`.
- **Reference impl:** `apps/web/src/components/feed/ReactionButton.tsx`.

### CyberIcons (shared line-art icon set — T-419)

Bộ 5 SVG line-art icon dùng chung cho Manage Posts (PostRow + PostCardMng) + Tags (TagCard), thay emoji để đồng bộ visual với [[#ReactionIcon (FR-16, design-file 2026-05-24)]]. File: `apps/web/src/components/shared/cyber-icons.tsx` (T-420 move từ `admin/manage-posts/StatIcons.tsx`).

- **Style chung:** `viewBox="0 0 24 24"`, `fill="none"`, `stroke` per prop `color` (default `currentColor`), `strokeWidth` 1.6-1.8, `strokeLinejoin`/`strokeLinecap` round. Props `{ size?: number = 14, color?: string }`. Inline `vertical-align: -2px` + `flex-shrink: 0` (inline với text).
- **Icons:**
  - `HeartIcon` — heart outline (LIKE / reactions count). stroke 1.8.
  - `CommentIcon` — speech bubble + 3 dot ellipsis (comment count). stroke 1.6.
  - `EyeIcon` — eye outline + pupil (view count). stroke 1.6.
  - `PencilIcon` — pencil/edit action. stroke 1.6.
  - `TrashIcon` — trash bin + lid + 2 vertical bars (delete action). stroke 1.6/1.4.
- **Usage:** stat counts (Heart/Comment/Eye) màu `--tm` muted; action buttons (Pencil/Trash) màu theo button intent (cyan edit / red delete).
- **Reference impl:** `apps/web/src/components/shared/cyber-icons.tsx`.

---

## Components added in design-file 2026-05-24 sync

> Components mới phát hiện trong deep audit `design-file/` @ 2026-05-24. Grouped để dễ scan; có thể di chuyển sang section conceptual neighbor sau.

### ReactionIcon (FR-16, design-file 2026-05-24)

- **Mục đích:** SVG line-art icon cho 6 reactions (thay emoji Unicode).
- **Props:** `r: ReactionConfig { key, label, color, svg }` + `size?: number = 18` + `glow?: boolean = false`.
- **Render:**
  ```jsx
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ filter: glow ? `drop-shadow(0 0 4px ${r.color})` : 'none', flexShrink: 0 }}
  >
    {r.svg(r.color)}
  </svg>
  ```
- **SVG path defs (6 reactions, stroke per-color):**
  - `like` blu `#7DCFFF`: `<rect x=3 y=11 w=4 h=9 /> + <path d="M7 11l4-7c2 0 2.5 1.5 2 3l-1 2h5.5..." /> + <line x1=4 y1=15 x2=6 y2=15 />` — thumbs-up.
  - `love` mag `#FF6E96`: `<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />` — heart.
  - `haha` yel `#E0AF68`: rounded-square smile + `<text>LOL</text>` overlay.
  - `wow` pur `#BB9AF7`: circle + dot eyes + O-mouth ellipse.
  - `sad` blu `#7DCFFF`: circle + frown + teardrop.
  - `angry` red `#F7768E`: circle + angry eyebrows + dot eyes + frown.
- **REACTION_CONFIG migration:** Doc đổi `emoji` field → `iconPath` field (SVG paths defined inline trong const array). FE code drift cần update tương ứng.
- **Reference:** `design-file/MyBlog Feed.html` L717-733.

### ImageLightbox (Feed — design-file 2026-05-24)

- **Mục đích:** Full-screen image viewer khi click ảnh trong ImageGrid.
- **Trigger:** Click image trong PostCard `ImageGrid` → `setLightboxIdx(idx)` → mount via React Portal vào `document.body`.
- **Overlay:** `position:fixed inset:0`, bg `rgba(0,0,0,.92)`, z `--z-lightbox` (500), animation `fadeUp .15s`. Click backdrop → close.
- **Layout (flex column):**
  - Header: avatar + path `~/admin/post/<id>` + meta + counter `N/M` + `×` close.
  - Image area (flex 1): max 960×70vh, centered. Diagonal stripe placeholder `repeating-linear-gradient(135deg, ${bg} 0px, ${bg} 12px, ${acc}15 12px, ${acc}15 24px)` + boxShadow `0 0 60px ${acc}30, 0 0 0 1px ${acc}40`. 4-color cycle (cyan/pur/grn/ora) từ `LB_CFGS`.
  - Thumbnail strip (only `images>1`): 56×40 each, gap 6, border 2px (active=accent + glow, inactive opacity .55). Scroll horizontal nếu nhiều.
  - Footer hint: `← → navigate · Esc close · // click outside to close` mono muted.
- **Nav arrows (only `images>1`):** absolute left/right 16, 44px round, bg `rgba(17,21,31,.85) + backdrop-filter blur(8px)`, border `--b2`.
- **Keyboard:** Esc=close, ←=prev, →=next. Body scroll lock + restore on unmount.
- **Reference:** `design-file/MyBlog Feed.html` L325-413.

### PostActionMenu (Feed — design-file 2026-05-24)

- **Mục đích:** Context menu cho post (Open detail / Copy link / Save / admin actions / Delete).
- **Trigger:** `⋯` button bottom-right PostCard action row → toggle menu.
- **Position:** `position:absolute bottom:calc(100% + 6px) right:0 min-w:250px z:60`.
- **Container:** bg `--surf` (#11151F), border `cyan/25`, radius `radius-lg` (8), shadow `0 0 24px cyan/8 + 0 12px 40px rgba(0,0,0,.6)`, animation `fadeUp .15s`.
- **Header (padding 10/14 bg `--bg` border-bottom `--b1`):** `// post.actions` cyan mono 10 + `#<id>` muted mono 10.
- **Items (padding 4/0):**
  - **User actions:**
    - `↗ Open detail` cyan + `#<id>` desc → navigate `/post/<id>`.
    - `🔗 Copy link` blu (→ grn `Copied!` 900ms feedback rồi auto-close) → `navigator.clipboard.writeText('kha.blog/post/<id>')`.
    - **`🔖 Save post` yel** (NEW — design-file 2026-05-24, moved here từ standalone SaveButton trong PostCard).
  - Separator `// admin` mono 9 deep-muted.
  - **Admin actions (visible khi user là post owner / admin role — gating qua FR):**
    - `✎ Edit post` yel + `⌘E` desc → navigate Create Post edit.
    - `📌 Pin to top` pur.
    - `📦 Archive` muted.
    - `🔇 Hide comments` muted.
  - Separator `// danger`.
  - **Destructive:** `✕ Delete post` red + `permanent` desc.
- **Item structure (flex gap 10 padding 7/14):** icon 18px (color) + label flex-1 12px + desc mono 10 muted right-aligned.
- **Item hover:** background `${color}10` per-item color.
- **Behavior:** click outside (mousedown listener) → close.
- **Reference:** `design-file/MyBlog Feed.html` L761-823.

### CommentsModal (Feed — design-file 2026-05-24) — DEFINITIVE pattern

- **Mục đích:** Modal popup cho comments khi click `💬` button trong PostCard Feed. **DEFINITIVE pattern: KHÔNG navigate `/post/:id` từ Feed.** Post Detail page vẫn tồn tại nhưng chỉ accessed qua direct URL (SEO/deep-link).
- **Trigger:** PostCard `💬 N` button → `setShowComments(true)`.
- **Portal:** `ReactDOM.createPortal` vào `document.body`.
- **Overlay:** fixed inset, bg `rgba(0,0,0,.7) + backdrop-filter blur(6px)`, z `--z-modal` (300), padding 30/16. Click backdrop → close.
- **Container:** 640px max-w 95vw, max-h 90vh, bg `--surf`, border `cyan/25`, radius `radius-xl` (12), shadow `0 0 50px cyan/10 + 0 24px 64px black/70`, animation `fadeUp .2s`, flex column overflow hidden.
- **Header (padding 14/20 border-bottom `--b1` bg `--bg` flex gap 12):**
  - Avatar 32 cyan border gradient.
  - Sub-info column: `~/admin` blu mono 12 + ts mono 10 muted + (right) MoodBadge inline.
  - Sub-line: `// comments [N] · #<post-id>` cyan mono 11.
  - `×` close button right.
- **Body (flex 1 overflow-y, padding 4/20):**
  - Render `CommentItemRow` list (reuse Post Detail CommentItem + reply integration).
  - **Infinite scroll** via `IntersectionObserver` sentinel: `PAGE_SIZE=5`, mỗi intersect → setTimeout 400ms → load thêm 5 items.
  - Sentinel + loading state: `<AsciiSpinner /> loading more...` mono 12 muted.
  - End state: `// end of comments · N total` mono 11 deeper muted khi `remaining === 0`.
  - **Page indicator dots** (below sentinel): 1 dot per page, loaded=18px cyan + glow `0 0 4px cyan/80`, unloaded=5px gray, transition width .3s.
- **Footer (border-top `--b1` bg `--bg` padding 14/20 shrink-0):**
  - Textarea Inter 14 bg `#070A14` border `--b2` rows 2.
  - Row: anon toggle (`as: ~/admin` blu mono 12 / input name) + toggle button `post as anon` / `use account` + `↵ Send` cyan primary mono 12 bold.
- **Behavior:** body scroll lock khi open, Esc → close, click backdrop → close.
- **Reference:** `design-file/MyBlog Feed.html` L605-714.
- **Code drift (flag F1/F2):** FE `apps/web/src/components/feed/PostCard.tsx` hiện link `<Link to="/post/...">` cho `💬` — cần đổi sang `onClick` mở modal + implement `CommentsModal.tsx`. Cần F2 amend FR-13 (Comments pattern) trước F1.

### ReplyForm (FR-03.6 — depth-1 reply inline form)

- **Mục đích:** Inline form mở khi user click `↩ Reply` trên CommentItem để reply 1 comment (depth 1 only per FR-03.6).
- **Trigger:** CommentItem `↩ Reply` button → toggle `showReplyForm` state → render `<ReplyForm>` inline ngay dưới comment.
- **Container:** `rounded-md border border-cyan/30 bg-bg/40 p-3` — subtle cyan accent để distinguish khỏi parent comment.
- **Header:** `↩ replying to @<parentUsername>` — blu mono 11px + cyan accent cho username (denormalized from `comment.replyTo.username` field).
- **Textarea:** Inter 13px (`text-mono-md`), 2 rows, auto-focus on open, max 1000 chars, placeholder `// reply to @<parent>...`.
- **Submit shortcuts:** ⌘↵ / Ctrl↵ submit (KHÔNG plain Enter — prevent accidental submit). Buttons: Cancel (border b2) + ⌘↵ Reply (cyan primary).
- **Anon toggle:** Bật khi auth user muốn reply anonymously — same pattern như CommentForm. `[as anon]` button + name input khi enabled.
- **Cancel:** Esc keyboard, Cancel button click — both fire `onClose()` callback. Parent component (CommentItem) responsible cho clearing form state.
- **Error state:** Mutation error → `// failed — try again` mono 11 red.
- **Mutation:** Reuse `useCreateComment` mutation với `dto.parentId` set. Server validates parent depth + cross-post. onSuccess → clear content + close form.
- **File:** `apps/web/src/components/feed/ReplyForm.tsx`.

### ReplyRow (FR-03.6 — nested reply display under parent)

- **Mục đích:** Nested reply display under parent CommentItem, indent để visually communicate parent-child relationship.
- **Container:** `ml-10` (40px indent) `rounded-md border border-b2 bg-bg/40 p-2.5` — subtle elevation, smaller padding than CommentItem.
- **Avatar:** size `xs` (24×24, font 10px) — smaller than CommentItem's `sm` (28×28) để emphasize hierarchy.
- **Header row:** `<Avatar xs> @<author>` blu mono 11 + (optional) `↩ @<replyToUsername>` cyan accent từ denormalized `reply.replyTo` field + `·` separator + relative time mono 11 muted.
- **Content:** Inter `text-mono-md` (13px), line-height 1.55, wrap pre-wrap, color `#C9D1D9`.
- **Like button:** Traditional `♡` (unliked) / `❤` (liked, magenta) binary toggle — **KHÔNG reaction picker.** Replies inherit Comment-style binary like, NOT Post-style reactions. Smaller size than CommentItem (`px-1.5 py-0.5`).
- **NO Reply button:** Replies KHÔNG nested (depth 1 only per FR-03.6). Server enforces `INVALID_PARENT_DEPTH` 400 nếu cố reply on reply.
- **Anonymous variant:** `Anon · <name>` display, KHÔNG show `replyTo` arrow (nullable field).
- **File:** `apps/web/src/components/feed/ReplyRow.tsx`.

### AvatarMenu (TopBar dropdown — design-file 2026-05-24)

- **Mục đích:** Click avatar TopBar → dropdown menu 7 items.
- **Trigger:** Click 32×32 avatar (cyan border gradient + green status dot bottom-right) → toggle menu.
- **Container:** `position:absolute top:42 right:0 min-w:210px z:200`, bg `--elev` (#1A1F2E), border `cyan/25`, radius `radius-lg` (8), padding 6, shadow `0 0 30px cyan/10 + 0 12px 40px black/60`, animation `fadeUp .15s`.
- **Header (padding 8/10/10 border-bottom `--b2` mb 4):**
  - Mini avatar 28 cyan border + gradient.
  - Info: `~/admin` blu mono 12 + `[ ADMIN ]` ora mono 10 (chỉ render khi role ADMIN).
- **Items (7 entries):**
  - `📝 Manage Posts` blu (`#7DCFFF`) → `/admin/posts`.
  - `⚙️ Admin Dashboard` pur (`#BB9AF7`) + `⌘3` desc → `/admin`.
  - `🏷 Manage Tags` yel (`#E0AF68`) → `/tags`.
  - `🔧 System Settings` grn (`#9ECE6A`) → TBD.
  - **Separator** 1px `--b2`.
  - `👤 Profile` (color default `--ts` thay vì accent) → `/profile/<user>`.
  - `🚪 Logout` red (`#F7768E`) + `⌘Q` desc → POST `/auth/logout`.
- **Item structure:** flex gap 8 padding 7/10 radius `radius-sm`. Icon 15px + label flex-1 14 (per-item color) + optional desc mono 11 muted right.
- **Item hover:** bg `cyan/8` (uniform — KHÔNG per-color hover).
- **Behavior:** click outside (mousedown listener) → close. Avatar status dot (8×8 green bottom-right border `--bg`).
- **Reference:** `design-file/myblog-shared-ui.jsx` L259-326 + `design-file/MyBlog Feed.html` L1244-1273.
- **Code drift (flag F1):** FE TopBar avatar dropdown cần verify 7 items + per-item color + status dot.

### SubBar (Admin pages pattern — design-file 2026-05-24)

> Repeating pattern dùng ở Admin Dashboard / Manage Posts / Tags / Notifications. Tách spec riêng để cross-link từ các Screen specs.

- **Mục đích:** Fixed sub-bar dưới TopBar cho admin pages — chứa breadcrumb + counts + page-specific actions.
- **Position:** `position:fixed top:52px left:0 right:0 height:40-44px z:90`.
- **Surface:** bg `--surf` (#11151F), border-bottom `--b1`, padding 0/20-24, font JetBrains Mono 12.
- **Layout (flex align-center gap 12):**
  - Left cluster: `~/<page-path>` muted + `──` divider mono + counts/status indicators (per-color theo type).
  - Right cluster (margin-left auto): action buttons (vd: `+ New Post` cyan primary, `✕ Delete N selected` red, `✓ mark all read` cyan secondary).
- **Heights:** 40px (Admin Dashboard) hoặc 44px (Manage Posts / Tags / Notifications).
- **Content offset:** Pages có SubBar cần `marginTop: 92-96px` (52 TopBar + 40-44 SubBar) cho main content.
- **Mobile:** overflow-x auto, scrollable horizontally khi content quá dài.
- **Reference:** `design-file/MyBlog Admin.html` L266-278 (40px), `MyBlog Manage Posts.html` L528-548 (44px), `MyBlog Tags.html` L460-472, `MyBlog Notifications.html` L254-274.

### LoginCard (Screen 0 — design-file 2026-05-24)

> Extend existing [[#Terminal Card (Login)]] với form spec đầy đủ + animations.

- **Card shell:** 420px max-w + padding 20, bg `--surf`, border `--b2`, radius `radius-xl` (12), shadow `0 0 50px cyan/7 + 0 20px 60px black/55`, animation `fadeUp .35s ease`. Card shakes (`shake .4s ease`) on submit fail.
- **Moving scan line:** absolute top, 2px height, `linear-gradient(90deg, transparent, cyan/18, transparent)`, animation `scanCard 4s linear infinite` (top: -100% → 200%), z 2, pointer-events none.
- **Terminal header (bg `--bg` border-bottom `--b1` padding 14/18):**
  - Row 1: SVG bracket logo (16×16) + `kha.blog` brand text (Space Grotesk 700 15 — Login variant, smaller than TopBar 17) + `v0.1.0` muted.
  - Row 2: `~/auth/login` mono 13 muted + blinking `_` cursor (530ms cycle qua `blink`/`cursorBlink` keyframes).
- **Form body (padding 22/20/26):**
  - Helper: `// authenticate to continue` mono 11 muted mb 18.
  - **Username field:** label `username` mono 11 muted mb 6 + input (bg `#070A14`, border `--b2`, mono 15, padding 10/12/10/32, radius 6) với prefix `❯` cyan absolute left. autoFocus.
  - **Password field:** tương tự, type toggle button `👁`/`🙈` right (color muted, 14px). Show/hide password.
  - **Error block:** red mono 13, bg `red/8`, border `red/30`, radius 5, padding 8/12 mb 14. Trigger shake animation trên card khi submit fail.
  - **Submit button:** `.btn-primary` 100% width, cyan, mono 14 bold, padding 11. Label states:
    - Idle: `[ AUTHENTICATE ↵ ]`.
    - Loading: `[ ${SPIN[frame]} AUTHENTICATING... ]` với braille spinner frame `['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']` 80ms loop.
    - Disabled: muted bg + border, color `--tm`.
  - **Divider:** `── or ──` mono muted my 18/14 with horizontal lines flex.
  - **Continue as anonymous link:** centered block, bg `pur/5`, border `pur/20`, radius 6, padding 9, mono 13 pur → navigate Feed.
  - **Register link:** mt 16 centered `// no account? ❯ register here` mono 12 muted với `❯ register here` blu link.
- **Bottom mini status (outside card mt 14):** flex justify-between, mono 11 muted. Left: `● connected to server` pulse green + text. Right: `build: a1b2c3` git short hash.
- **Animations used:** [[#Scan card animation (Login)]] (scanCard 4s) + [[#Shake animation (error)]] (.4s) + [[#FadeUp entrance]] (.35s) + [[#Cursor blink (Login terminal)]] (blink 530ms) + Braille spinner pattern.
- **Reference:** `design-file/MyBlog Login.html` L191-318.
- **Code drift (flag F1):** FE LoginPage cần verify scanCard line + braille spinner + shake on fail + anon link + register link + bracket logo SVG. Note FE `tailwind.config.ts` `scan-line 6s` cần bump xuống 4s + rename `scanCard`.

### Toast notification pattern (Tags / Manage Posts / Notifications — design-file 2026-05-24)

- **Mục đích:** Transient bottom-right notification cho user feedback (success / error / info).
- **Position:** `position:fixed bottom:44px right:20px z:200` (chừa khoảng cho StatusBar 28px + offset 16px).
- **Duration:** **2500ms** (standardized — Tags + Manage Posts dùng 2500, Notifications hiện dùng 2400 nhưng cần normalize 2500).
- **Variants (3):**
  - `success` — color `--grn` (`#9ECE6A`), bg `grn/10`, border `grn/40`, icon prefix `✓`.
  - `error` — color `--red` (`#F7768E`), bg `red/10`, border `red/40`, icon prefix `✕`.
  - `info` — color `--cyan` (`#00FFE5`), bg `cyan/10`, border `cyan/40`, icon prefix `ℹ`.
- **Style:** font JetBrains Mono 12-13px, radius `radius-md` (6), padding 10/16, shadow `0 4px 20px black/40`, animation `slideDown .2s ease` mount.
- **Content:** icon prefix + message string. Examples: `✓ Updated #code`, `✕ Deleted post #abc123`, `✓ All marked as read`.
- **API hook suggestion:** `useToast()` hook returning `{ showToast(msg, type='success') }` — auto-dismiss after 2500ms via `setTimeout`.
- **Reference:** `design-file/MyBlog Tags.html` L583-593 + `MyBlog Manage Posts.html` Toast block + `MyBlog Notifications.html` L372-382.

### NotifRowBell + NotifRowPage (2 variants split — design-file 2026-05-24)

> **Important:** Design-file dùng 2 NotifRow components KHÁC nhau cho 2 contexts. Doc cần spec 2 components riêng (KHÔNG gộp).

#### NotifRowBell (NotificationBell dropdown variant)

- **Use:** Render trong `NotificationBell` dropdown panel (`/notifications` page KHÔNG dùng — page dùng `NotifRowPage`).
- **Layout:** flex gap 10 padding 10/16, borderLeft 2px solid (read=transparent, unread=`cfg.color`), bg tint `${cfg.color}06` unread / transparent read.
- **Hover:** read=`--elev`, unread=`${cfg.color}10`.
- **Avatar:** 34×34 round + border `--b2` 1.5px + bg gradient cyan/pur (anon: `--elev` bg + `?` text muted). With overlap badge bottom-right: 18×18 round, bg `cfg.color`, border 2px `--surf`, fontSize 9, color `--bg`, shadow `0 0 4px ${cfg.color}80`. Badge icon = `cfg.icon` (emoji).
- **Content (flex 1 min-w-0):** 3 lines.
  - Line 1: user blu mono + verb muted + `your post` muted.
  - Line 2: snippet 12 italic muted truncate ellipsis nowrap mb 2.
  - Line 3: `#<post-id>` + `·` + time muted mono 10 + (right auto, `· ● new` color `cfg.color` if unread).
- **TYPE_CFG (4 types — đồng bộ `NotificationType` enum + NotifRowPage):**
  - `REACTION ❤ mag` (`#FF6E96`), verb `reacted to`.
  - `COMMENT 💬 blu` (`#7DCFFF`), verb `commented on`.
  - `REPLY ↩ grn` (`#9ECE6A`), verb `replied to your comment on`.
  - `SHARE ↗ pur` (`#BB9AF7`), verb `shared`.
- **Behavior:** entire row click → navigate `/post/<post-id>` + mark read.
- **Reference:** `design-file/myblog-shared-ui.jsx` L194-241 (sizing reference; type set đã sync sang 4 enum thật, không dùng `like/save` legacy).

#### NotifRowPage (Notifications page variant)

- **Use:** Render trong `/notifications` page list (full features: checkbox + bulk + actions).
- **Layout:** flex gap 12 padding 14/18, borderLeft 3px solid (selected=cyan, unread=`cfg.color`, read=transparent), bg tint (selected=cyan/05, unread=`${cfg.color}06`, read=transparent).
- **Hover:** bg `--elev`.
- **Checkbox column (16×16 left):** border 1.5px (selected=cyan, default=`#3D4A63`), bg cyan when selected + `✓` icon `--bg` 10px. Click toggle `selected` Set.
- **Avatar:** 40×40 (NOT 34×34 như Bell variant) + overlap badge bottom-right **20×20** (NOT 18×18) round, bg `cfg.color`, border 2px `--surf`, fontSize 10 color `--bg` weight 700, shadow `0 0 5px ${cfg.color}80`.
- **Content (flex 1 min-w-0 anchor `<a href="/post/<id>">`):**
  - Line 1: user blu + `[anon]` muted badge (if anon) + verb muted + (reply only) `from @<replyTo>` blu + `your post` muted (non-reply).
  - Line 2: snippet 12 italic muted truncate maxW 520.
  - Line 3: `#<post-id>` + `·` + time mono 10 muted + (`· ● new` color `cfg.color` if unread).
- **Actions (right flex gap 4):**
  - `○`/`●` mark toggle button (act-btn): color cyan if unread, muted if read.
  - `✕` delete button (act-btn red border).
- **TYPE_CFG (4 new types — Notifications page only):**
  - `reaction ❤ mag` (`#FF6E96`), verb `reacted to`.
  - `comment 💬 blu` (`#7DCFFF`), verb `commented on`.
  - `reply ↩ grn` (`#9ECE6A`), verb `replied to your comment on` + `from @<replyTo>` clause.
  - `share ↗ pur` (`#BB9AF7`), verb `shared`.
- **Reference:** `design-file/MyBlog Notifications.html` L72-152.

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

| Mood       | Color                                               | Emoji | Use in DESIGN_SYSTEM            | Note                                                                                      |
| ---------- | --------------------------------------------------- | ----- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| HAPPY      | `#FFD93D` (yellow-bright)                           | 😊    | MoodBadge, mood filter, MoodBar | ⚠ **Outlier** — KHÔNG nằm trong 8-accent palette (khác `--yel #E0AF68`). Mood-only color. |
| EXCITED    | `#FF9E64` (orange)                                  | ⚡    | (same)                          | Match `--ora`                                                                             |
| THOUGHTFUL | `#BB9AF7` (purple)                                  | 💭    | (same)                          | Match `--pur`                                                                             |
| CALM       | `#7DCFFF` (blue)                                    | 😌    | (same)                          | Match `--blu`                                                                             |
| SAD        | `#6BCFFF` (cyan-blue, slightly different from CALM) | 😢    | (same)                          | ⚠ **Outlier** — KHÔNG `--blu #7DCFFF`. Mood-only color.                                   |
| GRATEFUL   | `#9ECE6A` (green)                                   | 🙏    | (same)                          | Match `--grn`                                                                             |
| ANGRY      | `#F7768E` (red)                                     | 😠    | (same)                          | Match `--red`                                                                             |

**Note about outliers (design-file 2026-05-24 sync):** `HAPPY #FFD93D` và `SAD #6BCFFF` là 2 màu duy nhất KHÔNG thuộc 8-accent token palette. Đây là intentional design-file choice để 2 mood này có signature riêng. Document như "mood-only colors" — KHÔNG add vào accent palette.

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

### Glitch animation (logo + Profile hero name)

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
.logo-txt,
.glitch {
  animation: glitch 8s infinite; /* design-file 2026-05-24: 8s (NOT 9s — FE tailwind cần bump) */
}
```

Use cho: TopBar logo (`.logo-txt`), Profile hero name H1 (`.glitch`). Both use same keyframes with **8s duration**.

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

### 2026-05-24 — design-file sync v2.1 (comprehensive — 40+ components / 12 patterns / 16+ updates / token system refinement)

**Source of truth:** `design-file/` directory @ 2026-05-24 (9 HTML mockup + 3 shared JSX). Deep audit phát hiện 35 main gaps + 59 drift items.

**Added components (Phase 1 — 22 items):** ImageLightbox, PostActionMenu (with `🔖 Save post` item), CommentsModal (DEFINITIVE Feed pattern), ReactionIcon, AvatarMenu, AISuggestModal, LinkInsertModal, RichTextToolbar, ReplyForm, ReplyRow, LoginCard refresh, ResultCard refresh, Highlight (`<mark>`), CommandPalette full spec, StatusBar full spec, ProfileAvatar refresh (rotating ring 8s borderRotate + gradient stroke + online dot), EditProfileDrawer, PostMiniCard, StatCardSparkline, MoodBar, SubBar, Toast.

**Added components (Phase 2 — 14 items từ deep re-audit Gap 33):** PostContent code block parser, ImageCarousel single-image variant, Breadcrumb pattern, SocialShare (4 brand buttons), EmojiPicker (4 groups × 16 emojis inline), TagPickerDropdown master-data, UploadZone dashed border, ImageThumb 60×60, TagBadge with × remove, AsciiSpinner shared, FilterBar Feed mood filter, **NotifRowBell + NotifRowPage split** (2 variants — Bell 34/18/2px + 4 legacy types vs Page 40/20/3px + 4 new types + checkbox), RichTextEditor contentEditable patterns, HeatmapGrid (mini/large variants), QuickEditModal Manage Posts, PostRow + PostCardMng variants, STATUSES enum (PUBLISHED grn / DRAFT yel / ARCHIVED muted).

**Added patterns (12):** Hover-reveal popover with 250ms grace period (CRITICAL bug fix for ReactionPicker), Helper text hierarchy, Admin sub-bar, Toast notification, Glitch text 8s, Hex deco background, borderRotate 8s, scanCard 4s, Braille spinner JS pattern, liveDot 1.5s, slideIn 250ms drawer, Master-data tag picker.

**Added tokens — typography refinement:** `text-brand` split (17px main TopBar + 15px Login variant), `text-h1-hero` 26px SG (Profile hero name + glitch), `text-input-hero` 18px Inter (Search big input), `text-display-sm` 24px (Profile StatCard variant), `text-mono-tiny` 7-8px (pulse dots, page indicator badges), `text-display-glyph` 32-48px (empty state large glyphs `◐ ◎ ⚠️`).

**Added tokens — micro typography:** letter-spacing `.05em / .06em / .08em`; line-height `1.75 / 1.8 / 1.9` cho Profile bio / sidebar / mini sparkline.

**Added tokens — Z-index scale 9 tiers:** `--z-base 0-3 / --z-popover 50-60 / --z-subbar 90 / --z-topbar 100 / --z-dropdown 200 / --z-modal 300 / --z-modal-stacked 400 / --z-lightbox 500 / --z-dev-tweaks 9999`. See `### Z-index scale` section.

**Added tokens — Shadow recipes (10):** `--shadow-glow-cyan-xs/sm/md/lg + --shadow-glow-<color>-md + --shadow-drop-sm/md/lg/xl + --shadow-stack`. See `### Shadow recipes` section.

**Added tokens — Animation registry / motion tokens:** `motion-borderrotate 8s linear`, `motion-livedot 1.5s`, `motion-slidein 250ms`, `motion-slidedown 200ms`, `motion-scancard 4s` (renamed + duration bump). **T-361 follow-up (2026-05-25, commit `38e3758`):** add `motion-cursorblink 1s steps(2)` keyframe (cho Search caret + terminal cursor) + split `fade-up 300ms` thành 5 variants (`fade-up-xs 120ms` picker / `fade-up-sm 150ms` default modal / `fade-up 200ms` DeleteConfirm / `fade-up-md 250ms` drawer / `fade-up-lg 350ms` Login card). See updated `### Motion` table.

**Added tokens — palette/colors:** `NEON_COLORS` 8-color array alias `--accents` (cyan/mag/pur/grn/yel/ora/blu/red) for tag color picker. `TEXT_COLORS` 7 (default/pink/cyan/green/yellow/purple/blue) cho Create Post text color popover. `HIGHLIGHT_COLORS` 7 với `/40` transparency suffix cho highlight popover. `EMOJI_GROUPS` 4×16 cho EmojiPicker.

**Updated 16+ specs:** NotificationBell (SVG bell + bordered button + ring badge `1.5px --surf` + threshold `9+` NOT `99+`), ReactionPicker (panel shape radius 8 NOT pill + 40×40 buttons + per-color translateY hover + 250ms close debounce), ReactionButton (SVG ReactionIcon trigger + 250ms hover grace), PostCard (action row 3 buttons + ⋯ menu, **`💬` → CommentsModal popup KHÔNG navigate `/post/:id`**, bỏ SaveButton standalone), PostHeader (Post Detail action row chỉ 3 button + `👁 views` right), SaveButton (moved to PostActionMenu item), CommentItem (add reply MVP với traditional ♡/❤ — KHÔNG reaction picker), **NotifRow split into Bell + Page 2 variants** (xem mới sections), ConfirmDialog (2 variants Tags 360px simple + Posts 400px with content preview), TopBar (`hideSearch?` prop + bracket logo SVG spec + AvatarMenu link), MOOD_CFG (7 moods table + note 2 outliers HAPPY #FFD93D + SAD #6BCFFF KHÔNG trong 8-accent palette), Sparkline (3 size variants 80×22 default / 60×20 profile / 50×16 mini Tags), TagCard (top accent line + hover animation + progress bar 2px bottom), TagModal (NEON_COLORS 8 swatches + native picker + live preview + error block + Enter to save), BigSearchInput (Inter 18 NOT mono + `⌘K` badge + × clear), PostPreview (action row update từ static `♡ 0 · 💬 0 · 🏷 · ↗` → match new PostCard React/Comment/Share/⋯), Motion table (`motion-glitch` 9s→**8s** + add 5 new motion tokens), Typography table (clarify range usage + outliers note).

**Reference (design-file/ @ 2026-05-24):**

- `MyBlog Feed.html` L325-413 (ImageLightbox), L605-714 (CommentsModal), L717-758 (ReactionIcon SVG defs + ReactionPicker), L761-823 (PostActionMenu), L826-925 (PostCard new action row), L1057-1196 (NotificationBell SVG bell + ring badge)
- `MyBlog Post Detail.html` L204-223 (PostContent code block parser), L225-253 (ImageCarousel), L323-445 (Post Detail action row 3-button + 👁 views)
- `MyBlog Create Post.html` L322-414 (RichTextToolbar 11 buttons), L416-434 (TEXT_COLORS 7 + HIGHLIGHT_COLORS 7), L436-441 (EMOJI_GROUPS 4×16), L783-868 (AISuggestModal), L869+ (LinkInsertModal saveSelection)
- `MyBlog Search.html` L240-484 (Search hero + ResultCard + Highlight + filter row + empty state 3 sections)
- `MyBlog Notifications.html` L52-256 (6 type tabs + bulk + toast + NotifRowPage variant + checkbox)
- `MyBlog Manage Posts.html` L180-705 (QuickEditModal + bulk select + dual view + STATUSES enum + DeleteConfirm 400px variant)
- `MyBlog Tags.html` L190-602 (TagCard hover anim + TagModal NEON_COLORS + DeleteConfirm 360px variant + Toast)
- `MyBlog Profile.html` L213-740 (ProfilePage hero + glitch + ProfileAvatar rotating ring + 4 tabs + sidebar + EditProfileDrawer)
- `MyBlog Admin.html` L184-410 (AdminPage SubBar + StatCards + MoodBar + users table + comments moderation + liveDot)
- `MyBlog Login.html` L191-318 (LoginCard scanCard + braille spinner + shake + anon link)
- `myblog-shared-ui.jsx` L1-349 (TopBar + StatusBar + CommandPalette + NotificationBell + AvatarMenu)
- `myblog-components.jsx` L1-399 (POSTS_DATA + MOOD_CFG outliers + TAGS_DATA + Sparkline + AsciiBar + TagPill + MoodBadge + ImageGrid + FileAttachments + Sidebar/RightPanel legacy)

**Code drift flagged (59 items):** Documented trong follow-up F2/F3/F1 tasks. Highlights:

- ⚠ **3 user-reported bugs (F3 priority cao):**
  1. ReactionPicker hover gap — thiếu 250ms close debounce (Gap 7).
  2. **Profile animations broken** (Gap 35): `ProfileAvatar.tsx` 6 bugs (`spin 4s` vs `borderRotate 8s` + dasharray sai + solid stroke vs gradient + 1px vs 2px border + missing online dot + missing inner/text shadow); `tailwind.config.ts` `glitch 9s` vs `8s`; `pulse-status` keyframes scale-shrink vs design-file drop-shadow glow.
  3. `tailwind.config.ts` `scan-line 6s` vs design-file `scanCard 4s` + missing 5 keyframes (`borderRotate`, `liveDot`, `slideIn`, `slideDown`, `cursorBlink`).
- **5 FR amendments cần làm trước F1:** AI generation (Gap 10), reply-to-comment (Gap 16), CommentsModal pattern at Feed level (Gap 3), notifications scope expanded (Gap 14/15), search scope expanded (Gap 20).
- F1 implementation tasks (~22 tasks) cho mỗi component mới (ImageLightbox, PostActionMenu, CommentsModal, NotificationBell visual refactor, etc.).

**Decisions:**

- Drop SaveButton standalone → move vào PostActionMenu (hybrid approach — preserves FR-13 functionality while matching design-file action row 3-button).
- 2 mood color outliers (HAPPY #FFD93D, SAD #6BCFFF) documented as "mood-only colors" — KHÔNG add vào 8-accent palette.
- CommentsModal là DEFINITIVE pattern cho Feed `💬` button (Post Detail page vẫn alive cho deep-link/SEO).
- NotifRow split thành 2 components riêng (Bell vs Page variants) — KHÔNG gộp.

**Related:** FR-13 (CommentsModal pattern amendment), FR-14 (Notifications scope), FR-16 (Reactions), design-file/ commit @ 2026-05-24.

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
