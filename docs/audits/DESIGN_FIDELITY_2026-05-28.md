# Design Fidelity Audit — 2026-05-28 (code-level diff)

> Method: đọc source `design-file/*.html|*.jsx` vs FE `apps/web/src` (component + token), diff 4 bucket (typography / components / animations / colors). KHÔNG dùng screenshot — capture được cả animation/hover/transition. Token-vs-rawhex khi giá trị khớp KHÔNG tính drift.
>
> Scope: 10 screen + 1 shared cluster. Severity: **Critical** = missing/extra component, sai animation/màu/glow, cỡ ≥4px hoặc ≥200 weight. **Minor** = 1-3px, 100 weight, opacity ≤0.1, blur ±2px.

## Summary

| Screen        | Critical | Minor  | Note                                                                            |
| ------------- | -------- | ------ | ------------------------------------------------------------------------------- |
| Feed          | 2        | 7      | fadeUp timing 300→200ms, glow brighter                                          |
| Post Detail   | 1        | 8      | SaveButton extra (intentional FR-04) + related-posts stub (M11 defer)           |
| Create Post   | 5        | 8      | EmojiPicker chưa wire, AI suggest absent (T-346/347), upload pulse animation    |
| Admin         | 1        | 4      | StatCard thiếu hover glow                                                       |
| Login         | 0        | 2      | ~100% match — chỉ cursor blink + shake timing lệch nhẹ                          |
| Profile       | 3        | 4      | hero name display, heatmap legend, PostMiniCard hover ::before glow             |
| Search        | 2        | 4      | ResultCard accent **blue thay vì cyan** + thiếu fadeUp stagger                  |
| Tags          | 3        | 9      | TagCard accent mất gradient, modal shadow generic, dynamic color glow chưa impl |
| Notifications | 7        | 11     | active tab **blue thay vì cyan**, avatar mất gradient, thiếu glow               |
| Manage Posts  | 3        | 9      | checkbox column thêm (intentional FR-15 bulk), card thiếu hover glow            |
| Shared Layout | 1        | 9      | mark-all-read **green thay vì cyan**, dropdown shadow generic                   |
| **TOTAL**     | **28**   | **75** |                                                                                 |

## ⚠️ Cross-cutting systemic themes (fix 1 lần → tác động nhiều screen)

Các drift dưới đây lặp lại ≥3 screen — fix ở foundation/shared sẽ giải quyết nhiều dòng catalog cùng lúc. **Ưu tiên các theme này trước per-screen fix.**

### THEME-1 (Critical): Cyan `#00FFE5` bị thay bằng Blue `#7DCFFF` ở active/accent state

- **Search** ResultCard hover accent gradient: `rgba(125,207,255,.3)` (blue) — design `rgba(0,255,229,.3)` (cyan). File [ResultCard.tsx](../../apps/web/src/components/search/ResultCard.tsx).
- **Notifications** active tab bg + border + count badge dùng `--blu` — design cyan. File [NotificationsPage.tsx](../../apps/web/src/pages/notifications/NotificationsPage.tsx).
- Nguy cơ lặp ở mọi chỗ dùng `--blu` cho "active/selected" thay vì `--cyan`. Cần grep toàn bộ `text-blu`/`border-blu`/`bg-blu` ở active state.

### THEME-2 (Minor→Critical theo tần suất): Mono font 1-2px nhỏ hơn design

- Token: `text-mono-sm` = **11px**, nhưng design dùng **12px** (label/timestamp/tab) và **13px** (breadcrumb/comment/recent-search/table cell) ở nhiều chỗ.
- FE default `text-mono-sm` cho gần hết → systemic −1 đến −2px. Token `mono` (12px) + `mono-md` (13px) ĐÃ TỒN TẠI nhưng component không dùng.
- Xuất hiện: Feed (username 14→11, timestamp 12→11), Post Detail (breadcrumb 13→11, comment 15→13), Tags (desc 13→11), Notifications (tab 12→11, search 13→11, action btn 11→9), Shared (mark-all 10→11, tab count).
- → Cần audit từng element: design size nào, map đúng token (`mono-sm`/`mono`/`mono-md`).

### THEME-3 (Critical): Thiếu cyan glow box-shadow trên hover/focus

- **Card hover glow** thiếu ở: Admin StatCard (`0 0 20px rgba(0,255,229,.06)`), Tags TagCard (`0 0 18-20px ${color}10`), Manage Posts PostCardMng (`0 0 18px rgba(0,255,229,.08)`). PostCard (Feed) có rồi → dùng làm reference.
- **Focus glow** thiếu ở: Tags search/modal input, Notifications search (`0 0 14px rgba(0,255,229,.22)`), Manage Posts inputs. Token `shadow-glow-cyan-sm/md` tồn tại nhưng chưa apply.
- **Modal shadow generic**: Tags TagModal + Manage Posts QuickEditModal + Shared NotificationBell/CommandPalette dùng `shadow-xl` thay vì design `0 0 30-50px rgba(0,255,229,.08-.1) + drop`. Cần shadow recipe mới (`shadow-glow-cyan-modal`?).

### THEME-4 (Minor): fade-up animation timing + stagger

- Design dùng `.25s` (250ms) cho card/row fadeUp; FE default `animate-fade-up` = **200ms**. Lệch 50ms nhất quán (Feed, Tags, Notifications, Manage Posts).
- **Search ResultCard thiếu hẳn fadeUp stagger** (design có `animationDelay` cascade 50ms/card) — Critical vì missing entirely.
- Tags/Manage Posts stagger dùng 60ms/item — design 20-30ms.

### THEME-5 (Minor): Dynamic per-color glow chưa implement

- Design nhiều chỗ glow theo `${tag.color}` / `${cfg.color}` (TagCard accent gradient, progress bar `0 0 4px ${color}80`, avatar gradient). FE hardcode cyan hoặc bỏ. Tailwind không interpolate dynamic color → cần inline style.

---

## Per-screen detail

### Feed

**Typography**: username 14→11px, timestamp 12→11, [ADMIN] badge 10→11, filter label 12→11, mood label 10→11 (tất cả Minor, do THEME-2). Content body + code block ✓ match.
**Components**: PostCard fadeUp 300→200ms (THEME-4). Reaction/ImageGrid/divider ✓.
**Animations**: PostCard hover ✓ (reference tốt). ReactionPicker ✓.
**Colors**: PostCard hover glow `24px/.1` → FE `45px/.12` (brighter, Minor). Code block border-left opacity .4→.5 (Minor). Còn lại ✓.
**→ 2 Critical · 7 Minor**. Hầu hết Minor typography. Feed gần đạt.

### Post Detail

**Typography**: body 16→15, comment 15→13, breadcrumb 13→11, timestamp 12→11, meta labels 12→11 (Minor, THEME-2).
**Components**: ⚠️ SaveButton chèn giữa action bar — **intentional** (FR-04, không phải drift thật). Related posts = stub "coming soon M11" (M11 defer, không phải drift). FileAttachments extra (design không có nhưng là feature thật).
**Animations**: ✓ tất cả match (reaction, pulse, carousel blur).
**Colors**: avatar glow 12→10px blur, focus glow .22→.18 alpha (Minor).
**→ 1 Critical (related posts stub — defer M11) · 8 Minor**. Thực chất gần đạt nếu loại các "intentional".

### Create Post

**Typography**: placeholder text khác, mood label font Inter thay vì Space Grotesk (Minor).
**Components**: ❌ **EmojiPicker button (🙂) chưa wire vào toolbar** (component tồn tại). ❌ **AI Suggest modal absent** — đây là **T-346/T-347 chưa làm** (không phải drift, là backlog). Text-color button thiếu `▾` dropdown cue. UploadZone thiếu dashedPulse animation.
**Animations**: upload pulse missing, color picker scale 1.15→1.1, modal fade thiếu ở vài chỗ.
**Colors**: mood active glow 14→12px/.50→.40, publish button thiếu glow (dùng bg tint).
**→ 5 Critical (2 trong đó là AI backlog T-346/347)** · 8 Minor. Loại AI → 3 Critical thật: EmojiPicker wire, upload pulse, publish glow.

### Admin

**Typography**: stat label 10→11 (Minor).
**Components**: ✓ tất cả (StatCard, Sparkline, MoodBar, ActivityLog, UsersTable).
**Animations**: liveDot ✓. StatCard thiếu hover border+glow.
**Colors**: ❌ StatCard thiếu hover glow `0 0 20px rgba(0,255,229,.06)` (THEME-3). Stat colors ✓.
**→ 1 Critical · 4 Minor**. Chỉ cần thêm StatCard hover glow.

### Login

**Typography**: input 15→14 (Minor).
**Components**: ✓ tất cả present, exact match (card/form/footer/links).
**Animations**: scan-card ✓ exact (4s). cursor blink 530ms→1.06s (Minor), shake 400→450ms (Minor).
**Colors**: ✓ 100% — mọi hex/glow/shadow khớp.
**→ 0 Critical · 2 Minor**. **Login đạt ~100%**, dùng làm reference chuẩn fidelity.

### Profile

**Typography**: ⚠️ hero hiển thị `~/username` thay vì full name + thiếu "born year" meta — **cần xác nhận intent** (design dùng placeholder "Trần Tuấn Kha"; FE dùng username thật — có thể đúng). Stat labels uppercase→lowercase (Minor).
**Components**: ❌ **Heatmap legend row (less/màu scale/more) missing**. PostMiniCard hover thiếu `::before` top-edge glow. EditDrawer 480→420px.
**Animations**: glitch ✓ (8s), borderRotate ✓, slideIn ✓. PostMiniCard hover ::before glow missing (Critical).
**Colors**: hero gradient ✓, avatar glow ✓, heatmap colors ✓. PostMiniCard hover shadow thiếu.
**→ 3 Critical · 4 Minor**. Trong đó hero-name có thể là intentional (cần user confirm).

### Search

**Typography**: recent-search item 13→11px (Minor, THEME-2). Empty circle ◎ color #2A3548→#566176 (Minor).
**Components**: ✓ accent/post-id/clear/⌘K badge/divider. Sidebar stats = extra desktop feature (không drift).
**Animations**: ❌ **ResultCard fadeUp stagger missing hẳn** (THEME-4). Mood button glow 2.2× sáng hơn (`30`→`66` opacity).
**Colors**: ❌ **ResultCard hover accent dùng blue `#7DCFFF` thay cyan `#00FFE5`** (THEME-1). Mood active tint `12`→`1A` + glow `30`→`66` (sáng hơn).
**→ 2 Critical · 4 Minor**. Cả 2 Critical đều là systemic theme (THEME-1 + THEME-4) — vừa rewrite hôm nay.

### Tags

**Typography**: sub-bar 12→11, tag name 16→14, stat 22→28 (FE bự hơn!), modal title 12→11, desc 13→11 (Minor).
**Components**: ✓ grid/search/sort/toggle/modal/color-picker. Progress bar thiếu glow shadow.
**Animations**: card fadeUp 250→200, stagger 30→60ms, modal 200→150ms (Minor).
**Colors**: ❌ **TagCard top accent mất gradient** (solid color thay vì `linear-gradient(90deg,transparent,${color}60,transparent)`). ❌ **Modal shadow generic `shadow-xl`** thay design cyan glow (THEME-3). Dynamic tag-color glow chưa impl (THEME-5). Tag name glow `50`→`80` opacity.
**→ 3 Critical · 9 Minor**.

### Notifications

**Typography**: tab 12→11, snippet color tm→td, action btn 11→9px, search 13→11 (Minor/Critical theo THEME-2).
**Components**: checkbox radius 3→2px, group header solid→blur, bulk bar layout khác. Toast position cần verify.
**Animations**: row fadeUp 250→200. ❌ tab active glow missing. ❌ search focus glow missing (THEME-3).
**Colors**: ❌ **active tab blue thay cyan** (THEME-1, 3 dòng: bg+border+badge). ❌ **avatar mất gradient** (design `linear-gradient(135deg,#00FFE520,#BB9AF720)` → FE solid `--elev`). unread tint `06`→`0f`.
**→ 7 Critical · 11 Minor**. Nhiều nhất — chủ yếu THEME-1 (cyan/blue) + THEME-3 (glow) + avatar gradient.

### Manage Posts

**Typography**: mono 12→11, table header 11→10 (Minor).
**Components**: ⚠️ checkbox column + bulk bar = **intentional FR-15** (không drift). Card action text labels vs icon-only (Minor). View button bỏ (Minor).
**Animations**: fadeUp 250→200, modal 200→150 (Minor). ❌ Card hover glow missing (THEME-3).
**Colors**: ❌ PostCardMng hover thiếu cyan glow+border (THEME-3). Modal shadow generic (THEME-3). Input focus glow missing.
**→ 3 Critical · 9 Minor**. Critical đều là THEME-3 (glow) — checkbox "Critical" là intentional FR-15.

### Shared Layout (TopBar / StatusBar / SubBar / AvatarMenu / CommandPalette / NotificationBell / Toast)

**Typography**: mark-all 10→11, tab count off 1px (Minor).
**Components**: NotificationBell 380→360px, CommandPalette 540→560px (Minor). ❌ **mark-all-read button GREEN `text-grn` thay vì cyan** (verified [NotificationBell.tsx:160](../../apps/web/src/components/layout/NotificationBell.tsx#L160)).
**Animations**: fade timing 150→200ms, blur 6→8px. Notif item hover color-aware → static (Minor).
**Colors**: NotificationBell shadow generic `shadow-xl` thay cyan glow (THEME-3). Tab active thiếu bg tint.
**→ 1 Critical · 9 Minor**. Critical = mark-all green→cyan.

---

## Recommended fix priority (next phase)

Loại bỏ "intentional / backlog" khỏi Critical count:

- Post Detail related-posts → M11 defer (không fix giờ)
- Create Post AI suggest → T-346/T-347 (đã có task)
- Post Detail SaveButton + Manage Posts checkbox → intentional FR-04/FR-15
- Profile hero name → cần user confirm

**Critical thật cần fix ≈ 20**, gom theo theme:

| Wave   | Theme/Task                                                                                                                                                                                                   | Screens ảnh hưởng                                | Est. |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ---- |
| **W1** | THEME-1: cyan-vs-blue active states                                                                                                                                                                          | Search, Notifications (+ grep toàn bộ)           | 1-2h |
| **W2** | THEME-3: cyan glow shadow hover/focus + modal shadow recipe                                                                                                                                                  | Admin, Tags, Manage Posts, Notifications, Shared | 2-3h |
| **W3** | THEME-2: mono font size mapping (11→12/13px đúng chỗ)                                                                                                                                                        | All screens                                      | 2-3h |
| **W4** | THEME-4: fadeUp 200→250ms + Search stagger + stagger timing                                                                                                                                                  | Feed, Search, Tags, Notifications, Manage Posts  | 1-2h |
| **W5** | Per-screen riêng: Notifications avatar gradient, Tags accent gradient + dynamic glow, Profile heatmap legend + PostMiniCard ::before, Create Post EmojiPicker wire + upload pulse, Login cursor/shake timing | từng screen                                      | 3-4h |
| **W6** | THEME-5 + minor cleanup (opacity/blur deltas)                                                                                                                                                                | scattered                                        | 1-2h |

**Tổng est. ≈ 10-16h** cho 100% Critical + phần lớn Minor.

## User decisions (2026-05-28)

1. **Profile hero name** → ĐỔI thành **full name** theo design (không giữ `~/username`). Cần verify Profile data có field `name`/`fullName`; nếu BE chưa có → thêm field (có thể spawn task BE con).
2. **Minor typography 1px** → **FIX TRIỆT ĐỂ** toàn bộ (kể cả Login input 14→15px). THEME-2 nâng từ "Minor" lên scope bắt buộc.

## Next steps

1. ✅ Decisions confirmed (trên).
2. Mở task `T-39X` theo Wave (6 task) — execute qua `myblog-task-implement`, mỗi task có regression test.
3. Sau 100% Critical → setup Playwright `toHaveScreenshot()` baseline chống drift tương lai (T-40X).
