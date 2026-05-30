# Progress Tracker

## Trạng thái tổng: 🟢 Implementation Phase (75% — 15/20)

## Milestone

| #      | Milestone                                                                                                                            | Trạng thái            | Ngày target |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ----------- |
| M1     | Setup SDD docs v2 (cyberpunk + monorepo stack)                                                                                       | ✅ Done               | 2026-05-17  |
| M2     | Monorepo scaffold (Turborepo + Docker + apps skeleton)                                                                               | ✅ Done               | 2026-05-17  |
| M3     | Backend NestJS — Auth (JWT) + Users + Prisma schema                                                                                  | ✅ Done               | 2026-05-17  |
| M4     | Backend — Posts + Files (Cloudinary signed upload) + Tags                                                                            | ✅ Done               | 2026-05-18  |
| M5     | Backend — Comments + Likes + CommentLikes + Saved                                                                                    | ✅ Done               | 2026-05-18  |
| M6     | Backend — Admin endpoints (stats, users, moderation) + WebSocket gateway                                                             | ✅ Done (partial 2/4) | 2026-05-18  |
| M7     | Frontend — Layout (TopBar, StatusBar, CommandPalette)                                                                                | ✅ Done               | 2026-05-18  |
| M8     | Frontend — Feed + Post Detail (ImageCarousel + file download)                                                                        | ✅ Done               | 2026-05-18  |
| M9     | Frontend — Create Post + Admin Dashboard                                                                                             | ✅ Done               | 2026-05-18  |
| M10    | Frontend — Login + auth flow + protected routes                                                                                      | ✅ Done               | 2026-05-18  |
| M11    | Real-time integration (Socket.io client + activity log + live visitors)                                                              | ⬜ Todo               |             |
| M11.5  | Tags / Profile / Search / Create Post enhance                                                                                        | ✅ Done               | 2026-05-19  |
| M11.6  | Activity Log (user-scope timeline) — F2 spec + F1 BE/FE                                                                              | ✅ Done               | 2026-05-19  |
| M12    | Testing — unit (FE Vitest + BE Jest) + integration (Supertest) + E2E (Playwright)                                                    | ✅ Done               | 2026-05-18  |
| M13    | Deploy — Vercel FE + Fly.io BE + Neon DB + CI/CD GitHub Actions                                                                      | ⬜ Todo               |             |
| M14    | Monitoring + observability (Sentry + Fly metrics + alert rules)                                                                      | ⬜ Todo               |             |
| M11.7  | Design v2 — Notifications + Admin Manage Posts + Multi-Reactions (FR-14/15/16)                                                       | 🟡 Doing              | 2026-06-05  |
| M11.8  | design-file 2026-05-24 sync + 5 FR amendments + 3 bug fixes (FR-17 AI / FR-03.6 reply / FR-04.7 modal / FR-12 search / FR-14 notifs) | 🟡 Doing              | 2026-06-12  |
| M11.9  | Design-file phase 2 polish — components + token system + page rewrites (18 tasks T-360→T-377; SUPERSEDES M11.7 T-321/322/323)        | ✅ Done               | 2026-05-26  |
| M11.10 | Design fidelity 100% sweep — code-level audit + 6 fix wave + EmojiPicker (T-390→T-397)                                               | ✅ Done               | 2026-05-29  |

## Tỉ lệ hoàn thành: 75% (15/20 milestone)

> ⬜ Todo | 🟡 Doing | ✅ Done | 🔴 Blocked

---

## Weekly Log

### 2026-05-28 (M11.10 Design fidelity sweep)

- **Done (audit — DESIGN_FIDELITY_2026-05-28.md):** Code-level diff design-file vs FE toàn 11 screen (4 bucket: typography/components/animations/colors). ~20 Critical thật + 75 Minor. 5 systemic theme: THEME-1 cyan-vs-blue, THEME-2 mono font 1-2px nhỏ, THEME-3 thiếu cyan glow shadow, THEME-4 fadeUp timing/stagger, THEME-5 dynamic per-color glow. Login ~100% match (reference). Notifications nặng nhất (7 Critical). Mở 7 task M11.10: T-390→T-395 (6 wave) + T-396 re-audit verification. User decisions: Profile hero → full name; Minor typography → fix triệt để.
- **Done (T-390 Wave 1 — THEME-1 cyan-vs-blue):** Fix 5 site dùng blue `rgba(125,207,255)` sai ở active/selected/accent → cyan `rgba(0,255,229)`: ResultCard accent gradient, NotificationsPage active tab (bg+border+badge), NotifRowBell avatar gradient, NotifRowPage selected bgTint, NotificationBell open glow. text-blu links giữ intentional. grep confirm 0 remaining. 40/40 affected tests pass.
- **Done (T-391 Wave 2 — THEME-3 cyan glow shadows + modal recipe):** 3 token mới (`glow-cyan-modal/panel/input`). StatCard + PostCardMng thêm hover cyan glow + border-cyan. Focus glow cho Notifications + Tags search (`glow-cyan-input`). Modal shadow TagModal + QuickEditModal → `glow-cyan-modal` + border-cyan/25, NotificationBell → `glow-cyan-panel`. CommandPalette đã có inline cyan glow (skip). TagCard dynamic per-color glow defer T-394. DESIGN_SYSTEM shadow table updated. 57/57 affected tests pass; full FE 432/435 (3 pre-existing ManagePostsPage).
- **Done (T-392 Wave 3 — THEME-2 mono font normalize):** Option A token-based (user chọn giữ token scale, không pixel-exact raw px). Verify: phần lớn THEME-2 là 1px token-noise + design-file tự inconsistent (username 11/12/14px khác screen). Fix 2 high-confidence: PostHeader username 11→12px (`text-mono`), Login inputs 14→15px (`text-[15px]`). Accepted-noise: timestamp 10px, badge 10px (T-378 intentional), comment 13px mono vs 15px Inter (aesthetic). 432/435 FE pass.
- **Done (T-393 Wave 4 — THEME-4 fadeUp timing + stagger):** Verify design duration: Feed card `.3s`, TagCard `.25s`+stagger`i*20`, Search ResultCard `.2s`+cascade (FE thiếu hẳn). Fix: Search ResultCard thêm `animate-fade-up` + `index` prop stagger 50ms/card; TagCard → `animate-fade-up-md` (250ms) + stagger 60→20ms; Feed PostCard → `animate-fade-up-md`. Notifications/ManagePosts rows không có entry animation (audit over-stated) — defer (risk jank infinite-scroll). 432/435 FE pass.
- **Done (T-394 Wave 5 — per-screen specific):** 6/7 nhóm. NotifRowPage avatar cyan/pur gradient + text cyan; Login cursor 1.06s→530ms + shake .45→.4s; TagCard accent gradient + per-color hover glow + progress bar glow; HeatmapGrid legend row; PostMiniCard ::before cyan top-edge glow + hover shadow; ProfilePage hero `~/username`→`{name||username}` (FE-only, field sẵn); NotificationBell mark-all `text-grn`→cyan; UploadZone `animate-dashed-pulse` keyframe; CreatePost publish button cyan glow. EmojiPicker wire DEFER → T-397 (feature). ProfilePage test stale-assumption update. 432/435 FE pass.
- **Done (T-395 Wave 6 — minor cleanup):** 6 delta cuối. PostCard hover glow 45px/.12→24px/.1 (arbitrary, token shared); Search mood tint 1A→12 + glow 66→30 (giảm 2× sáng); NotifBell 360→380px; CommandPalette 560→540px; NotifRowPage checkbox rounded-sm→rounded-[3px] + border-[1.5px] + unread tint 0f→06; code block border opacity .5→.4. 432/435 FE pass. **M11.10 fix waves W1-W6 hoàn tất — chờ T-396 re-audit verify.**
- **Done (T-397 — EmojiPicker wire):** Wire EmojiPicker (T-366 component sẵn) vào RichTextEditor toolbar: 🙂 button + showEmoji state + insertEmoji (insertHTML qua execCommand, contentEditable). 5 test mới (present/open/close/select-insert/mutual-exclusion). 14/14 RTE pass; 437/440 FE. Closes Create Post audit gap "EmojiPicker chưa wire". M11.10 chỉ còn T-396 re-audit.
- **Done (T-409 — EditProfileDrawer 1:1 design-file sync, BUG-009):** User feedback "phần setting này cũng đang khác khá nhiều so với design file" + screenshot drawer. Audit `EditProfileDrawer.tsx` (T-376 greenfield 2026-05-26) vs `design-file/MyBlog Profile.html` L347-439 + L57-60 → **7 visual drift** (width 420 vs 480, header missing subline `~/settings/profile`, `×` close bordered vs plain 24px, labels natural case vs UPPERCASE 11px tracking, input 11px+py-1.5+rounded-sm vs 14px+py-2+rounded-md, Save button outline vs filled solid cyan + glow, Cancel missing bg-elev). Rewrite 1:1 spec — drawer max-w-[480px] + border-cyan/20 + shadow; header 2-line (title cyan + subline td); × plain inline 24px; Field component thêm `uppercase tracking-[0.05em] text-[11px]`; inputCls → `text-[14px] py-2 rounded-md`; Save → `bg-cyan text-[#0A0E1A] font-semibold + shadow 14px glow`; Cancel → `bg-elev px-5 py-2`. **Security exception per user**: giữ 3 password fields (Current+New+Confirm) vs design 2 — BE require currentPassword. **Deferred**: Avatar upload section (design L378-385) → F2 amend FR-11 task riêng (T-410+) vì cần BE endpoint `PATCH /users/:id/avatar` + Cloudinary + FR amendment. Regression test thêm 2 case BUG-009 (header 2-line + Save filled cyan + Field label uppercase tracking). 11/11 EditProfileDrawer + 10/10 ProfilePage pass. **Lesson lần 3 cùng pattern** (T-406 → BUG-008 → BUG-009): cần bump rule "grep design-file source CSS trước khi style" vào CLAUDE.md Pre-flight Checklist sau khi audit M11.10 wrap up.
- **Done (T-408 — PostMiniCard 1:1 design-file sync, BUG-008):** User feedback "phần card trong profile hiện tại tôi vẫn chưa thấy giống design" + screenshot design card. Audit `PostMiniCard.tsx` (T-375 greenfield 2026-05-26) vs `design-file/MyBlog Profile.html` L52-55 + L292-344 → **8 visual drift** (tags plain vs pill chip, read → no border vs bordered cyan pill, mood không right-align, action gap 12 vs 2px, like/💬 buttons missing padding, content 14 vs 15px, thumb radius 2 vs 4px, header mb 8 vs 10px). Rewrite 1:1 spec — tag span thêm bg/border per color, read link `border-cyan/25 px-2 py-1`, mood `ml-auto`, action `gap-0.5`, buttons `px-2 py-1 rounded`, content `text-[15px]`, thumb `rounded`. Regression test BUG-008 assert tag pill bg+border + read link border-cyan class. 5/5 PostMiniCard + 10/10 ProfilePage pass; 448/451 FE (3 fail pre-existing ManagePostsPage env). **Lesson re-confirm T-406**: BẮT BUỘC grep `design-file/*.html` source CSS trước khi styling component — DESIGN_SYSTEM mô tả high-level không thay được pixel-level source.
- **Done (T-396 — Re-audit verification):** Re-verify code-level toàn 11 screen qua grep — confirm 15+ fix W1-W6 + T-397 đều present (0 blue rgba, 3 glow token, hover/focus/modal shadow, font, anim stagger, per-screen items, EmojiPicker). 437/440 FE pass (3 pre-existing ManagePostsPage). Catalog `DESIGN_FIDELITY_2026-05-28.md` thêm section "✅ Verification RESOLVED" (bảng Fixed per theme + commit + accepted-noise/defer list). **Kết luận: 0 Critical còn lại — UI đạt chuẩn design-file v2** (trừ defer/backlog có task riêng). **🎯 M11.10 Design Fidelity HOÀN TẤT (T-390→T-397, 8 task).** Khuyến nghị next: T-40X Playwright `toHaveScreenshot()` baseline chống drift tương lai.
- **Done (T-400 — Search page design-file 1:1 sweep):** User screenshot design Search nói "khác rất nhiều". Audit phát hiện 14 drift, 8 HIGH (cấu trúc). BE check: `GET /search` đã trả đủ PostView → **no BE change**, pure FE F1. `ResultCard.tsx` rewrite (67→139 lines): avatar 26 inline + ADMIN + timestamp + mood right-aligned + tags inline + files badge + engagement stats. `SearchPage.tsx`: mood emoji 15→14px + rounded-[5px], reset "× reset"→"reset ×", Recent plain text→chip-pill `↺`, Browse tags TagPill→custom chip + postCount, empty-state max-w-[820px]. 8 test mới (ResultCard 6 + SearchPage 2). 445/448 FE pass.
- **Done (T-407 — NotificationBell dropdown design refactor):** User screenshot notification popup. 4 nhóm: header 2-dòng (title + N unread · M total), tab pill style cyan glow active, mark-all-read pill bordered, footer 2-col. NotifRowBell: `@username` prefix (anon `@anon`), `shortVerb` per-reaction subtype (LIKE→liked, LOVE→loved), `● new` right vertical-center. 15/15 notif tests pass. Commit `0958c51`.
- **Done (BUG-007 — SearchPage 2 dấu × clear):** Chrome/Safari native `::-webkit-search-cancel-button` + custom × button trùng → user thấy 2 ×. Fix CSS: `[&::-webkit-search-cancel-button]:appearance-none` ẩn native, giữ custom × (consistent theme + testid). 10/10 SearchPage tests pass. Commit `b7f463d`.
- **Done (T-406 — Profile tabs + buttons refine):** User feedback "filter nhỏ hơn design + button khác". **Initial `f54f9bb` + 3 follow-up iterations** (`0657385`/`a8f85e3`/`4e92643`) sau user phàn nàn vẫn khác → final state đọc `design-file/MyBlog Profile.html` L49-50 + L532 spec 1:1. Tabs: bỏ `hidden` cho Saved/Activity. **TabButtons FINAL**: text-mono-md (13) + py-1.5 px-4 + border-b-2 + **KHÔNG box-shadow** (design không có; iterations đầu tự bịa glow đã revert). Count badge FINAL: bg-elev + border-b2 **FIXED** (không đổi theo active), chỉ text color đổi cyan/td. New Post solid cyan filled glow 14px; Settings đồng kích cỡ. Test stale-assumption: non-self viewer tabs visible. 67/67 affected pass. **Lesson**: BẮT BUỘC đọc design-file `.html` source CSS trước khi code styling — đừng tự bịa glow/opacity.
- **Done (T-405 — Profile hero deco + bio refine):** User feedback "UI phần này chưa giống" sau T-404. Hex deco 3-line `01001101/uid:/pid:` → 4-line cyberpunk pattern `#DEAD-BEEF-XXXX-XXXX / 01101010-10101010 / #ID NNNN.PID NNNN / MID NNNN.MID N` (helper `deco4/decoNum` derive deterministic từ user.id). Bio `text-tm` → `text-ts` sáng hơn. Test stale-assumption update assertion. 10/10 ProfilePage pass.
- **Done (T-404 — ProfilePage design update):** User screenshot 2026-05-29. Hero handle gộp `~/user · title · born year` + meta icons row (location/joined/github/website). 4 StatCard dưới Posts tab (POSTS/LIKES/VIEWS/STREAK + sparkline từ heatmap28d). Sidebar: skills.top `›` prefix, activity.28d title + count, tags.used list rows + post count. Test stale-assumption: `@alice`→`~/alice`, streak format. 10/10 ProfilePage pass.
- **Done (T-403 — Notification snippet trong metadata):** Design Bell popup line 2 (`"snippet..."` quoted muted italic) yêu cầu BE send snippet. BE: `deriveSnippet(text)` helper strip HTML + truncate 80 chars; `CreateNotificationInput` + `metadata.snippet`; 3 trigger site enrich (reactions → post.content, comments COMMENT/REPLY → comment.content). Reactions select thêm `content`. FE: `NotificationMetadata.snippet?` (hand-typed). NotifRowBell render line 2 italic quoted khi present; NotifRowPage thay targetId line bằng snippet với targetId fallback (backward compat). Tests: BE 5 unit `deriveSnippet` + 1 e2e integration (bob react alice → metadata.snippet truncate). FE 2 case render+absent. OpenAPI yaml regen + FE types synced. 55/55 BE e2e affected + 447/450 FE pass.
- **Done (T-399 — FilterBar font-size design-file 1:1):** Tiếp nối T-398 chính sách design-file 1:1. `FilterBar.tsx` mood chips + sort button + dropdown items: `text-mono-sm` (11) → `text-mono` (12) khớp `.flt-btn` design 12px. Header line giữ 11px (đã khớp). 4 className edit. FilterBar 8/8 tests pass.
- **Done (T-398 — Feed font-size design-file 1:1):** User re-check font feed → chốt bám design-file pixel-exact, **đảo quyết định accepted-noise/token-scale của T-392** (sau khi Claude flag conflict). 11 edit qua 6 file (PostHeader 5 + MoodBadge + TagPill + PostCard 4 + ReactionButton + PostContent): author 14px, separator/timestamp/mood/tag 12px, ADMIN badge 10px, divider 11px, action bar/reaction/code 13px; post body 15px giữ. Verify Post Detail design-file dùng cùng giá trị → shared component nhất quán. Component tests 29/29 pass (không assert font class); 3 fail ManagePostsPage pre-existing. DESIGN_SYSTEM Typography note + role-badge mapping updated.

### 2026-05-27 (M11.8 NotifRow polish)

- **Done (T-351 FE SearchPage rewrite):** Full rewrite per design-file v2 (FR-12.8-.12). BigSearchInput: Inter 18 + ❯ search label + ⌘K badge. Filter row: 3 type chips All/Saved/Files (replace 4-chip set) + 7 mood emoji buttons (replace 5) + × reset link. 3 empty-state sections khi q='' no filter (recent.searches / browse.tags / all.posts preview qua /posts limit 10). No-results state với ◎ + grep bash hint + clear button + top 3 try-recent quick buttons. ResultCard: top accent line gradient hover + post-id corner deco + highlight mark `bg-cyan/20` (was /30). Consume new type=saved từ T-381 BE. 8 new test case (hero/Saved chip/HAPPY mood/3 empty/highlight/no-results/reset/recent localStorage). 8/8 pass; 430/433 full FE (3 pre-existing).
- **Done (T-331 close — PostDetail Lightbox wiring):** Audit khẳng định T-355 (2026-05-25) đã cover PostCard + ImageGrid `onImageClick` + ImageLightbox component. Gap: PostDetail dùng ImageCarousel → chưa wire. Fix: ImageCarousel thêm optional `onImageClick` prop + wrap image trong button `cursor-zoom-in` khi cung cấp. PostDetailPage thêm state `lightboxIdx` + render `<ImageLightbox>` conditional. 2 new test case ImageCarousel; 14/14 ImageCarousel+PostDetail pass. T-331 status DONE.
- **Done (T-381 BE Search saved type filter):** Extend `SearchType` enum DTO `'saved'`. `SearchService` branch khi `type=saved`: require authed (anon → 401), `prisma.post.findMany` where `savedBy.some.userId=viewerUserId` + mood/q optional + pagination, trả `files=[]` + `tags=[]`. OpenAPI + FE api.generated.ts + hand-typed `SearchType` synced. 3 new e2e case (authed happy + anon 401 + mood narrow). 12/12 search e2e pass. Unblocks T-351 Saved chip.
- **Done (T-359 FE NotificationBell visual refactor):** Replace 🔔 emoji → inline SVG bell 15×15 (body + clapper 2 paths) per design-file 2026-05-24. Button gain `border 1px --b2` + `bg --elev` + hover state `bg cyan/8 + shadow cyan/20`. Badge ring `1.5px --surf` via inline boxShadow (Tailwind ring không interpolate var-tokens), color `--bg`, threshold đổi `>99 → 9+` (was 99+) chốt theo design. DESIGN_SYSTEM "Code drift" cho NotificationBell flipped RESOLVED. Tests: 4 new T-359 + 1 stale-assumption update. 9/9 NotificationBell tests pass.
- **Done (T-353 FE NotifRow split):** Extract inline `NotificationRow` của `NotificationBell.tsx` thành NEW `NotifRowBell.tsx` match design spec (34×34 avatar / 18×18 badge / 2px border-left / cfg.color tint / 3-line content). Shared TYPE_CFG + verb/emoji/path helpers extracted ra `apps/web/src/lib/notification-format.ts` (đồng bộ giữa Bell + Page). NotifRowPage audited line-by-line vs DESIGN_SYSTEM spec — đạt full; refactor để reuse `NOTIF_TYPE_CFG` từ lib (xóa duplicate). Doc sync: FR-14.13 + DESIGN_SYSTEM NotifRowBell section updated từ 4 legacy types (`like/comment/share/save`) → 4 real types (`REACTION/COMMENT/REPLY/SHARE`) — đồng bộ với `NotificationType` enum + actual BE data. Tests: 2 new test files (`NotifRowBell.test.tsx` + `NotifRowPage.test.tsx`) 12 case total; existing `NotificationBell.test.tsx` tab-switch assertion updated (test-stale-assumption — row text split spans, emoji moved to badge). 18/18 notif tests pass; full FE regression: 423/426 pass (3 pre-existing failures in ManagePostsPage.test.tsx — unrelated, confirmed by stash-and-rerun on main).

### 2026-05-26 (UI Design Fidelity Review)

- **Done (T-352 FE NotificationsPage rewrite):** NEW `NotificationsPage.tsx` + `NotifRowPage.tsx` route `/notifications`. SubBar + 6 type tabs + search 150ms debounce + bulk action bar + 2 empty states + group-time labels + toast. `useInfiniteNotifications` + `useBulkDeleteNotifications` hooks. 11/11 tests pass. `useMemo` allItems fix. T-314 scope covered by this rewrite.
- **Done (T-345 BE Notifications bulk endpoints):** `PATCH /notifications/bulk-read` + `DELETE /notifications/all` — 2 service methods + 2 controller routes + `BulkMarkReadDto`. FE: 2 service functions + 2 mutation hooks (`useBulkMarkRead` + `useDeleteAllNotifications`). OpenAPI regenerated + FE types synced. 6 new e2e cases, 209/209 BE e2e pass. Unblocks T-352.
- **🎯 M11.9 COMPLETE (18/18 tasks T-360→T-377 DONE):** Design-file phase 2 polish closed early (target 2026-06-26, achieved 2026-05-26). Token foundation (T-360/361/362), shared component extracts (T-363/364/365/366), Create Post editor stack (T-367/368/369), page rewrites (T-370 Login, T-371 Admin, T-372 Manage Posts greenfield, T-373 Tags, T-374 Profile + T-375 PostMiniCard + T-376 EditProfileDrawer, T-377 ImageCarousel). FE test suite 384/384 pass. Tổng tiến độ 68% → 74% (14/19).
- **Done (docs-only):** UI Design Fidelity Review across **8 implemented screens** (Login / Feed / Post Detail / Profile / Search / Tags / Admin / Create Post). Playwright Chromium 1440×900 render both sides: design HTML prototypes (via local HTTP server :8765 — bypass CORS for external `.jsx`) and FE actual at `:5173` (admin login for `/admin` + `/admin/create`). 16 screenshots saved `/tmp/ui-review-all/<slug>/{design,fe}.png`.
- **Findings:**
  - ✅ **Search** — visual + behavior match design.
  - ⚠️ **6 minor drift** (Login cursor blink, Feed StatusBar segments + Share icon prefix, Post Detail ImageCarousel layout, Profile hero, Tags TagModal NEON, Create Post toolbar 6→11 + AISuggestModal) — all already covered by existing M11.9 backlog tasks (T-370/371/373/374/368/347), no duplicate tasks needed.
  - ❌ **Admin broken** — NEW [BUG-006](docs/BUGS.md) Critical P0 `TypeError: stats.posts.total undefined` blocking entire `/admin` page. Logged + T-380 fix task created.
- **Done (code fix same day):** T-380 fix BUG-006 — root cause confirmed H1 BE/FE contract drift (M11.7 multi-reaction migration renamed BE `likes` → `reactions`, FE consumer + MSW mock vẫn dùng `likes`). Fix: FE rename `likes` → `reactions` 3 sites (admin.ts type + AdminPage.tsx JSX/label + AdminPage.test.tsx MSW mock) + new regression test case. 5/5 AdminPage + 341/341 full FE pass.
- **Done (T-358 ReactionPicker pill → panel refactor):** Container shape `rounded-full` → `rounded-lg`, buttons 36×36 → 40×40, hover `scale-125` → `-translate-y-0.5` + per-color drop-shadow via CSS var, active state retains ReactionIcon glow. Uses T-360 tokens (z-popover + animate-fade-up-xs + shadow-glow-cyan-md). 4 new tests. 361/361 FE pass. **Screenshot UI now matches user's expected design (panel + SVG icons + per-color hover glow).**
- **Done (T-357 ReactionIcon SVG component + REACTION_CONFIG migration):** NEW ReactionIcon component (~110 lines, 6 SVG variants per design-file Feed.html L718-723). REACTION_CONFIG drop `emoji` field, switch colors var(--cyan) → hex literals + realign per design palette (LIKE blu, LOVE mag, WOW pur). Refactor 3 consumers (ReactionButton/ReactionPicker/ReactionList) swap emoji → ReactionIcon. 3 new tests. 357/357 FE pass. Unblocks T-358 pill→panel refactor.
- **Done (T-372 FE ManagePostsPage + QuickEditModal greenfield):** NEW `ManagePostsPage.tsx` route `/admin/posts` — SubBar + Toolbar (search debounce 300ms, status 4-chip, mood 7-emoji, sort, view toggle). List view: 7-col PostRow grid (checkbox + snippet + StatusBadge + mood + tags + counts + actions). Card view: 2-col PostCardMng. Bulk select bar. QuickEditModal 560px (STATUS/MOOD/CONTENT/TAGS). ConfirmDialog destructive with snippet. Toast feedback. Service `admin-posts.ts` + hooks `use-admin-posts.ts` + StatusBadge component. 15/15 tests pass. T-372 DONE (supersedes T-321+T-322+T-323).
- **Done (T-377 FE ImageCarousel Post Detail refresh):** `ImageCarousel.tsx` visual refresh — nav arrows → 44px round frosted-glass (`rgba(10,14,26,.75)` + `backdrop-filter blur(4px)` + border-b2). Active dot → `18×6px rounded-full bg-cyan` + glow `0 0 6px var(--cyan)`. Inactive dot → `6×6px bg-b2`. Counter `N/total` separated from dots, moved to standalone `absolute bottom-right` mono-11 text-td. 9 tests. 9/9 pass.
- **Done (T-376 FE EditProfileDrawer 4-section redesign):** `EditProfileDrawer.tsx` refactored from 2 sections → 4: `// basic.info` (2-col Full name + readonly Handle + Title + Bio), `// contact.links` (2-col Location + Born year + GitHub + Website), `// skills.stack` (SkillChipInput → NEON_COLORS 8-cycle), `// security` (Current + New + Confirm kept). Sticky header + footer (`✓ Save Changes` cyan + Cancel). `animate-slide-in 250ms`. `AdminUser` + `UpdateUserPayload` types extended with 5 new optional contact fields. 9 tests. 34/34 profile suite pass.
- **Done (T-374 FE ProfilePage hero rewrite):** Gradient hero `#0F1525→#0A0E1A` + hex deco corner (uid/pid) + `animate-glitch` name + @handle cyan + action buttons self (✏️ New Post / ⚙️ Settings). TabButtons.count badge added. Posts/Saved tabs: PostCard → PostMiniCard. Activity: HeatmapGrid + ProfileActivityList. About: `// info` grid 8 k-v (InfoGrid helper). 10 tests. 384/384 FE pass.
- **Done (T-375 FE PostMiniCard component):** NEW `PostMiniCard.tsx` — compact variant for Profile Posts/Saved tabs. Corner id + header (timestamp + MoodBadge) + 3-line clamp content + image thumbs 40×30 max 3 +N overlay + tags + action row (♡/❤ LIKE toggle via useUpsertReaction + 💬 count + `read →` /post/:id). 4 tests. 379/379 FE pass.
- **Done (T-373 FE TagModal NEON_COLORS refactor + TagCard polish):** TagModal 440px rewrite — live preview top showing `#<name>` glow, name input `#` prefix in color, 8 NEON_COLORS swatches 28×28 active white border + scale-[1.15] + per-color glow, native `<input type="color">` + hex display, description rows 2, error block red mono 12, body scroll lock. `NEON_COLORS` export in `tag-colors.ts` (8 accents). TagCard grid: top accent line h-[2px] hover-reveal + progress bar `h-[2px]` + `animate-fade-up` stagger 60ms/item. 9 tests. 375/375 FE pass.
- **Done (T-371 FE AdminPage rewrite):** SubBar fixed `top-[52px] z-subbar` with `animate-live-dot` + Tags link. Mood+activity wrapped in cards; activity `max-h-80 overflow-y-auto`. Users/comments sections in card wrappers; pending badge from `useAdminComments`. UsersTable: 5-col (Username/Role/Last seen/Posts/Actions) + View button. Tests 8/8 + 372/372 FE pass.
- **Done (T-320 BE PostStatus enum + admin post endpoints):** Prisma migration `add_post_status_enum` — `PostStatus` enum (PUBLISHED/DRAFT/ARCHIVED) + `Post.status @default(PUBLISHED)` + index. `PostsService.list()` now filters PUBLISHED (public feed). New `adminList()` with status/mood/q filter. `update()` extended for status. 3 admin endpoints: `GET/PATCH/DELETE /admin/posts`. DTOs: `ListAdminPostsDto` + `UpdateAdminPostDto`. `AdminModule` imports `PostsModule`. Factory `makePost` gains `status?`. 24/24 unit + 204/204 e2e pass. OpenAPI regenerated. Unblocks T-372.
- **Done (T-370 LoginCard polish refresh):** Anonymous link: add `font-mono` + `text-[13px]` + `py-[9px]`. Register/bracket logo/bottom status already implemented. Add `data-testid` for test selectors. 4 new test cases. 369/369 FE pass.
- **Done (T-369 LinkInsertModal):** NEW `LinkInsertModal.tsx` 420px modal wired to 🔗 toolbar. RichTextEditor refactored to `forwardRef` + `RichTextEditorHandle.applyLink`. `onRequestLink` passes selectedText. CreatePostPage manages `showLinkModal` + `linkInitialText` + `editorRef`. autoFocus pattern prevents focus-steal in tests. 4 new tests. 365/365 FE pass. M11.9 Theme D 4/4 complete.
- **Done (T-368 RichTextEditor contentEditable refactor):** NEW RichTextEditor 280 lines per design-file v2 — contentEditable + Range API + 11-button toolbar + 2 color popovers + ⌘B/I/U/K shortcuts. PostContent detects HTML vs markdown (heuristic `/^\s*<[a-z]/i`) → `dangerouslySetInnerHTML` cho HTML, parsePostContent cho legacy markdown. Delete MarkdownEditor + 4 obsolete tests. 9 new RichTextEditor tests. 354/354 FE pass. M11.9 Theme D 3/4 done (T-369 LinkInsertModal next sẽ wire `onRequestLink`).
- **Done (T-367 TagPickerDropdown master-data picker):** NEW TagPickerDropdown component replaces free-form TagInput. Click `+ add tag` → listbox of system tags (filter selected, show postCount per chip) + footer link → /tags. Delete obsolete TagInput + 7 free-form tests. 5 new tests. 349/349 FE pass. M11.9 Theme D 2/4 done.
- **Done (T-366 EmojiPicker inline refactor):** Tabbed popup → 4-group inline stack. 64 emojis visible at once. Esc + × close. MarkdownEditor moves picker below toolbar (inline flow). 7 tab-switched tests rewritten → 6 inline tests. 350/350 FE pass. M11.9 Theme D 1/4 done.
- **Done (T-365 CommandPalette design v2 refactor):** Slim commands.ts 11 → 8 entries (5 nav / 2 actions / recent placeholder). Drop Profile + Search (accessible via other UI). Migrate to T-360 tokens (z-dropdown + animate-fade-up-sm + tracking-wide-1). 4 stale-assumption test updates. 351/351 FE pass. M11.9 Theme C complete (2/2 done — T-364 + T-365).
- **Done (T-364 AvatarMenu 7-item refactor):** Extract inline avatar dropdown từ `TopBar.tsx` → new `components/layout/AvatarMenu.tsx`. Design v2 swap items: drop Create Post/Saved, add Manage Posts/Manage Tags/System Settings (disabled TBD). TopBar 226 → 82 lines. 5 new tests + 4 TopBar stale-assumption updates. 352/352 FE pass. M11.9 Theme C 1/2 done.
- **Done (T-363 UploadZone extract to shared):** Move trio `UploadZone.tsx` + `ImageThumb.tsx` + `FileItem.tsx` từ `create-post/` → `shared/`. Add `hint` + `maxSizeMB` optional props. CreatePostPage import + test file location synced. 347/347 FE pass. M11.9 Theme B (shared components) complete.
- **Done (T-360 Phase 2 — token foundation complete):** Implement remaining 15% scope of T-360 token system per M11.9 backlog. Add to `apps/web/src/styles/globals.css` + `apps/web/tailwind.config.ts`: **Z-index** 10 tiers (var-driven, `--z-base` 0 → `--z-dev-tweaks` 9999 + Tailwind `z-modal`/`z-lightbox` etc. utility classes); **Shadow recipes** 17 new boxShadow tokens (`glow-cyan-xs` mới + 7 per-color `glow-{accent}-md` for ReactionPicker/MoodBadge/tag hover + `drop-sm/md/lg/xl` + `stack` compound); **Typography v2.1** 5 variants (`text-h1-hero` 26 SG / `text-input-hero` 18 Inter / `text-display-sm` 24 / `text-mono-tiny` 8 / `text-display-glyph` 40); **letterSpacing** 3 (`wide-1/2/3` = .05/.06/.08em); **lineHeight** 3 (`relaxed-1/2/3` = 1.75/1.8/1.9). New test `apps/web/tests/styles/design-tokens.test.ts` 3 cases. 344/344 FE pass (341 + 3 new). T-360 status TODO → DONE. Foundation unblocks page rewrites (T-371 AdminPage / T-373 TagsPage / T-374 ProfilePage / T-377 ImageCarousel) which will migrate to these tokens.
- **Deferred (out of review scope):** Notifications page (T-314 TODO) + Manage Posts page (T-372 greenfield) — no FE route yet.

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
  - T-343 DONE: BE Migration Comment.parentId + replyTo (FR-03.6 reply-to-comment MVP). Prisma schema self-relation + denormalized replyTo + CASCADE delete + index. Service depth-1 validation (`INVALID_PARENT_DEPTH` 400) + cross-post validation (`INVALID_PARENT_POST` 400). 20/20 unit + 22/22 e2e tests pass (4 unit + 3 e2e reply cases added). Migration auto-gen có stale Reaction constraint rename — manually cleaned.
  - T-344 DONE: BE GET /comments/:id/replies + top-level filter (FR-03.6). NEW endpoint paginated public role-aware (USER chỉ APPROVED, ADMIN tất cả), max limit 50. Update GET /posts/:id/comments: top-level filter parentId IS NULL + include first 3 replies + replyCount per comment. New DTO ListRepliesDto + CommentRepliesResponseDto. OpenAPI synced (docs/contracts/openapi.yaml + apps/web/src/types/api.generated.ts). 5 new e2e tests (list happy + pagination + 404 + role-aware + top-level/replies preview). 27/27 comments e2e pass.
  - T-348 DONE: FE CommentsModal component (FR-04.7 DEFINITIVE). NEW `apps/web/src/components/feed/CommentsModal.tsx` — 640px portal via createPortal, Header (post excerpt + close ×) + Body (CommentItem list reuse + empty/loading states) + Footer (CommentForm reuse). Esc/backdrop close + body scroll lock. 5 new tests. 318/318 FE pass. MVP — infinite scroll + page indicator dots defer (BE endpoint returns full list, có thể add client pagination khi list large).
  - T-349 DONE: FE PostCard 💬 button → opens CommentsModal (FR-04.7). Refactor `<Link to="/post/:id">` → `<button onClick={setShowComments(true)}>`. Post Detail page giữ nguyên cho deep-link/SEO. Test update test-stale-assumption (href→onClick→modal open). 318/318 FE pass.
  - T-379 DONE: BUG-005 [High] REPLY notification gap (T-343 audit follow-up). Fix `comments.service.ts` create() branch logic — REPLY notification to parent comment author với metadata.replyTo. Skip anon parent + self-reply. 2 new unit tests + 3 stale list() mocks updated. 22/22 unit + 27/27 e2e pass.
  - T-361 DONE: FE Animation registry consolidation (M11.9 foundation). `tailwind.config.ts` add `cursorBlink 1s steps(2)` keyframe + split `fade-up` thành 5 variants (xs/sm/default/md/lg) per DESIGN_SYSTEM Motion table. Verified 7 existing keyframes từ T-341/T-342. Non-breaking additive — 324/324 FE tests pass.
  - T-362 DONE: FE Toast shared component + useToast hook + ToastProvider. NEW `components/shared/Toast.tsx` + `hooks/use-toast.ts`. React Context wrapping AppLayout. 3 variants (success/error/info) + auto-dismiss 2500ms + slide-down anim + stack rendering. 4 new tests (3 variants + auto-dismiss fake timer). 328/328 FE pass.
  - T-356 DONE: FE PostActionMenu component (M11.9 design polish trio Phase 1). NEW `components/feed/PostActionMenu.tsx` — context menu cho `⋯` button. User actions (Open detail / Copy link / Save post) + admin/danger sections role-gated. Click outside close + clipboard API + 900ms `Copied!` feedback. Reuse useTogglePostSave. 6 new tests. 334/334 FE pass.
  - T-354 DONE: FE PostCard action row refactor (M11.9 Phase 2, depends T-356). Remove SaveButton standalone, integrate PostActionMenu via `⋯` toggle. Action row giờ 3 buttons (React + 💬 + Share) + `⋯` More. Test updates (test-stale-assumption): save toggle test → 2 new regression tests (SaveButton REMOVED + ⋯ toggles menu). 335/335 FE pass.
  - T-355 DONE: FE ImageLightbox component (M11.9 Phase 3). NEW `components/feed/ImageLightbox.tsx` — full-screen portal viewer với header (path+counter+×) + image area + thumbnail strip (multi-image) + nav arrows + keyboard ← → Esc + body scroll lock. ImageGrid refactor: onImageClick prop + button wrapper. PostCard wire setLightboxIdx state. 5 new tests. 340/340 FE pass.
  - T-350 DONE: FE ReplyForm + ReplyRow + CommentItem refactor (FR-03.6 reply MVP complete). 2 NEW components (ReplyForm 4-cmd↵ submit/Esc cancel/anon toggle + ReplyRow indent 40px + ♡/❤ binary like) + CommentItem refactor (toggle reply form, render replies preview from BE + load more lazy load via useReplies hook). Types updated: Comment thêm parentId/replyTo/replies/replyCount; CreateCommentDto thêm parentId; CommentRepliesResponse type. Avatar xs size 24×24 added. 6 new tests. 324/324 FE pass. **Option A reply-to-comment chain HOÀN THÀNH** (T-343 → T-344 → T-348 → T-349 → T-350, 5 commits).
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
