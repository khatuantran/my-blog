# Bug Tracker

> Format: `[BUG-ID] [Severity] Title - Status`
> Severity: `Critical` | `High` | `Medium` | `Low`
> Status: `OPEN` | `IN_PROGRESS` | `FIXED` | `FIXED (hotfix, pending RCA)` | `WONT_FIX`
> Affected layer: `FE` | `BE` | `Both` | `Infra`

## Open

_(Trống)_

## Fixed

### [BUG-034] [Medium] [FE] Nút "↗ Share" ở action bar (feed + detail) không bấm được

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-06-01
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-473 (DONE 2026-06-01)
- **Related FR/component:** FR-05.1 / `PostCard.tsx` + `PostDetailPage.tsx` action bar
- **Mô tả:** Nút `↗ Share` trên action bar của bài (feed PostCard + Post Detail) bấm không có gì xảy ra.
- **Steps:** Mở feed hoặc `/post/:id` → bấm `↗ Share` ở action row → không phản ứng.
- **Root cause:** T-471 chỉ wire 3 nút share trong `MetaPanel` (sidebar, chỉ hiện desktop `lg:`), bỏ sót 2 nút `↗ Share` ở action bar (vẫn `aria-label="Share post (placeholder)"`, không có `onClick`).
- **Fix:** Tạo component tái dùng `components/shared/SharePopover.tsx` — nút `↗ Share` mở popover 4 lựa chọn (Facebook / X / Telegram / Copy link) dùng `openShare` từ `@/lib/share` (T-471, share intent URL công khai, KHÔNG cần key). Thay 2 placeholder ở `PostCard` + `PostDetailPage` bằng `<SharePopover>`. Outside-click + trigger-toggle theo pattern BUG-024.
- **Regression test:** `SharePopover.test.tsx` (4 case: popover toggle + click FB/Telegram mở intent + copy link).
- **Lesson learned:** khi "wire feature có nhiều entry-point" phải grep TẤT CẢ chỗ render (action bar ≠ sidebar) — T-471 chỉ làm 1 trong 2 surface; placeholder `aria-label` là dấu hiệu nút chưa wire.

### [BUG-033] [Medium] [FE] Profile PostMiniCard hiển thị raw HTML string

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-466 (DONE 2026-05-31)
- **Related FR/component:** FR-04 / `PostMiniCard.tsx`
- **Mô tả:** Trang profile (Posts tab) **+ trang Search** — card bài viết hiển thị nguyên chuỗi HTML thô (`<p>test local url</p>`, `<code>…</code><span style=…>`) thay vì nội dung đọc được.
- **Steps:** Vào `/profile/:username` → tab Posts → thấy `<p>...</p>` literal trong card.
- **Root cause:** Post mới là rich-text HTML (TipTap, từ T-368). `PostMiniCard` render `{post.content}` dạng **text node** (line-clamp excerpt) → React hiển thị raw markup. Feed/Detail dùng `PostContent` (dangerouslySetInnerHTML) nên không bị; mini card thì chủ ý render text nên lộ tag.
- **Fix:** Thêm util `lib/strip-html.ts > stripHtml()` (bỏ tag + script/style + decode entity cơ bản + collapse whitespace) → `PostMiniCard` render `{stripHtml(post.content)}`; `ResultCard` (search) strip trước slice(200)/highlight. Markdown legacy (không tag) không ảnh hưởng.
- **Regression test:** `strip-html.test.ts` (4 case) + `PostMiniCard.test` + `ResultCard.test` (`regression BUG-033: HTML content render dạng text`).
- **Lesson learned:** content giờ là HTML — mọi nơi render dạng TEXT (excerpt/card/snippet) phải `stripHtml` trước; chỉ `PostContent` mới dangerouslySetInnerHTML.

### [BUG-032] [Low] [FE] PostActionMenu hiện "Save post" cho anonymous (vi phạm FR-03.3)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-459 (DONE 2026-05-31)
- **Related FR/component:** FR-03.3 / `PostActionMenu.tsx`
- **Mô tả:** Menu `⋯` (post.actions) hiện item `🔖 Save post` kể cả khi chưa login (anonymous). FR-03.3 quy định save **CHỈ auth user**. Đồng thời icon + chữ các action không thẳng hàng / không căn giữa dòng (icon width khác nhau: ↗ vs 🔗 vs 🔖).
- **Steps:** Mở feed ở chế độ anonymous (chưa login) → click `⋯` trên post → thấy "Save post".
- **Expected:** Anonymous KHÔNG thấy "Save post"; icon + chữ thẳng cột + căn giữa dòng.
- **Actual:** Save post hiện cho anon (click → save mutation fail 401); icon/chữ lệch.
- **Root cause:** Save button render vô điều kiện (không gate `user`); icon span dùng `text-base` không cố định width → label các dòng lệch trái phải.
- **Fix:** Wrap Save button trong `{user && (...)}` (auth-only); icon span → `inline-flex w-5 shrink-0 items-center justify-center leading-none` (fixed-width center → label thẳng cột + icon căn giữa dòng).
- **Regression test:** `PostActionMenu.test` (`1. authed → save hiện` + `1b. anonymous → KHÔNG có action-toggle-save`).
- **Lesson learned:** action gated theo role/auth (FR-03.3) phải check ở render, không chỉ ở handler; icon list trong menu nên fixed-width để label thẳng hàng.

### [BUG-031] [Low] [FE] ImageLightbox click vùng đen ngoài ảnh không đóng (chỉ × đóng)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-452 (DONE 2026-05-31)
- **Related FR/component:** FR-04 / `ImageLightbox.tsx`
- **Mô tả:** Mở xem ảnh (lightbox) → click vùng đen quanh ảnh không đóng; chỉ nút × đóng. Footer ghi "click outside to close" nhưng không hoạt động.
- **Root cause:** Root có `onClick={onClose}` nhưng vùng giữa do `image area` div (`flex-1`) phủ kín + `onClick stopPropagation` toàn bộ → click vùng đen (chính image area) bị chặn không bubble lên root.
- **Fix:** image area `onClick`: `e.stopPropagation()` (tránh con bubble lên root) + `if (e.target === e.currentTarget) onClose()` → click trúng vùng đen của container thì đóng; click ảnh/nút thì không.
- **Regression test:** `ImageLightbox.test` (`regression BUG-031: click vùng đen → onClose; click ảnh → không đóng`).
- **Lesson learned:** click-outside-to-close: vùng "outside" phải là phần tử nhận `onClick` so `target===currentTarget`, không stopPropagation mù làm chặn cả backdrop.

### [BUG-030] [Low] [FE] Bài post ngắn vẫn hiện nút "show more" (false-positive collapse)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-451 (DONE 2026-05-31)
- **Related FR/component:** FR-04 / `CollapsibleContent.tsx`
- **Mô tả:** Post nội dung ngắn (1-2 dòng, không có gì để collapse) vẫn hiện nút `▾ show more` ở feed.
- **Root cause:** Fix trước (T-439 follow-up) đổi `overflowing = scrollHeight > collapsedH`; nhưng `collapsedH` đo theo **line box** (getClientRects) KHÔNG gồm margin cuối, còn `scrollHeight` gồm margin → bài ngắn vẫn `scrollHeight > collapsedH` → false-positive.
- **Fix:** `overflowing = scrollHeight > maxHeight + 1` (so với ngưỡng, không so collapsedH). Chỉ clamp (`maxHeight: collapsedH`) khi `overflowing && !expanded` → tránh cả false-positive lẫn case cắt-mà-không-có-nút. collapsedH (line-snap clean cut) chỉ tính khi thật sự overflow.
- **Regression test:** `CollapsibleContent.test` (no-overflow → no toggle; overflow → toggle + clamp).
- **Lesson learned:** detect overflow phải so `scrollHeight` với **maxHeight** (cùng đơn vị, gồm margin), KHÔNG so với chiều cao line-box (lệch margin).

### [BUG-028] [High] [BE] Không publish được post có ảnh/file upload local (`@IsUrl` reject localhost)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 + Docker api / Layer: BE
- **Related task:** T-449 (DONE 2026-05-31)
- **Related FR/component:** FR-02.3/02.5 / `create-post.dto.ts` + `set-avatar.dto.ts`
- **Mô tả:** Upload ảnh/file local (URL `http://localhost:3001/uploads/...`) rồi Publish → BE 400 `images.0.url must be a URL address` / `files.0.url must be a URL address`.
- **Root cause:** `@IsUrl()` (class-validator) mặc định `require_tld:true` → `localhost` (không TLD) bị reject. `SetAvatarDto.url` còn hard-match `^https://res.cloudinary.com/`. Cả 2 cản local storage (ADR-010).
- **Fix:** `ImageInputDto`/`FileInputDto.url` → `@IsUrl({ require_tld: false })`. `SetAvatarDto.url` `@Matches` cho phép Cloudinary HOẶC `…/uploads/…` (giữ chống URL tùy ý). Verified curl: POST /posts localhost url → 201.
- **Regression test:** `posts.e2e-spec.ts` (`regression: chấp nhận localhost url cho image/file`).
- **Lesson learned:** `@IsUrl()` reject localhost — feature có URL nội bộ phải `require_tld:false`; domain allowlist phải driver-aware.

### [BUG-027] [Medium] [FE] Multi-upload chỉ giữ file cuối (stale `value` closure)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-449 (DONE 2026-05-31)
- **Related FR/component:** FR-02.3/02.5 / `UploadZone.tsx`
- **Mô tả:** Chọn nhiều ảnh/file 1 lần → chỉ file cuối được thêm; phải upload từng cái.
- **Root cause:** `handleFiles` loop `await` rồi `onChange([...value, asset])` — `value` là closure snapshot (rỗng) suốt loop → mỗi vòng ghi đè vòng trước.
- **Fix:** tích lũy `added[]` local, `onChange([...value, ...added])` mỗi vòng → giữ tất cả file trong batch.
- **Regression test:** `apps/web/tests/components/shared/UploadZone.test.tsx` → `it('regression BUG-027: multi-select giữ TẤT CẢ file (không chỉ file cuối)')` — upload 3 file 1 lần, assert 3 FileItem (3 nút Remove). Verify red: revert về `onChange([...value, asset])` → `got 1`. (T-475, 2026-06-01)
- **Lesson learned:** loop async cập nhật state từ props phải tích lũy local (props closure không cập nhật giữa các await).

### [BUG-029] [Low] [FE] File upload không giống design — badge MIME + tên unicode mangle + preview thiếu attachments

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: Both
- **Related task:** T-449 (DONE 2026-05-31)
- **Related FR/component:** FR-09 Create Post / `FileItem.tsx` + `files.service.ts` + `PostPreview.tsx`
- **Mô tả:** (a) Badge file hiện full MIME `APPLICATION/VND…SHEET` thay vì `XLSX`; (b) tên file unicode bị mojibake; (c) preview phải hiện attachments nhưng trống.
- **Root cause:** (a) `FileItem` truyền MIME `type` vào `getFileConfig` (key là extension) → fallback hiện MIME; (b) multer decode `originalname` theo latin1 → tên có dấu thành mojibake; (c) `PostPreview` không nhận/không render `files`.
- **Fix:** (a) `FileItem` derive badge từ **extension của name**; (b) BE decode `Buffer.from(file.originalname,'latin1').toString('utf8')`; (c) `PostPreview` thêm prop `files` + render block `// attachments [N]`, CreatePostPage truyền `files`.
- **Regression test:** `FileItem.test` (badge từ ext) + `PostPreview.test` (attachments render).
- **Lesson learned:** badge file dựa extension, không dựa MIME; multer cần decode latin1→utf8 cho tên unicode; preview phải mirror đủ media (ảnh + file).

### [BUG-026] [Low] [FE] Comment mới optimistic hiện ở đầu list rồi nhảy xuống cuối (lệch BE order)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-445 (DONE 2026-05-31)
- **Related FR/component:** FR-03 comments / `use-create-comment.ts`
- **Mô tả:** Comment list hiển thị comment mới nhất ở đầu (sau khi gửi) trong khi BE trả `createdAt: asc` (mới nhất ở cuối) → comment vừa gửi flash lên đầu rồi nhảy xuống cuối sau refetch, bất nhất.
- **Expected:** Comment mới nối tiếp ở CUỐI list (khớp BE asc + reply thread chronological).
- **Actual:** Optimistic prepend → hiện ở đầu.
- **Root cause:** `useCreateComment.onMutate` optimistic dùng `items: [optimistic, ...curr.items]` (prepend) trong khi BE `comments.service.list` sort `createdAt: asc`.
- **Fix:** Đổi optimistic thành append `items: [...curr.items, optimistic]` → khớp server order (mới ở cuối), không còn flash đầu→cuối.
- **Regression test:** `tests/hooks/use-create-comment.test.tsx`.
- **Lesson learned:** optimistic insert phải khớp order của list query (BE `asc` → append cuối; nếu `desc` → prepend đầu), tránh item nhảy chỗ sau refetch.
- **⚠️ SUPERSEDED 2026-05-31 (T-460/FR-03.7):** Comment order đổi sang BE `createdAt DESC` (mới→cũ, user request feed+reply newest-first) → optimistic giờ **prepend đầu** (khớp desc). Lesson vẫn đúng (insert khớp server order); chỉ đảo chiều theo order mới. Test đổi tên `FR-03.7: optimistic prepend đầu`.

### [BUG-025] [Low] [FE] Reply form hiện ở đầu danh sách replies thay vì cuối

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-444 (DONE 2026-05-31)
- **Related FR/component:** FR-03.6 reply / `CommentItem.tsx`
- **Mô tả:** Khi ấn Reply, ô nhập reply hiện ở TRÊN các reply đã có, đẩy chúng xuống — nhìn kỳ. Đáng lẽ nằm CUỐI thread.
- **Expected:** Reply form nằm sau danh sách replies (nối tiếp thread).
- **Actual:** Reply form ở đầu, đẩy replies cũ xuống.
- **Root cause:** `CommentItem` render block `ReplyForm` TRƯỚC block danh sách replies + load-more.
- **Fix:** Di chuyển block `ReplyForm` xuống CUỐI (sau replies list + load-more button).
- **Regression test:** `CommentItem.test.tsx` (`regression BUG-025: reply form nằm cuối` — `compareDocumentPosition` form sau replies).
- **Lesson learned:** input "thêm mới vào thread" đặt cuối list (chronological append), không chèn đầu.

### [BUG-024] [Medium] [FE] Feed — ấn nút ⋯ lần 2 không đóng menu mà mở lại

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-442 (DONE 2026-05-31)
- **Related FR/component:** FR-04 Feed / `PostActionMenu.tsx` + `PostCard.tsx`
- **Mô tả:** Click ⋯ mở popup action; click ⋯ lần nữa lẽ ra đóng nhưng menu không tắt mà hiện lại.
- **Expected:** Click ⋯ lần 2 → đóng menu.
- **Actual:** Menu vẫn mở (toggle hỏng).
- **Root cause:** `PostActionMenu` có listener `mousedown` click-outside gọi `onClose`. Nút ⋯ nằm NGOÀI `containerRef` (menu) → mousedown trên ⋯ kích hoạt outside-handler → `setShowActionMenu(false)`; ngay sau đó `onClick` của ⋯ chạy `setShowActionMenu(v => !v)` với v đã = false → `true` → mở lại. (mousedown đóng → click mở lại.)
- **Fix:** Thêm prop `triggerRef` cho `PostActionMenu`; outside-handler `return` sớm khi target nằm trong `triggerRef` → không tự đóng, để `onClick` của ⋯ tự toggle đóng. `PostCard` truyền `actionTriggerRef` (ref nút ⋯).
- **Regression test:** `PostCard.test.tsx` (`regression BUG-024: ấn ⋯ lần 2 → ĐÓNG menu`).
- **Lesson learned:** dropdown toggle + outside-click listener phải loại trừ chính nút trigger (mousedown-outside đóng rồi click toggle mở lại = vòng lặp).

### [BUG-023] [Medium] [FE] Feed — popup action bị cắt khi card ngắn (overflow-hidden)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-442 (DONE 2026-05-31)
- **Related FR/component:** FR-04 Feed / `PostCard.tsx` article + `PostActionMenu.tsx`
- **Mô tả:** Card ngắn → popup action (Copy link/Save/Edit/Delete) mở lên trên (`bottom-full`) bị cắt mất phần tràn khỏi mép card.
- **Expected:** Popup hiển thị đầy đủ kể cả tràn ngoài card.
- **Actual:** Phần popup vượt mép card bị ẩn.
- **Root cause:** `<article>` PostCard có `overflow-hidden` (clip top-gradient line) → cắt mọi child absolute tràn ngoài, gồm `PostActionMenu` (absolute, mở lên trên). (User nghĩ z-index nhưng thực chất là overflow clip.)
- **Fix:** Bỏ `overflow-hidden` khỏi `<article>` PostCard. Top-gradient line dùng `linear-gradient` trong suốt 2 đầu nên không lú góc bo; ImageGrid inset trong `p-4` nên không chạm góc → không cần clip.
- **Regression test:** `PostCard.test.tsx` (`regression BUG-023: article KHÔNG overflow-hidden`).
- **Lesson learned:** container có popup/dropdown absolute tràn ngoài KHÔNG được `overflow-hidden`; clip trang trí (gradient line) phải làm cục bộ, không clip cả card.

### [BUG-022] [Medium] [FE] Create Post — text.color không dùng chung được với bold

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-438 (DONE 2026-05-31)
- **Related FR/component:** FR-09 Create Post / `globals.css` prose CSS (RichTextEditor TipTap)
- **Mô tả:** Tô màu chữ (text.color) cho đoạn text đã bold (hoặc bold sau khi tô màu) → chữ không hiển thị màu đã chọn, vẫn ra màu mặc định.
- **Steps:** `/admin/create` → chọn text → Bold → mở A▾ chọn màu (vd pink) → chữ bold vẫn màu trắng tp, không pink.
- **Expected:** Bold + text.color kết hợp được (chữ vừa đậm vừa đúng màu).
- **Actual:** Màu bị mất khi text đang bold.
- **Root cause:** TipTap nest mark `<span style="color: …"><strong>text</strong></span>` (span màu là cha, `<strong>` là con — confirm qua repro `editor.getHTML()`). Prose CSS T-437 đặt rule `[data-testid='rte-editor'] strong { color: var(--tp) }` → set `color` thẳng trên `<strong>` (con) → **đè** màu kế thừa từ span cha → bold luôn ra tp. (Underline `<u>` không có rule color → đã combine được; chỉ `strong/b` bị.)
- **Fix:** Bỏ `@apply text-tp` (color) khỏi rule `strong, b` trong `globals.css`, chỉ giữ `font-weight: 700`. Bold kế thừa màu từ span cha (text.color) hoặc màu editor mặc định khi không tô màu.
- **Regression test:** `RichTextEditor.test.tsx` (`regression BUG-022: color span + bold mark coexist trong content`) — assert content `<span style=color><strong>` render giữ cả span màu lẫn strong. CSS cascade verify manual (jsdom không load globals.css).
- **Lesson learned:** prose CSS cho rich-text KHÔNG hardcode `color` trên inline mark (strong/b/em) — TipTap nest textStyle(color) làm cha của các mark khác, set color trên con sẽ đè. Inline mark chỉ set thuộc tính riêng (font-weight/style), để màu kế thừa.

### [BUG-019] [Medium] [FE] Create Post — preview không hiển thị được với content HTML

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-436 (DONE 2026-05-31)
- **Related FR/component:** FR-09 Create Post / `PostPreview.tsx` + `PostContent.tsx`
- **Mô tả:** Ở `/admin/create`, panel live preview bên phải không review được content nữa (trống hoặc vỡ định dạng).
- **Expected:** Preview hiển thị content đã format real-time, không vỡ.
- **Actual:** Preview trống / HTML vỡ.
- **Root cause:** `PostPreview.tsx` truncate `content.slice(0, 300)` rồi đưa vào `PostContent` render `dangerouslySetInnerHTML`. Từ khi RichTextEditor xuất **HTML** (T-368), 300 ký tự đầu phần lớn là thẻ/inline-style → cắt giữa thẻ → HTML không hợp lệ → render trống/vỡ. Logic truncate kiểu plain-text không còn hợp với content HTML.
- **Fix:** Bỏ truncate theo ký tự. Render **full** `content` qua `PostContent` trong wrapper `overflow-hidden` + `max-height:320px` (clamp bằng CSS, không cắt chuỗi HTML giữa thẻ). `data-testid=preview-content-clamp`. (Follow-up user feedback: bỏ fade-out gradient vì làm mờ dòng cuối; actions row preview match action bar Feed/Detail 1:1 — `ReactionIcon` LIKE + `React` · `💬 0` · `↗ Share`, bỏ icon 🏷 cũ, font `text-mono-md text-tm`.)
- **Regression test:** `PostPreview.test.tsx` (`regression BUG-019: HTML content render nguyên thẻ + clamp bằng CSS` — content `<p><strong>…</strong></p><h2>…` dài → `<strong>`/`<h2>` còn nguyên trong DOM).
- **Lesson learned:** truncate content phải HTML-aware (clamp CSS hoặc cắt theo text node) — không slice chuỗi HTML theo ký tự. Liên đới đổi engine editor sang HTML (T-435).

### [BUG-020] [Medium] [FE] Create Post — content HTML phình to (execCommand) + counter đếm lệch BE limit

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE (validate BE)
- **Related task:** T-435 (DONE 2026-05-31)
- **Related FR/component:** FR-09 Create Post / `RichTextEditor.tsx` + `create-post.dto.ts` `@MaxLength(50000)`
- **Mô tả:** Gõ ít chữ nhưng content HTML rất dài → khi publish dễ bị reject do vượt giới hạn ký tự content; counter FE hiển thị số nhỏ gây hiểu nhầm.
- **Expected:** Markup gọn; số ký tự FE phản ánh đúng giới hạn BE đếm.
- **Actual:** `execCommand` (`foreColor`/`hiliteColor`/format) sinh markup lồng nhau (`<font>`, `<span style>`) phình to cho text ngắn; counter FE đếm `textContent` (chỉ text) còn BE đếm **toàn chuỗi HTML** (`@MaxLength(50000)`) → lệch.
- **Root cause:** Editor dựa trên `document.execCommand` (deprecated) → output HTML không kiểm soát, nhiều inline-style thừa.
- **Fix:** Thay engine RichTextEditor sang **TipTap (ProseMirror)** (ADR-009) — schema chỉ phát mark semantic (`<strong>/<em>/<mark>/<h1>`…), drop `<font>`/inline-style thừa khi parse. Counter hiển thị `editor.getText().length` (text thực) + cảnh báo `⚠ {htmlLen}/50000 html chars` khi `getHTML().length ≥ 45000` (đếm đúng đơn vị BE).
- **Regression test:** `RichTextEditor.test.tsx` (`regression BUG-020: initial messy <font> HTML → normalizes to <strong> (no <font>/inline-weight)` + `char counter shows text length only`).
- **Lesson learned:** `document.execCommand` deprecated + markup bloat → dùng editor schema-based (TipTap) cho rich-text. Counter rich-text phải đếm theo đơn vị BE validate (HTML length) để cảnh báo đúng.

### [BUG-021] [Low] [FE] Create Post — ô content margin/dead-space (thiếu port prose CSS)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-437 (DONE 2026-05-31)
- **Related FR/component:** FR-09 Create Post / `globals.css` + `RichTextEditor.tsx` editor box
- **Mô tả:** Khi nhập content, ô content tự nở ra nhưng phần dư phía dưới không dùng được; margin giữa các block (heading/list) quá lớn.
- **Expected:** Ô có chiều cao ổn định + margin block gọn theo design-file `.editor-area`.
- **Actual:** Ô dùng `resize-y` không `overflow`; heading/list/mark/paragraph dùng margin mặc định browser (rất lớn) → dead-space + spacing thừa.
- **Root cause:** design-file `.editor-area` L29-36 định nghĩa margin gọn cho `h1/h2/ul/ol/mark`, nhưng `globals.css` chỉ port mỗi rule placeholder — bỏ sót toàn bộ style nội dung. (Áp cho cả editor lẫn post hiển thị vì `PostContent` render HTML qua `dangerouslySetInnerHTML` cũng thiếu CSS.)
- **Fix:** Editor box (TipTap `editorProps.class`): bỏ `resize-y`, set `min-height:220px` + `overflow-y-auto`. `globals.css`: port prose styling dùng chung `[data-testid='rte-editor']` + `[data-testid='post-content-html']` — `p` margin 0.6em (last-child 0), `h1/h2` (size 22/18 + margin 8px 0 4px), `ul/ol` (padding-left 24 + margin 6px 0 + list-style), `mark` (padding 0 2px radius 2px, giữ bg inline), `a` cyan underline, `strong/b` 700. Placeholder đổi sang TipTap `p.is-editor-empty:first-child::before` (rule `:empty` cũ không áp dụng cho ProseMirror).
- **Regression test:** verify Playwright/manual (prose CSS khó assert qua jsdom — ghi trong PROGRESS).
- **Lesson learned:** khi port component từ design-file phải port TRỌN block CSS (`.editor-area` không chỉ placeholder); prose styling cho HTML content dùng chung editor + display để nhất quán.

### [BUG-018] [Low] [FE] Load-more replies hiển thị total thay vì remaining

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-433 (DONE 2026-05-31)
- **Related FR/component:** FR-03.6 / `CommentItem.tsx` load-more button
- **Mô tả:** Comment có 6 reply, 3 đã hiện (preview) → nút "load more" ghi `↳ 6 replies (load more)` — số 6 là TOTAL, gây hiểu nhầm còn 6 chưa load (thực ra còn 3).
- **Expected:** Hiển thị số reply CÒN LẠI chưa hiện (3).
- **Actual:** Hiển thị total (6).
- **Root cause:** `↳ {replyCount} replies (load more)` dùng `replyCount` (total) thay vì `replyCount - previewReplies.length` (remaining).
- **Fix:** `remainingReplies = replyCount - previewReplies.length` → nút ghi `↳ load {N} more {reply/replies}` (pluralize). Render verify: 6 total / 3 preview → "↳ load 3 more replies".
- **Regression test:** `CommentItem.test.tsx` (`regression BUG-018: load-more remaining không phải total`).
- **Lesson learned:** count cạnh "load more" phải là remaining (cái sẽ được load), không phải total.

### [BUG-017] [Medium] [BE] Comment "post as anon" không hoạt động cho authed user

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local BE :3001 / Layer: BE
- **Related task:** T-432 (DONE 2026-05-31)
- **Related FR/component:** FR-03 / UC-04 comments / `apps/api/src/comments/comments.service.ts` create()
- **Mô tả:** User đã login bật toggle "post as anon" + nhập tên → comment vẫn hiện tên thật (`@admin`), KHÔNG ẩn danh. Feature "comment as anonymous" cho authed user không hoạt động.
- **Steps:** Login admin → /post/:id → toggle `[as anon]` + nhập name → Send → comment hiện `@admin` (sai, phải ẩn danh).
- **Expected:** Comment ẩn danh (author=null + anonymousName), không attribute cho user.
- **Actual:** Comment attribute cho authed user (`author: {admin}`, anonymousName bị bỏ).
- **Root cause:** `comments.service.create` dùng `baseData = viewer.userId ? attribute-to-user : anon` — khi authed (`viewer.userId` set) thì LUÔN attribute cho user, BỎ QUA `dto.anonymousName`. Design-file "Post Detail.html" L435-437 có toggle "post as anon" + FE `CommentForm` có `[as anon]` → feature được intend nhưng BE chưa honor (half-built). Confirmed curl: authed + anonymousName → `author: admin`.
- **Fix:** `const effectiveUserId = viewer.userId && !dto.anonymousName ? viewer.userId : null` — khi authed user gửi `anonymousName` (anon intent) → tạo comment anon (author=null, dùng anonymousId cookie + anonymousName), KHÔNG log activity / gửi notification dưới danh nghĩa user (giữ ẩn danh thật). Confirmed: authed + anonymousName → `author: null`; authed no-name → `author: admin`.
- **Regression test:** `comments.e2e-spec.ts` (`regression BUG-017: auth user + anonymousName → author=null, userId null`) + `comments.service.spec.ts` (`regression BUG-017: auth + anonymousName → no user.connect`). 23/23 e2e + 23/23 unit pass.
- **Lesson learned:** half-built feature (design + FE có toggle nhưng BE chưa honor) = bug. Borderline F2 (nới policy authed-anon) nhưng design-file (spec source) có toggle → intend sẵn → F3 complete feature. FR clarification thêm UC-04 (authed user post as anon).

### [BUG-016] [High] [FE] Comment/reply like count = NaN khi ấn tim

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-31
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-431 (DONE 2026-05-31)
- **Related FR/component:** FR-03 comments / `CommentItem.tsx` + `ReplyRow.tsx` + `types/api.ts` Comment type
- **Mô tả:** Ấn ♡ trên comment hoặc reply → count thành `NaN` (hiển thị `❤ NaN`).
- **Steps:** Mở `/post/:id` → ấn ♡ trên 1 comment/reply → `❤ NaN`.
- **Expected:** count tăng/giảm số đúng (vd `♡ 1` → `❤ 2`).
- **Actual:** `❤ NaN`.
- **Root cause:** FE hand-typed `Comment.likeCount` nhưng BE/openapi trả field **`likesCount`** (openapi.yaml:2202 required + BE `comments.service` `likesCount: c._count.likes` + api.generated.ts đúng `likesCount`). → `comment.likeCount` = `undefined` → optimistic `count + 1` = `undefined + 1` = **NaN**. Type drift (hand-typed `Comment` sai vs contract). Replies dùng cùng `Comment` type → cũng NaN.
- **Fix:** rename FE `likeCount` → `likesCount` (types/api.ts Comment + CommentItem + ReplyRow + use-create-comment optimistic + 4 test mocks) + defensive `?? 0`. Confirmed render: `♡ 1` → `❤ 2`, no NaN.
- **Regression test:** `CommentItem.test`/`ReplyRow.test`/`CommentList.test`/`CommentForm.test` (18 pass) — mocks dùng `likesCount` đúng field; CommentItem.test assert count tăng khi like.
- **Lesson:** hand-typed FE type PHẢI khớp openapi field name — nên generate từ openapi (api.generated.ts đã đúng `likesCount`, Comment type hand-typed bỏ sót gây drift). BE count convention = plural `likesCount`.

### [BUG-015] [High] [FE] Tag picker "+ add tag" rỗng — `sort=top` invalid → query 400

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-30
- **Environment:** local FE :5173 → BE :3001 / Layer: FE
- **Related task:** T-428 (DONE 2026-05-30)
- **Related FR/component:** FR-10 tags / `apps/web/src/components/create-post/TagPickerDropdown.tsx` (Create Post)
- **Mô tả:** Click "+ add tag" ở `/admin/create` → dropdown rỗng + hiện "// all tags added" dù còn system tag chưa chọn → KHÔNG add tag vào post được.
- **Steps:** Login admin → `/admin/create` → click "+ add tag" → dropdown "// all tags added" (sai).
- **Expected:** Dropdown liệt kê system tags chưa chọn để click add.
- **Actual:** Dropdown rỗng / "all tags added".
- **Root cause:** `TagPickerDropdown` gọi `useTags({ sort: 'top', limit: 30 })` nhưng BE `ListTagsDto` chỉ chấp nhận `sort ∈ {name, posts, recent}` → `'top'` invalid → `GET /tags?sort=top` trả **400** → `tagsQ.data` undefined → `available=[]`; message logic `tagsQ.data?.items.length === 0` (undefined===0 → false) → hiện "all tags added" sai. Pre-existing từ T-367 (`TagSort` type cũng không có `'top'` — type mismatch lọt qua).
- **Fix:** `sort: 'top'` → `sort: 'posts'` (most used) + thêm `tagsQ.isError` branch ("// failed to load tags"). Confirmed curl: `GET /tags?sort=top` → 400; `sort=posts` → 200. Render verify: picker hiện `+ #dev 2`.
- **Regression test:** `apps/web/tests/components/create-post/TagPickerDropdown.test.tsx` (5 pass — query system tags + add chip). Manual render verify add-tag flow.
- **Lesson:** FE query-param phải khớp BE enum; `TagSort` không có `'top'` nhưng `useTags` nhận lỏng nên TS không bắt. Test cần MSW handler match đúng `sort` value để lộ mismatch.

### [BUG-014] [High] [FE] Tag create luôn 400 "name missing" + tag/user update no-op (doubled Content-Type header)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-30
- **Environment:** local FE :5173 → BE :3001 / Chrome / Layer: FE
- **Related task:** T-424 (DONE 2026-05-30)
- **Related FR/component:** FR-10 tags + FR-11 users / `apps/web/src/services/api/client.ts` (doFetch) + `tags.ts` (createTag/updateTag) + `users.ts` (updateUser/changePassword)
- **Mô tả:** Tạo tag qua UI luôn fail với 400 `["name must be a string","name must be longer than or equal to 1","name must be shorter than or equal to 50"]` DÙ form gửi name hợp lệ. Update tag (description) trả 200 nhưng là **no-op** — description không lưu, name trả về un-normalized (`#dev`). Cùng root cause cũng âm thầm phá PATCH `/users/me` + change-password (no-op).
- **Steps to reproduce:**
  1. Login admin → `/tags`.
  2. `+ New Tag` → name `reprotag1`, description `desc-from-ui` → Create.
  3. → modal KHÔNG đóng + error `Invalid input · name must be a string...`.
  4. (Update) Edit 1 tag → đổi description → Save → 200 nhưng description không đổi.
- **Expected:** Create 201 + lưu name+color+description; Update 200 + description persist.
- **Actual:** Create 400 name-missing; Update no-op (BE bỏ qua body).
- **Root cause:** `client.ts > doFetch` set header bằng object spread `{ 'Content-Type': 'application/json', ...(init.headers ?? {}) }`. Caller `tags.ts`/`users.ts` truyền `headers: { 'content-type': 'application/json' }` (lowercase) → object có 2 key khác case (`Content-Type` + `content-type`) → `fetch` build `Headers` bằng **append** → gửi header doubled `Content-Type: application/json, application/json`. NestJS body-parser (`type-is`) KHÔNG match media type doubled → KHÔNG parse JSON body → `req.body` rỗng → `CreateTagDto` thấy name `undefined` (400); `UpdateTagDto` (PartialType) thấy mọi field `undefined` → service no-op. **Smoke curl ban đầu không bắt được** vì curl gửi single clean header → 201; bug chỉ hiện qua browser fetch (doubled header). Confirmed: Playwright capture FE gửi đúng `{name,...}` nhưng BE 400 + curl đối chứng (single CT → 201, `Content-Type: application/json, application/json` → 400).
- **Fix:** `doFetch` build headers bằng `new Headers(init.headers ?? {})` (case-insensitive) + chỉ `set('Content-Type', 'application/json')` khi `!headers.has('Content-Type')` → loại bỏ hoàn toàn khả năng duplicate. Cleanup: bỏ `headers: {'content-type'...}` redundant ở `tags.ts` (2) + `users.ts` (2). E2E re-verify qua Playwright: create 201 (name normalize đúng) + edit description persist (`desc-create` → `desc-EDITED`).
- **Regression test:** `apps/web/tests/services/api/client.test.ts` — `it('regression BUG-014: caller pass lowercase content-type → handler nhận single Content-Type (không doubled)')` assert handler nhận `content-type: application/json` (single) + body parse được khi caller pass lowercase header (verified FAIL trên code cũ, PASS sau fix) + 1 case default Content-Type khi caller không truyền headers.
- **Lesson learned:** Merge HTTP headers bằng plain-object spread KHÔNG dedupe case-insensitive — luôn dùng `Headers`. Smoke test qua curl (single clean header) che giấu bug chỉ xảy ra qua browser `fetch` (doubled header). Reproduce PHẢI đi đúng path user (UI form), không chỉ curl — đây là lý do bug "qua được" smoke test ban đầu.

### [BUG-013] [Medium] [FE] "Invalid input · check fields" generic message hide actual BE validation cause

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-30
- **Environment:** local FE :5173 / Chrome / Layer: FE
- **Related task:** T-423 (DONE 2026-05-30) — backfilled via docs audit (F6); fix gốc ở commit `2c6651b`
- **Related FR/component:** FR-10 tags / `apps/web/src/pages/TagsPage.tsx` (handleSubmitModal) + `apps/web/src/services/api/client.ts` (parseResponse)
- **Mô tả:** User báo "không tạo được tag" + screenshot TagModal hiển thị error block "Invalid input · check fields" generic. Repro với curl + dev BE: cùng payload `{name:"de2", color:"#00FFE5", description:"d"}` → 201 success. Phỏng đoán: user actually đụng case BE thực sự trả 400 (ví dụ: color empty string khi state mutate bất ngờ, hoặc field shape khác) nhưng FE generic message ẩn hoàn toàn nguyên nhân.
- **Steps to reproduce:**
  1. Login admin, navigate `/tags`.
  2. Click `+ New Tag`, type name/color/description.
  3. Submit → BE return 400 with specific cause (e.g. `["color must be a hexadecimal color"]`).
  4. FE displays generic "Invalid input · check fields" — user không biết field nào sai.
- **Expected:** Error block hiển thị actual BE validation message để user biết field nào fix.
- **Actual:** Hardcoded generic "Invalid input · check fields", BE message bị nuốt + cũng do `ApiError.message` không coerce `string[]` từ class-validator BadRequest.
- **Root cause:** Hai layer:
  1. `parseResponse` trong `client.ts` truyền `err?.message` (kiểu `unknown`, BE class-validator BadRequest gửi `message: string[]`) thẳng vào `ApiError(message: string)` constructor → `Error.message` thành string-coerced array `"color must be a hexadecimal color"` hoặc `[object Object]` tùy stringify path. Không reliable cho UI consumption.
  2. `TagsPage.handleSubmitModal` hardcode `msg = 'Invalid input · check fields'` cho 400 — phớt lờ actual BE message.
- **Fix:** 2 file:
  - `client.ts > parseResponse`: detect `Array.isArray(rawMsg)` → `rawMsg.join(', ')`, else `String(rawMsg)`. ApiError.message luôn human-readable string.
  - `TagsPage.handleSubmitModal`: 400 mapping → `Invalid input · ${detail}` với detail = err.message coerced. Plus add 403 mapping "Forbidden — only admin can create/edit tags" cho clarity.
- **Regression test:** Không thêm test mới — fix là client-level coercion + UI string composition, không thay đổi behavior contract. 21/21 Tags tests pass.
- **Lesson learned:** API error responses từ NestJS class-validator dùng `message: string[]` (mảng từng rule fail). FE phải coerce ở client.ts source (1 chỗ) thay vì mỗi consumer handle riêng. Pattern này áp dụng cho TẤT CẢ POST/PATCH endpoint khác (Posts, Users, Comments...) — cùng class-validator pattern. Đang lúc này chỉ fix client.ts (shared) — không cần update từng caller.

### [BUG-012] [Low] [FE] TagsPage 17 drift vs design-file Tags.html

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-30
- **Environment:** local FE :5173 / Layer: FE
- **Related task:** T-420 (DONE 2026-05-30)
- **Related FR/component:** FR-10 tags / `apps/web/src/pages/TagsPage.tsx` + `apps/web/src/components/tags/TagCard.tsx` vs `design-file/MyBlog Tags.html` L402-660 + L224-269
- **Mô tả:** User feedback "giờ đến sync design với màn hình quản lý tags". Audit `/tags` page phát hiện 17 drift đáng kể (cùng pattern recurring với BUG-011 ManagePostsPage).
- **Drifts chia 5 nhóm:**
  - **Layout shell (2)**: Fixed SubBar top:52px 44h `~/tags ── N tags · M total posts` + cyan filled New Post MISSING (current inline `// tags.all`); container `max-w-[1200px]` → `max-w-[1400px]`.
  - **Stats row (2)**: Card RECENTLY ADDED → design LEAST USED; label/value fonts adjust (10px tracking + Space Grotesk 22px).
  - **Toolbar (4)**: Sort `<SortDropdown>` → 3 chips Most used/A→Z/Newest; Search ⌕ absolute icon + × clear; View toggle 30×30 simple; + New Tag outline → FILLED solid cyan + glow.
  - **Grid/Results (3)**: Results count line `// showing N of M tags` MISSING; grid columns `auto-fill minmax(240px, 1fr)`; dashed-border "+ create new tag" placeholder card cuối grid (admin) MISSING.
  - **TagCard (6)**: name textShadow glow + `since <date>` subline + desc min-h-[36px] + stats redesign (Space Grotesk 22 count + "posts" + sparkline right) + actions always visible + SVG cyberpunk icons (✎/🗑 → PencilIcon/TrashIcon T-419 pattern).
- **Per user decisions**:
  - Full 17 drift sweep + SVG cyberpunk icons + rewrite list view per design 5-col table.
  - StatIcons shared → move sang `apps/web/src/components/shared/cyber-icons.tsx` cho reuse.
- **Fix**: 4 file refactor + 1 file mới:
  - Move `StatIcons.tsx` → `shared/cyber-icons.tsx`, update 2 import path (PostRow + PostCardMng).
  - `TagsPage.tsx` rewrite: fixed SubBar + Stats 4-card + Sort 3 chips + Search ⌕/× + View toggle 30×30 ⊞/☰ + + New Tag filled + Results count + grid auto-fill + dashed create card + list view 5-col table inline rendering.
  - `TagCard.tsx` rewrite grid variant: name textShadow + since date + desc min-h-[36px] + Space Grotesk 22 count + posts label + sparkline right + always-visible actions + SVG PencilIcon/TrashIcon.
  - List variant: removed (logic moved inline TagsPage 5-col table per design L549+).
- **Lesson**: Pattern recurring **lần 9** (T-406 → BUG-008 → BUG-009 → BUG-010 → T-414 → T-415 → T-416 → BUG-011 → T-418 → BUG-012). Promote CLAUDE.md rule "grep design-file source markup trước rewrite page/section" là task ưu tiên ngày càng cao.

### [BUG-011] [Low] [FE] ManagePostsPage 14 drift vs design-file Manage Posts.html

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-30
- **Environment:** local FE :5173 / Chrome / Layer: FE
- **Related task:** T-417 (DONE 2026-05-30)
- **Related FR/component:** FR-15 manage posts / `apps/web/src/pages/ManagePostsPage.tsx` + `apps/web/src/components/admin/manage-posts/{PostRow,PostCardMng}.tsx` vs `design-file/MyBlog Manage Posts.html` L457-660 (ManagePosts) + L362-454 (PostRow + PostCardMng)
- **Mô tả:** User feedback "hãy kiểm tra màn hình quản lý bài post và update lại cho giống design". Audit `/admin/posts` page phát hiện 14 drift đáng kể chia 4 nhóm.
- **Steps to reproduce:**
  1. Login admin, navigate `/admin/posts`.
  2. So sánh layout với `design-file/MyBlog Manage Posts.html` L457-660.
- **Expected:** Match 1:1 spec (per user decision: strip bulk-select checkbox column theo design strict).
- **Actual:** 14 drift đồng thời:
  - **Layout shell (2)**: SubBar inline normal card → design fixed top:52px 44h bg-elev với breadcrumb `~/admin/posts ── N total · {pub} published · {draft} drafts` + bulk-delete + cyan filled New Post buttons right; Stats row 4-card (TOTAL/PUBLISHED/DRAFTS/ARCHIVED) borderLeft 3px colored MISSING.
  - **Toolbar (4)**: Sort `<select>` → design 3 chips `sort: [Newest][Oldest][Top]`; Status filter chips thiếu count `(N)`; View toggle nhỏ → design 32×32 lớn; Search ⌕ icon position + × clear right.
  - **Results/List/Card (5)**: Results count line `// showing {N} of {M} posts · filtered` MISSING; List header bg-bg darker + grid fr units (current fixed px) + có checkbox column (design không có); PostRow stats 1-line → design 2-line (counts/date) + actions `👁 View / ✎ Edit / ✕`; PostCardMng header layout (status+mood+date right) + stats inline với 📷/📎 conditional; Card grid `auto-fill minmax(320px, 1fr)` vs current fixed grid.
  - **Minor (3)**: Empty state thiếu `◎` 28px big icon; View toggle icon `▦` vs `⊞`; Status filter labels `Published/Draft/Archived` → design abbreviation `Pub/Draft/Arch`.
- **Root cause:** T-372 (ManagePostsPage greenfield 2026-05-26) build per high-level spec trong DESIGN_SYSTEM, không cross-ref `design-file/MyBlog Manage Posts.html` source markup pixel-by-pixel. Pattern recurring **lần 7** (T-406 → BUG-008 → BUG-009 → BUG-010 → T-414 → T-415 → T-416 → BUG-011).
- **Decisions per user:**
  - Bulk-select checkbox column: **strip** (1:1 design strict, design L362-409 PostRow không có checkbox).
  - Full 14 drift sweep (không subset).
- **Fix:** Full refactor 3 file:
  - `ManagePostsPage.tsx`: fixed SubBar layout (top:52px); add 4-card Stats row với colored borderLeft; Sort `<select>` → 3 chips; Search ⌕ absolute icon + × clear; Status chip labels Pub/Draft/Arch + counts qua 3 mini-query `useAdminPosts(status, limit:1)`; View toggle 32×32 + icon ⊞; Results count line; empty state ◎ icon; STRIP checkbox column + bulk-bar.
  - `PostRow.tsx`: rewrite 6-col fr grid `3fr 1fr 1.2fr 1.4fr 1fr 1.5fr`; bỏ checkbox + onSelect prop; stats 2-line (counts row + date row); actions 3-button (View link blu + Edit cyan + ✕ red icon-only).
  - `PostCardMng.tsx`: rewrite top row (status+mood pills inline + date right); stats row inline với 📷 images count + 📎 files count conditional; actions footer 3-button (View link blu + Edit cyan + Delete red).
- **Regression test:** Update `apps/web/tests/pages/ManagePostsPage.test.tsx` (test-stale-assumption sau strip checkbox + layout refactor) — note: 3 pre-existing fail (env undici/AbortSignal) sẽ stay. Add 3 case BUG-011: Stats row 4-card render + Sort 3 chips + Results count line.
- **Lesson learned:** Pattern recurring **lần 7** đủ rõ — promote rule "BẮT BUỘC grep `design-file/*.html` source markup cho mọi page/section refactor trước khi rewrite" lên CLAUDE.md Pre-flight Checklist (defer task riêng, đáng ưu tiên).

### [BUG-010] [Low] [FE] ProfilePage 3 tab (Saved/Activity/About) drift design-file (12+ items)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-30
- **Environment:** local FE :5173 / Chrome / Layer: FE
- **Related task:** T-413 (DONE 2026-05-30)
- **Related FR/component:** FR-11 profile / `apps/web/src/pages/ProfilePage.tsx` + `apps/web/src/components/profile/ProfileActivityList.tsx` + `apps/web/src/components/shared/HeatmapGrid.tsx` vs `design-file/MyBlog Profile.html` L569-664
- **Mô tả:** User feedback "ở trang profile, các tab saved, activity, about đang khác với design hãy fix". Audit 3 tab body trong main area phát hiện 12+ drift visual + structural so spec gốc.
- **Steps to reproduce:**
  1. Navigate `/u/<username>`, click tab Saved / Activity / About.
  2. So sánh với `design-file/MyBlog Profile.html` L569-664.
- **Expected:** Match 1:1 spec (trừ Activity list giữ icon-based với icons feed-aligned per user decision).
- **Actual:** 12+ drift đồng thời chia 3 nhóm:
  - **Saved tab (2):** missing `// saved.posts` + N items header; row gap 12 vs 10.
  - **Activity tab (5):** header label `// activity.28d` (sai, design `// contribution.activity` + `last 28 days · N commits` meta); HeatmapGrid cells 12×12 + gap 2 (design 18px + gap 4 + day labels Su/Mo/Tu top row); thiếu p-20 card padding; thiếu `// recent.actions` sub-header; activity list icon 👍 (LIKE) chưa khớp Feed icon set.
  - **About tab (5):** missing inner `// bio` sub-label trong card; bio 14 vs 15px + lineHeight 1.75; skills thiếu `❯` prefix + per-color glow; **Info grid content sai mục đích** (current STATS — design PROFILE INFO 8 cells Full name/Handle/Role/Born/Location/Joined/GitHub/Website); Info grid styling flat dl vs design 2-col grid cells với bg-elev + UPPERCASE label.
- **Root cause:** T-374 (ProfilePage hero rewrite 2026-05-26) + T-404 (sidebar update 2026-05-29) build tabs theo mô tả high-level trong DESIGN_SYSTEM, không cross-ref `design-file/MyBlog Profile.html` source markup pixel-by-pixel cho 3 tab body. Pattern recurring lần 4 (T-406 → BUG-008 → BUG-009 → BUG-010): DESIGN_SYSTEM high-level mô tả không thay được design-file source for tab body sections.
- **Fix:** 4 file edit:
  - `HeatmapGrid.tsx` rewrite — add `showDayLabels` prop default true (render Su/Mo/Tu/We/Th/Fr/Sa row top), cells `h-[18px]` (was 12), gap 4px (was 0.5px = 2), legend less/more text-[10px] right-aligned.
  - `ProfilePage.tsx` Saved tab: thêm `// saved.posts <N items>` sb-lbl header.
  - `ProfilePage.tsx` Activity tab: rename label `// contribution.activity` + meta `last 28 days · {total} commits`; HeatmapGrid wrap card `p-5 + rounded-lg + border + bg-surf`; add `// recent.actions` sub-header trước ProfileActivityList.
  - `ProfilePage.tsx` About tab + new component: bio card thêm inner `// bio` sub-label; skills span thêm `❯` 8px prefix + boxShadow `0 0 8px ${color}15` per-color glow; **NEW `<ProfileInfoGrid>`** component replace `<InfoGrid>` (different content) — 2-col grid 8 cell tile (Full name/Handle/Role/Born/Location/Joined/GitHub/Website) mỗi cell bg-elev + border-b2 + UPPERCASE 10px label + 13px value.
  - `ProfileActivityList.tsx`: ICON_MAP align Feed — POST_CREATED `📝→✏️`, LIKE_CREATED `👍→♡` (match Feed PostCard React default), COMMENT/SAVE giữ (đã match Feed).
- **Decisions per user:**
  - About Info grid: **1:1 design** Profile info (redundant với hero nhưng đúng spec).
  - Activity list: **giữ icon-based** nhưng icons feed-aligned (không strip icon hoàn toàn như design plain `❯`).
- **Regression test:** `apps/web/tests/pages/ProfilePage.test.tsx` thêm 3 case BUG-010:
  - Saved tab header `// saved.posts` + N items render.
  - Activity tab `// contribution.activity` header + `// recent.actions` sub-header present.
  - About tab Profile info grid renders 8 cells với Full name/Handle/Role/Born/Location/Joined/GitHub/Website (NOT stats).
- **Lesson learned:** Pattern recurring **lần 4** (T-406 → BUG-008 → BUG-009 → BUG-010). Cần promote rule "BẮT BUỘC grep `design-file/*.html` source markup cho mọi tab/section body trước khi rewrite UI" lên CLAUDE.md Pre-flight Checklist (defer task riêng).

### [BUG-009] [Low] [FE] EditProfileDrawer (Settings panel) 7 visual drift vs design-file Profile.html

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-30
- **Environment:** local FE :5173 / Chrome / Layer: FE
- **Related task:** T-409 (DONE 2026-05-30)
- **Related FR/component:** FR-11 profile edit / `apps/web/src/components/profile/EditProfileDrawer.tsx` vs `design-file/MyBlog Profile.html` L347-439 (function EditProfileDrawer) + L57-60 (.edit-inp + .edit-lbl CSS)
- **Mô tả:** Settings drawer (mở qua nút `⚙️ Settings` ở Profile hero) lệch khá nhiều so với design — user feedback "phần setting này cũng đang khác khá nhiều so với design file" + screenshot kèm.
- **Steps to reproduce:**
  1. Login bất kỳ user, navigate `/u/<own-username>`.
  2. Click `⚙️ Settings` button.
  3. Observe drawer slide in từ phải.
  4. So sánh với `design-file/MyBlog Profile.html` L347-439.
- **Expected:** Match 1:1 spec design-file (trừ exception bảo mật: giữ Current password field thay vì design 2 fields).
- **Actual:** 7 visual drift đồng thời:
  1. Drawer width `max-w-[420px]` — design L368 quy định `width:480px`.
  2. Header 1 dòng `// edit.profile` — design L370-374 quy định 2 dòng: `// edit.profile` (12px cyan) + `~/settings/profile` (11px muted).
  3. Header `×` close bordered box `rounded-sm border bg-elev px-2 py-0.5` — design L375 quy định plain inline `background:none border:none + fontSize:24px`.
  4. Labels natural case (`Full name`, `Title`, `Bio`) — design L387 `.edit-lbl` + L389+ JSX quy định UPPERCASE + 11px + `letter-spacing:.05em`.
  5. Input `text-mono-sm` (11px) + `px-3 py-1.5` + `rounded-sm` — design L57 `.edit-inp` quy định `font-size:14px + padding:8px 12px + border-radius:6px + bg #070A14 (=bg)`.
  6. Save Changes button outline `border-cyan/50 bg-cyan/10 text-cyan` — design L426-428 quy định **filled solid** `bg:#00FFE5 + color:#0A0E1A + boxShadow:0 0 14px rgba(0,255,229,.3)`.
  7. Cancel button bordered only — design L430-432 quy định `bg:#1A1F2E (=elev) + border:#2A3548 (=b2)`.
- **Root cause:** T-376 (EditProfileDrawer greenfield 2026-05-26) implement form theo mô tả "4-section redesign" trong DESIGN_SYSTEM nhưng KHÔNG cross-ref `design-file/MyBlog Profile.html` source CSS/markup pixel-by-pixel. Pattern lặp lại BUG-008 (PostMiniCard) + T-406 (TabButtons) — DESIGN_SYSTEM mô tả high-level đủ scaffold nhưng thiếu chi tiết px-level → drift khi implement.
- **Fix:** 7 thay đổi trong `EditProfileDrawer.tsx`:
  - Drawer `max-w-[420px]` → `max-w-[480px]`.
  - Header `<div>` thêm subline `~/settings/profile` (mono 11 + `text-td`).
  - `×` close: bỏ bordered box, dùng plain `bg-transparent + text-[24px] + leading-none + text-tm hover:text-tp`.
  - Labels: thêm `uppercase tracking-[0.05em]` vào Field label.
  - Input `inputCls`: `text-mono-sm` → `text-[14px]`, `py-1.5` → `py-2`, `rounded-sm` → `rounded-md`.
  - Save Changes: `border-cyan/50 bg-cyan/10 text-cyan` → `bg-cyan text-[#0A0E1A] font-semibold + shadow-[0_0_14px_rgba(0,255,229,0.3)] hover:shadow-[0_0_20px_rgba(0,255,229,0.4)]`.
  - Cancel: thêm `bg-elev`.
- **Exception (security override per user decision):** Giữ Current password field (3 password inputs) thay vì design 2 fields — vì BE `useChangePassword` require currentPassword + security best practice. Design 2-field là weakening security, không follow.
- **Deferred (separate F2 work):** Avatar upload section (design L378-385: ProfileAvatar 56 + `profile photo` label + `↑ Upload` button) — cần BE endpoint `PATCH /users/:id/avatar` + Cloudinary signed upload + FR-11 amendment. Spawn task F2 riêng (T-410+).
- **Regression test:** `apps/web/tests/components/profile/EditProfileDrawer.test.tsx` — new case `it('regression BUG-009: drawer header shows subline ~/settings/profile + Save Changes is filled solid cyan', ...)` assert subline visible + Save button có `bg-cyan` class (filled).
- **Lesson learned:** Lặp lại lesson T-406 + BUG-008. Add rule mới vào CLAUDE.md Pre-flight Checklist: "Đã grep `design-file/*.html` source CSS + markup cho component đang touch chưa?" cho mọi task touch UI component visual. Pattern recurrent đủ điều kiện bump up vào systematic check.

### [BUG-008] [Low] [FE] PostMiniCard 8 visual drift vs design-file Profile.html (tags plain text vs pill chip, read → no border, mood not right-aligned, action gap too wide)

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-30
- **Environment:** local FE :5173 / Chrome / Layer: FE
- **Related task:** T-408 (DONE 2026-05-30)
- **Related FR/component:** FR-11 profile / `apps/web/src/components/profile/PostMiniCard.tsx` vs `design-file/MyBlog Profile.html` L52-55 (.post-mini CSS) + L292-344 (function PostMiniCard render)
- **Mô tả:** Card hiển thị bài viết trong tab Posts/Saved của trang `/u/:username` (`PostMiniCard.tsx`, tạo từ T-375 2026-05-26) lệch khá nhiều so với spec gốc trong design-file. User screenshot design 1 card mẫu (timestamp `[2026-05-17 12:30]` + mood `😊 happy` right-aligned + body 15px + thumb strip + tags pill `#code #dev #debugging` filled + `♡ 24 / 💬 5 / read →` bordered) — code hiện tại render khác.
- **Steps to reproduce:**
  1. Login bất kỳ user, navigate `/u/<username>` (tab Posts mặc định).
  2. Observe 1 PostMiniCard render.
  3. So sánh với `design-file/MyBlog Profile.html` L292-344 (function PostMiniCard) hoặc screenshot user gửi.
- **Expected:** Match 1:1 spec design-file — tags pill filled, read → bordered pill, mood ml-auto, action gap 2px + buttons padded, content 15px, thumb radius 4px, header mb 10px.
- **Actual:** 8 drift đồng thời:
  1. Tags render plain colored text (`text-[11px] color: t.color`) — design L327 quy định pill `bg ${color}15 + border 1px ${color}40 + rounded 3px + padding 1px 6px`.
  2. `read →` link plain `text-cyan hover:underline` — design L338 quy định bordered pill `border 1px rgba(0,255,229,.25) + rounded 4px + padding 4px 8px`.
  3. Mood badge sau timestamp với `gap-2` — design L303 quy định `marginLeft:auto` (right-aligned).
  4. Action row `gap-3` (12px) — design L330 quy định `gap:2px`.
  5. Like/💬 buttons inline flex no padding — design L331-337 quy định `padding:4px 8px + rounded 4px`.
  6. Content font `text-sm` (14px) — design L310 quy định `15px` + `lineHeight 1.6`.
  7. Thumb radius `rounded-sm` (2px) — design L320 quy định `borderRadius:4px`.
  8. Header `mb-2` (8px) — design L301 quy định `marginBottom:10px`.
- **Root cause:** T-375 (PostMiniCard greenfield 2026-05-26) implement card theo mô tả high-level trong DESIGN_SYSTEM, không cross-ref `design-file/MyBlog Profile.html` source CSS/markup pixel-by-pixel. Tương tự T-406 mistake — bịa style thay vì grep design-file. Issue dạng visual fidelity, không break feature (like/comment/read link vẫn click được).
- **Fix:** Rewrite `PostMiniCard.tsx` 8 thay đổi:
  - Tags: span thêm `bg ${color}15 + border 1px ${color}40 + rounded-[3px] + px-1.5 + py-px`.
  - `read →`: thêm `border border-cyan/25 + rounded + px-2 + py-1`.
  - Mood badge: wrap `ml-auto`.
  - Action row: `gap-3` → `gap-0.5` (~2px).
  - Like + 💬 buttons: thêm `px-2 py-1 + rounded`.
  - Content: `text-sm` → `text-[15px]`.
  - Thumb: `rounded-sm` → `rounded`.
  - Header mb: `mb-2` → `mb-2.5` (10px).
- **Regression test:** `apps/web/tests/components/profile/PostMiniCard.test.tsx` — new case `it('regression BUG-008: tags render as pill chip (bg + border) and read link has bordered pill style', ...)` assert tag span có bg+border style + read link có border-cyan class.
- **Lesson learned:** Re-confirm rule từ T-406: BẮT BUỘC grep `design-file/*.html` source CSS + markup trước khi code styling component. DESIGN_SYSTEM mô tả high-level, **không thay thế** design-file source for pixel-level. Pattern recurrent đủ điều kiện: add Pre-flight Gate "Đã grep design-file source CSS chưa?" cho mọi task touch UI component visual.

### [BUG-007] [Low] [FE] SearchPage BigSearchInput hiển thị 2 dấu × clear

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-30
- **Environment:** local FE :5173 / Chrome/Safari (webkit) / Layer: FE
- **Related task:** Inline fix commit `b7f463d` (no T-XXX — single-line CSS fix)
- **Related FR/component:** FR-12 search / `apps/web/src/components/search/BigSearchInput.tsx`
- **Mô tả:** Khi gõ vào ô search ở `/search`, hiện ra **2 dấu ×** clear button cùng lúc — 1 ở phía bên phải input (native browser), 1 ở góc xa hơn bên phải (custom button).
- **Steps to reproduce:**
  1. Mở `/search` ở Chrome hoặc Safari.
  2. Gõ bất kỳ ký tự nào vào input.
  3. Observe: thấy 2 dấu × hiển thị.
- **Expected:** 1 dấu × clear duy nhất (custom, theo cyberpunk theme + data-testid).
- **Actual:** 2 dấu × — native webkit `::-webkit-search-cancel-button` + custom button cùng render.
- **Root cause:** `<input type="search">` ở Chrome/Safari render native `::-webkit-search-cancel-button` mặc định. BigSearchInput đã có custom × button (`data-testid="big-search-clear"`) cho cyberpunk theme + để test query được. Hai cái chồng nhau.
- **Fix:** Thêm `[&::-webkit-search-cancel-button]:appearance-none` vào className input để ẩn native, chỉ giữ custom × (consistent theme + đảm bảo testid).
- **Regression test:** Không thêm test mới — fix CSS-only đơn giản, 10/10 SearchPage tests cũ (T-351 + T-400/T-401) đều pass + assert `data-testid="big-search-clear"` vẫn render đúng = covered.
- **Lesson learned:** Mọi `input type="search"` mới cần check pattern này. TopBar search readonly (không có custom × → safe), TagsPage search dùng native only (cũng safe). Pattern: nếu add custom × → cần `appearance-none` cancel button.

### [BUG-006] [Critical] [FE] AdminPage `/admin` crash — TypeError `Cannot read properties of undefined (reading 'total')`

- **Status:** FIXED
- **Reporter:** khatran (UI Design Fidelity Review) — **Date:** 2026-05-26
- **Environment:** local (postgres-main :5434 + API :3000 + FE :5173) / Chromium Playwright 1440×900 / Layer: FE
- **Related task:** T-380 (DONE 2026-05-26)
- **Related FR/component:** FR-07 admin dashboard / `apps/web/src/pages/AdminPage.tsx` L67-73 + `apps/web/src/services/api/admin.ts` (`AdminStats` type) + `apps/web/tests/pages/AdminPage.test.tsx` MSW mock
- **Screenshot:** `/tmp/ui-review-all/admin/fe.png` (FE crash) vs `/tmp/ui-review-all/admin/design.png` (design reference)
- **Mô tả:** Khi navigate `/admin` (login admin OK, ProtectedRoute pass) page render crash với uncaught TypeError. 4 StatCards (POSTS/LIKES/COMMENTS/VIEWS) destructure `stats.likes.total` → undefined → `.total` throws. Toàn page Admin blocking, không thể access dashboard/users table/moderation queue.
- **Steps to reproduce:**
  1. Login `admin`/`admin-password` qua `/auth/login`.
  2. Navigate `/admin`.
  3. Page render crash; React error boundary catch (hoặc whitescreen tùy build).
- **Expected:** Page render SubBar + 4 StatCards + 2-col + UsersTable + ModerationQueue như `design-file/MyBlog Admin.html`.
- **Actual:** TypeError `Cannot read properties of undefined (reading 'total')` tại `AdminPage.tsx:69` (`stats.likes.total`).
- **Root cause:** BE/FE contract drift từ M11.7 multi-reaction migration. BE [admin-response.dto.ts:20](apps/api/src/admin/dto/admin-response.dto.ts#L20) + [openapi.yaml StatsResponseDto](docs/contracts/openapi.yaml) đã rename field `likes` → `reactions` (multi-reaction terminology). FE consumer ([AdminPage.tsx:67-73](apps/web/src/pages/AdminPage.tsx#L67) + type [admin.ts:21](apps/web/src/services/api/admin.ts#L21)) vẫn dùng `likes`. BE returns `{posts, reactions, comments, views}` → FE reads `stats.likes` → undefined → crash. Test [AdminPage.test.tsx MSW mock:35](apps/web/tests/pages/AdminPage.test.tsx#L35) cũng dùng `likes:` nên không catch được drift (mock copy của FE bug, không phải BE real shape).
- **Fix:** FE migrate `likes` → `reactions` 3 sites:
  - `apps/web/src/services/api/admin.ts` L21 — type field `likes: MetricBucket` → `reactions: MetricBucket`.
  - `apps/web/src/pages/AdminPage.tsx` L18 STAT_COLORS key + L67-73 StatCard destructure + label `"LIKES"` → `"REACTIONS"`.
  - `apps/web/tests/pages/AdminPage.test.tsx` L35 MSW mock field rename.
- **Regression test:** `apps/web/tests/pages/AdminPage.test.tsx` — new case `it('regression BUG-006: reads stats.reactions (not stats.likes) — BE renamed field in M11.7 multi-reaction migration')` assert `REACTIONS` label visible + value `287` render + no exception. 5/5 AdminPage + 341/341 full FE suite pass.
- **Lesson learned:** MSW mocks copy from FE consumer's expectations, không phải từ BE actual shape — drift giữa openapi contract và FE consumer escape detection. **Action item (defer to follow-up task):** T-302 OpenAPI cutover (TASKS.md L266) sẽ wire `api.generated.ts` từ openapi.yaml làm source-of-truth, eliminate hand-typed drift. Trong khi chờ T-302, regression test cho BUG-006 đảm bảo specific field `reactions` không tự ý đổi lại.

### [BUG-005] [High] [BE] REPLY notification missing — replies fire wrong COMMENT notification to post author

- **Status:** FIXED
- **Reporter:** khatran (post-T-343 audit) — **Date:** 2026-05-25
- **Environment:** local + preview + production / Layer: BE
- **Related task:** T-379 (DONE 2026-05-25)
- **Related FR/component:** FR-14.1 + FR-03.6 L377 / `apps/api/src/comments/comments.service.ts` L210-230
- **Mô tả:** Khi user reply 1 comment, BE luôn fire `NotificationType.COMMENT` đến `post.authorId` thay vì `NotificationType.REPLY` đến parent comment author. Parent comment author KHÔNG nhận notification khi có reply. Post author nhận sai COMMENT spam cho mọi reply trong thread.
- **Steps to reproduce:**
  1. User A (postauthor) tạo post P
  2. User B comment top-level on P → notification COMMENT đến A ✓ (đúng)
  3. User C reply comment của B trên P → **BUG:** notification COMMENT đến A (sai recipient + sai type); B KHÔNG nhận gì
- **Expected:** Step 3 fires `NotificationType.REPLY` đến B (parent author) với `metadata.replyTo: { username: '<C.username>' }`.
- **Actual:** Step 3 fires `NotificationType.COMMENT` đến A. B không có notification.
- **Root cause:** T-343 BE migration thêm `parentId` field + depth validation nhưng **MISS implement REPLY notification branch logic** trong `create()`. Notification hook chưa được update để check `dto.parentId` và switch recipient/type. Lý do miss: spec REQUIREMENTS.md L377 + L552 chỉ note ở margin, dễ overlook trong main implementation work. Audit post-T-343 catch được.
- **Fix:** Refactor `comments.service.ts` `create()` — declare `parentForNotify` ở outer scope, branch notification logic:
  - `dto.parentId` set + parent.userId exists + !== viewer.userId → REPLY notification to parent author với `metadata.replyTo`
  - Parent anonymous (userId null) hoặc self-reply → skip notification
  - Top-level (no parentId) → COMMENT to post author (giữ existing behavior)
- **Regression test:** `apps/api/tests/comments/comments.service.spec.ts` — 2 new cases trong `describe('reply (FR-03.6)')`:
  - `it('regression FR-14.1: reply triggers REPLY notification to parent author (NOT COMMENT to post author)', ...)`
  - `it('regression FR-14.1: skip REPLY notification nếu parent comment anonymous (userId null)', ...)`
- **Lesson learned:** Khi implement migration tasks (T-343 style), KHÔNG chỉ implement schema + DTO validation — cần audit side-effects (notification hooks, activity log) per spec. Cross-ref FR-14 series trong REQUIREMENTS khi touch notification-trigger paths.

### [BUG-001] [High] [FE] ReactionPicker biến mất khi hover qua gap → user không chọn được reaction

- **Status:** FIXED
- **Reporter:** khatran — **Date:** 2026-05-25
- **Environment:**
  - Browser/OS: Chrome/Safari (any modern) / macOS / desktop
  - App version: v0.4.0-alpha post-T-317 commit `84835bd`
  - Env: local + preview + production
  - Layer impacted: FE
- **Related task:** T-340 (DONE 2026-05-25)
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
- **Related task:** T-341 (DONE 2026-05-25)
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
- **Related task:** T-342 (DONE 2026-05-25)
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
  - `cd4869c` PostHeader + PostPreview: apply cùng pattern (`inline-flex items-center` + `leading-none` + `text-mono-sm` + `padding: 1px 6px` + `border-ora/50 bg-ora/[0.06]`).
- **Regression test:** N/A — CSS-only styling fix (padding + font-size class swap + bg tint). jsdom KHÔNG render font baseline metric chính xác → class assertion test (vd `toHaveClass('text-mono-sm')`) chỉ verify code intent, không verify visual outcome. Visual verified manually 3 sites browser side-by-side với `design-file/MyBlog Profile.html L488` spec. Documented exception to CLAUDE.md F3 regression test mandate (pure-CSS visual fix). Future option: thêm Playwright screenshot test trong E2E suite nếu badge alignment regress lần nữa.
- **Lesson learned:**
  - Bracket badges với mono font luôn cần `leading-none` + `inline-flex items-center` để vô hiệu hóa font baseline drift.
  - Tránh `text-mono-xs` (9px) cho bracketed text — quá nhỏ, baseline render không ổn định cross-browser.
  - Khi fix UI bug đa-site (cùng pattern dùng nhiều nơi), `grep` tất cả call sites trước khi commit để tránh fix-cục-bộ rồi miss spots khác.

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
