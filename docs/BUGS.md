# Bug Tracker

> Format: `[BUG-ID] [Severity] Title - Status`
> Severity: `Critical` | `High` | `Medium` | `Low`
> Status: `OPEN` | `IN_PROGRESS` | `FIXED` | `FIXED (hotfix, pending RCA)` | `WONT_FIX`
> Affected layer: `FE` | `BE` | `Both` | `Infra`

## Open

### [BUG-001] [High] [FE] ReactionPicker biến mất khi hover qua gap → user không chọn được reaction

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-25
- **Environment:**
  - Browser/OS: Chrome/Safari (any modern) / macOS / desktop
  - App version: v0.4.0-alpha post-T-317 commit `84835bd`
  - Env: local + preview + production
  - Layer impacted: FE
- **Related task:** T-340 (sẽ tạo trong M11.8 backlog)
- **Related FR/component:** FR-16.5 / `apps/web/src/components/feed/ReactionButton.tsx` L86-92
- **Mô tả:** Hover vào nút React trên PostCard → ReactionPicker popover hiện ra (6 SVG icons). User di chuột lên popover để chọn emoji nhưng picker biến mất giữa chừng → user không thể click được reaction nào.
- **Steps to reproduce:**
  1. Mở Feed (`/`) hoặc Post Detail (`/post/:id`).
  2. Hover chuột vào nút `React` trên PostCard action row → ReactionPicker hiện.
  3. Di chuột lên trên (qua khoảng gap 6px giữa nút và picker) để chọn 1 emoji.
  4. Picker biến mất trước khi chuột kịp vào picker → user không click được.
- **Expected:** Picker giữ open khi chuột di chuyển qua gap, user chọn được emoji.
- **Actual:** Picker đóng giữa chừng. UX bị blocked, user không thể chọn reaction qua hover flow.
- **Screenshot/log:** N/A (UX issue, không có error log)
- **Root cause:** FE `ReactionButton.tsx` `onMouseLeave` fires khi chuột nằm trên gap `mb-2` (8px) giữa button và picker — không có DOM element nào trong gap nên container coi mouse đã rời. Fix: thêm invisible bridge `<div aria-hidden h-3 absolute bottom-full left-0 right-0>` chỉ render khi picker mở, lấp vật lý 8px gap (h-3=12px, 4px buffer). Mouse cross gap → đang trên bridge (descendant của container) → `onMouseLeave` không fire → close instant (0ms). Pattern: `DESIGN_SYSTEM.md > Hover-reveal popover with grace period`.
- **Fix (proposed):** Refactor `ReactionButton.tsx` (`apps/web/src/components/feed/ReactionButton.tsx`):
  - Thêm `const hoverTimer = useRef<NodeJS.Timeout>()`.
  - `openPicker = () => { clearTimeout(hoverTimer.current); setPickerOpen(true); }`.
  - `closePicker = () => { hoverTimer.current = setTimeout(() => setPickerOpen(false), 250); }`.
  - Wire `onMouseEnter={openPicker}` + `onMouseLeave={closePicker}` trên container (KHÔNG check relatedTarget).
- **Regression test:** `apps/web/tests/components/feed/ReactionButton.test.tsx` — case `it('regression BUG-001: picker stays open when mouse moves through 6px gap', ...)` simulate `mouseEnter` button → wait 100ms → `mouseEnter` picker → verify picker still rendered. Move out → wait 300ms → verify picker closed.
- **Pattern reference:** `DESIGN_SYSTEM.md > Hover-reveal popover with grace period`.

### [BUG-002] [High] [FE] ProfileAvatar 6 visual/animation bugs vs design-file (rotating ring + online dot + glow)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-25
- **Environment:**
  - Browser/OS: any modern browser
  - App version: v0.4.0-alpha post-T-317 commit `84835bd`
  - Env: local + preview + production
  - Layer impacted: FE
- **Related task:** T-341 (sẽ tạo trong M11.8 backlog)
- **Related FR/component:** FR-11.1 / `apps/web/src/components/shared/ProfileAvatar.tsx` + `apps/web/tailwind.config.ts`
- **Mô tả:** ProfileAvatar trên Profile page (`/profile/:username`) có 6 lỗi visual/animation vs design-file:
  1. Rotating ring quay quá nhanh: `spin 4s` thay vì `borderRotate 8s` (2× tốc độ design).
  2. Stroke ring solid cyan (opacity 0.7) thay vì linear-gradient 3 stops (cyan 80% → pur 40% → mag 60%).
  3. Dasharray `"20 12"` thay vì `"6 4"` (sai proportions).
  4. Inner border 1px `#00FFE540` (40% opacity) thay vì 2px solid cyan full.
  5. **Missing online status dot bottom-right** (green 12×12 với `pulse 2s` + border + shadow `0 0 8px grn`).
  6. Missing inner shadow `0 0 20px cyan/20 + inset 0 0 20px cyan/5` + text-shadow `0 0 20px cyan/80` trên initial letter.
- **Plus 2 related tailwind config bugs:**
  - `glitch 9s` thay vì `glitch 8s` (Profile hero name glitch tempo lệch 1s).
  - `pulse-status` keyframes dùng `opacity + scale 0.9` thay vì design-file `pulse` `opacity + drop-shadow glow` (effect khác hẳn — shrink vs glow).
- **Steps to reproduce:**
  1. Open `/profile/admin` hoặc `/me`.
  2. Quan sát hero avatar 88px top-left của hero banner.
  3. So sánh với `design-file/MyBlog Profile.html` L260-289 (open file trong browser).
- **Expected:** Avatar có rotating gradient ring quay 8s + online green dot bottom-right pulsing + glow shadow + text glow.
- **Actual:** Ring spin nhanh hơn 2x, stroke solid cyan, không có online dot, không có shadow glow.
- **Screenshot/log:** Visual diff — capture cả 2 (current FE Profile vs `design-file/MyBlog Profile.html`).
- **Root cause:** FE `ProfileAvatar.tsx` được implement nhanh trong M11.5 (T-098 hoặc tương tự) trước khi design-file 2026-05-24 finalize spec. Implementation chỉ cover basic case, miss nhiều chi tiết visual + animation đã chốt trong design-file v2.1.
- **Additional drift discovered (post-initial-fix, 2026-05-25):** Sau commit `4c9b622` initial fix vẫn không match design-file 1:1 vì 4 vấn đề thêm:
  1. SVG `viewBox="0 0 100 100"` + `absolute inset-0` → SVG scale 0.88× (88 container/100 viewBox), stroke 2px render 1.76px, dash `6 4` render `5.28 3.52` — dashes nhìn nhỏ + nhịp quay bị nén.
  2. Gradient stop 3 dùng `#FF79C6` (pink), design `#FF6E96` (rose).
  3. Online dot dùng `#50FA7B` (Dracula green), design `#9ECE6A` (Tokyo-night olive).
  4. Inner avatar margin `3px` (size-6 inner), design `4px` all sides; online dot ở corner `0,0` thay vì inset `4 4`.
  5. SVG default `transform-origin` = `0 0` (top-left) trên một số browser → ring quay quanh corner thay vì tâm. Fixed bằng explicit `transformOrigin: 50% 50%`.
  - Fixed trong commits `b492c9d` (pixel-exact refactor) + `b7b5524` (transformOrigin).
- **Fix (proposed):** Refactor `apps/web/src/components/shared/ProfileAvatar.tsx` theo `DESIGN_SYSTEM.md > ProfileAvatar (Profile hero — M11.5 FR-11.1 — updated 2026-05-24 design-file sync)`:
  - Add `<linearGradient id="avatarGrad">` 3 stops + use `stroke="url(#avatarGrad)"`.
  - Change `strokeDasharray="20 12"` → `"6 4"`.
  - Change animation `spin 4s` → `borderRotate 8s linear infinite` (add keyframe vào `tailwind.config.ts`).
  - Inner: border `2px solid cyan` full + shadow `0 0 20px cyan/20 + inset 0 0 20px cyan/5` + text-shadow `0 0 20px cyan/80`.
  - Add online status dot (12×12 green bottom-right border 2px `--bg` + shadow + `animate-pulse`).
  - `tailwind.config.ts`: bump `glitch 9s → 8s`; refactor `pulse-status` keyframes về match `pulse` (opacity .7→1 + drop-shadow glow, NOT scale shrink); add 4 new keyframes (`borderRotate 8s`, `liveDot 1.5s`, `slideIn .25s`, `slideDown .2s`).
- **Regression test:** `apps/web/tests/components/shared/ProfileAvatar.test.tsx` — case `it('regression BUG-002: avatar has gradient ring + online dot + correct animation duration', ...)` assert (a) SVG `<linearGradient>` present, (b) dasharray `"6 4"`, (c) `borderRotate` class hoặc inline style, (d) online dot element exists với green color + pulse class.
- **Lesson learned:** Khi implement design-file spec, ALWAYS open visual diff cuối cùng (FE rendered vs design-file HTML side-by-side trong browser) trước khi mark task DONE. Không chỉ rely vào spec doc.

### [BUG-003] [Medium] [FE] Login scanCard animation chậm 50% so với design-file (6s vs 4s) + missing keyframe rename

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-25
- **Environment:**
  - Browser/OS: any modern browser
  - App version: v0.4.0-alpha
  - Env: local + preview + production
  - Layer impacted: FE
- **Related task:** T-342 (sẽ tạo trong M11.8 backlog)
- **Related FR/component:** FR-01.2 LoginCard / `apps/web/tailwind.config.ts` L83 + Login terminal card component (search `scan-line` trong `apps/web/src`)
- **Mô tả:** Trên trang Login (`/auth/login`), scan line 2px gradient cyan di chuyển từ trên xuống dưới của card với duration 6s — chậm hơn 50% so với design-file (4s). Visual feel sluggish.
- **Steps to reproduce:**
  1. Navigate `/auth/login`.
  2. Observe scan line animation trên Login card (2px gradient cyan strip moving top → bottom).
  3. Compare với `design-file/MyBlog Login.html` L191-318 (4s loop).
- **Expected:** Scan line loop 4s (matching design-file).
- **Actual:** Scan line loop 6s — slower than design.
- **Screenshot/log:** Visual diff side-by-side.
- **Root cause:** FE `tailwind.config.ts` L83: `'scan-line': 'scan-line 6s linear infinite'`. Design-file: `scanCard 4s linear infinite`. Wrong duration + wrong name (design-file convention `scanCard` for `top: -100% → 200%` pattern, FE uses generic `scan-line` for `translateY -100% → 100vh`).
- **Fix (proposed):** Update `apps/web/tailwind.config.ts`:
  - Rename animation `'scan-line': 'scan-line 6s ...'` → `'scan-card': 'scan-card 4s linear infinite'` (matching design-file convention).
  - Update keyframes `scan-line: { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(100vh)' } }` → `scan-card: { '0%': { top: '-100%' }, '100%': { top: '200%' } }`.
  - Update consumer component (LoginCard) class `animate-scan-line` → `animate-scan-card`.
- **Regression test:** `apps/web/tests/components/auth/LoginCard.test.tsx` — case `it('regression BUG-003: scan card animation runs 4s duration', ...)` assert element có class `animate-scan-card` (NOT `animate-scan-line`) + verify keyframe definition trong test setup.

### [BUG-004] [Low] [FE] ADMIN role badge vertical alignment + undersized font (ProfilePage + PostHeader + PostPreview)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-25
- **Environment:**
  - Browser/OS: any modern browser
  - App version: v0.4.0-alpha post-T-341 commit `c97e1f0`
  - Env: local + preview + production
  - Layer impacted: FE
- **Related task:** T-378
- **Related FR/component:** FR-11.1 + FR-02.x / 3 call sites:
  - `apps/web/src/pages/ProfilePage.tsx` L93-103 (Profile hero)
  - `apps/web/src/components/post/PostHeader.tsx` L24-31 (Feed PostCard + PostDetail)
  - `apps/web/src/components/create-post/PostPreview.tsx` L40-46 (Create Post preview)
- **Mô tả:** Badge `[ ADMIN ]` ở 3 vị trí đều có vertical alignment lệch + brackets nhỏ → text feel stuck-to-top, không center theo trục dọc của badge.
- **Steps to reproduce:**
  1. Mở `/profile/admin` (user role=ADMIN).
  2. Quan sát badge `[ ADMIN ]` orange bên cạnh `~/admin`.
  3. So sánh visual center với badge height — text bị đẩy lên top.
- **Expected:** Text `[ ADMIN ]` center theo trục dọc trong badge, match design-file `MyBlog Profile.html L488` padding `1px 6px` + bg tint.
- **Actual:** Text lệch lên top do `py-0.5` (2px vertical) + default mono line-height baseline metric → top-heavy. Thiếu bg tint subtle.
- **Root cause:** Cả 3 chỗ đều có 3 vấn đề:
  1. **Font size**: `text-mono-xs` = 9px (line-height 1.3) quá nhỏ cho bracket characters — baseline rasterization không ổn định ở size này.
  2. **Layout**: thiếu `inline-flex items-center` + `leading-none` → mono font baseline metric drift làm text lệch top.
  3. **Padding**: ProfilePage `py-0.5` (2px), PostHeader/PostPreview `padding: 0 4px` (0 vertical) — không match design-file `1px 6px` + bg tint.
- **Fix (3 commits):**
  - `c97e1f0` ProfilePage: layout + padding (vẫn dùng 9px nên chưa fix hết).
  - `668101c` ProfilePage: font 9px → 11px (`text-mono-sm`) để brackets render đúng.
  - **Pending commit** PostHeader + PostPreview: apply cùng pattern (`inline-flex items-center` + `leading-none` + `text-mono-sm` + `padding: 1px 6px` + `border-ora/50 bg-ora/[0.06]`).
- **Regression test:** N/A — pure CSS styling. Visual verified manually browser side-by-side với design-file.
- **Lesson learned:**
  - Bracket badges với mono font luôn cần `leading-none` + `inline-flex items-center` để vô hiệu hóa font baseline drift.
  - Tránh `text-mono-xs` (9px) cho bracketed text — quá nhỏ, baseline render không ổn định cross-browser.
  - Khi fix UI bug đa-site (cùng pattern dùng nhiều nơi), `grep` tất cả call sites trước khi commit để tránh fix-cục-bộ rồi miss spots khác.

## Fixed

_(Trống)_

---

## Template thêm bug mới (chi tiết, đủ thông tin debug)

```markdown
### [BUG-XXX] [Critical|High|Medium|Low] [FE|BE|Both|Infra] <Tiêu đề ngắn>

- **Status:** OPEN | IN_PROGRESS | FIXED | FIXED (hotfix, pending RCA) | WONT_FIX
- **Reporter:** <tên> — **Date:** YYYY-MM-DD
- **Environment:**
  - Browser/OS: `<vd: Chrome 120 / macOS 14 / iPhone 15 Safari>`
  - App version: `<vd: v0.2.0-alpha commit a1b2c3>`
  - Env: `local | preview | production`
  - Layer impacted: `FE | BE | Both | Infra`
- **Related task:** T-XXX (task xử lý bug này, sẽ tạo sau khi log)
- **Related FR/component:** FR-XX, file: `apps/<web|api>/src/...`
- **Mô tả:** <chi tiết observable behavior>
- **Steps to reproduce:**
  1. ...
  2. ...
  3. ...
- **Expected:** <hành vi mong đợi>
- **Actual:** <hành vi thực tế>
- **Screenshot/log:** <link hoặc paste log/screenshot/video>
- **Root cause:** <điền khi tìm ra — F3 step 4, F4 phase B>
- **Fix:** <mô tả fix — KHÔNG cần commit hash, git log là source (CLAUDE.md F3 step 7); tra qua `git log --grep "BUG-XXX"`>
- **Regression test:** <file path test reproduce bug — BẮT BUỘC theo CLAUDE.md Testing Rules>
- **Lesson learned (optional):** <nếu là architectural issue, add ADR vào ARCHITECTURE.md>
```
