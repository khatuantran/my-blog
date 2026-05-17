# Bug Tracker

> Format: `[BUG-ID] [Severity] Title - Status`
> Severity: `Critical` | `High` | `Medium` | `Low`
> Status: `OPEN` | `IN_PROGRESS` | `FIXED` | `FIXED (hotfix, pending RCA)` | `WONT_FIX`
> Affected layer: `FE` | `BE` | `Both` | `Infra`

## Open

_(Chưa có bug)_

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
- **Fix:** <commit hash / PR khi đã fix>
- **Regression test:** <file path test reproduce bug — BẮT BUỘC theo CLAUDE.md Testing Rules>
- **Lesson learned (optional):** <nếu là architectural issue, add ADR vào ARCHITECTURE.md>
```
