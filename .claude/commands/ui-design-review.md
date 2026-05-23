Review UI fidelity: so sánh UI code FE (`apps/web`) với prototype trong `design-file/` cho screen **$ARGUMENTS** — cả VISUAL lẫn BEHAVIOR, bằng cách render thực tế cả hai rồi đối chiếu (không chỉ đọc code).

Dùng skill **webapp-testing** (Playwright) cho mọi thao tác mở browser / screenshot / interact.

`$ARGUMENTS` = `[<Screen>] [route]`:

- `<Screen>`: tên screen (vd "Feed", "Profile", hoặc screen mới bất kỳ trong design-file/).
- `route` (tùy chọn): override route khi auto-match không ra.

---

## Bước 1: Resolve target — DISCOVERY ĐỘNG (không hardcode screen)

Mỗi lần chạy đều tự phát hiện, để screen thêm mới về sau tự nhận:

1. `ls design-file/*.html` → tập screen design hiện có (bỏ prefix `MyBlog ` + `.html` → tên screen).
2. Đọc `apps/web/src/routes.tsx` → tập (path, lazy page) hiện có.
3. Auto-match screen ↔ route bằng normalize tên (bỏ space, lowercase): vd "Create Post"→CreatePostPage→`/admin/create`, "Feed"→HomePage→`/`.
4. Nếu có arg `route` thứ 2 → dùng luôn, bỏ qua auto-match.
5. Resolve nguồn:
   - Screen rỗng → suy từ `git diff --name-only HEAD -- apps/web/`; nhiều/không rõ → AskUserQuestion liệt kê screen discover được từ design-file/.
   - Match route không chắc / screen mới chưa có route → AskUserQuestion xác nhận route (hoặc yêu cầu truyền arg `route`).
6. Auth/seed suy từ route node:
   - Node bọc `ProtectedRoute requireRole=X` → cần login role X trước (seed `admin`/`admin`).
   - Path có `:id` / `:username` → lấy giá trị thật từ `apps/api/prisma/seed-test.ts`.

Báo: `Target: design-file/MyBlog <Screen>.html ↔ route <path> (auth: <none/ADMIN>, param: <…>)`.

## Bước 2: Render DESIGN reference

- Mở `design-file/MyBlog <Screen>.html` qua `file://` trong Playwright (QUOTE tên có space).
- Screenshot full-page @ desktop 1440px; thêm mobile 390px nếu screen responsive.
- Nếu prototype không render được (Babel/CDN offline) → fallback: đọc HTML + `design-file/myblog-shared-ui.jsx` + `myblog-components.jsx` để trích layout, token, mock data, interaction dự kiến.
- Ghi lại behavior prototype quan sát được: hover/focus, ⌘K command palette, click, form, loading/empty/error — đối chiếu state machine của screen trong `docs/UI_DESIGN.md`.

## Bước 3: Render FE actual

- Đảm bảo dev server chạy: `pnpm --filter web dev` (http://localhost:5173). Chưa chạy → khởi động background, chờ ready. Server/seed chưa sẵn → báo rõ thay vì fail câm.
- Xử lý auth/data theo Bước 1.6 (login role nếu cần; dùng id/username seed cho route có param).
- Navigate đúng route, screenshot CÙNG viewport như Bước 2.

## Bước 4: So sánh VISUAL

Đối chiếu design vs FE, liệt kê điểm lệch:

- Layout & spacing (TopBar 52px / StatusBar 28px, grid, padding, alignment)
- Màu sắc — phải khớp token trong `docs/DESIGN_SYSTEM.md` (bắt hardcode lệch token)
- Typography (JetBrains Mono, size, weight, line-height)
- Component: có mặt đủ + đúng thứ tự + đúng variant
- Hiệu ứng đặc trưng (CRT scanline overlay, neon glow, border)
- Responsive tại breakpoint

## Bước 5: So sánh BEHAVIOR

Tái hiện trên FE từng interaction từ prototype + `docs/UI_DESIGN.md`:

- Hover/focus state + transition
- ⌘K command palette, keyboard navigation
- Form validation + cách hiển thị error
- Optimistic update (like/save/comment) nếu screen có
- Loading / empty / error state
  Note interaction nào FE thiếu hoặc khác.

## Bước 6: Report

```
## 🎨 UI Design Fidelity — <Screen>
Design: design-file/MyBlog <Screen>.html | FE: <route>
Screenshots: <path design> | <path FE>

### Visual
| Aspect | Design | FE actual | Match | Severity | Fix |
|--------|--------|-----------|-------|----------|-----|

### Behavior
| Interaction | Design | FE | Match | Fix |
|-------------|--------|----|----|-----|

### Kết luận: ✅ khớp / ⚠️ lệch nhẹ / ❌ lệch lớn — [action items]
```

Screenshot lưu `/tmp/ui-review-<screen>/`. **Không tự sửa code** — chỉ report (trừ khi user yêu cầu fix sau đó).

Tham chiếu: `design-file/` (prototype tham khảo trực quan — đối chiếu, không authoritative), `docs/UI_DESIGN.md` (spec screen + behavior/state), `docs/DESIGN_SYSTEM.md` (token).
