---
name: myblog-bug-logger
description: Log bug vào BUGS.md đúng template + tạo task T-XXX tương ứng cho MyBlog project (flow F3 Bug Fix / F4 Hotfix). Kích hoạt khi user báo bug — "có bug", "bị lỗi", "sai rồi", "prod down", "không dùng được", "log bug này", hoặc khi phát hiện behavior sai vs spec. Phân biệt F3 (bug thường) vs F4 (hotfix prod critical), assign BUG-XXX, fill template đầy đủ (severity, steps, expected/actual, RCA, regression test path), tạo task với priority theo severity (Critical→P0...Low→P3). Trước khi log phải verify đây thật sự là bug (code sai vs spec), không phải change request.
---

# MyBlog Bug Logger

Log bug vào `docs/BUGS.md` + tạo task `docs/TASKS.md`. Rule flow chi tiết là SOURCE OF TRUTH ở `CLAUDE.md > F3/F4` (auto-load) — skill lo workflow assign/fill/output.

---

## Bước 0: Verify đây THẬT SỰ là bug (gate)

Chạy test code-match-spec theo **CLAUDE.md > Flow Router** + [[feedback_bug_vs_change_request]]:

- Code **match** spec (REQUIREMENTS AC + CHANGELOG) → user muốn ĐỔI spec → **F2 change request**, KHÔNG log BUGS.md. Dừng, propose F2.
- Code **không match** spec → đúng là bug → tiếp.
- Không reproduce được → `WONT_FIX` + lý do, không tạo task fix.

## Bước 1: F3 vs F4

Theo **CLAUDE.md > F4** (prod down + Critical + fix <1h = F4 hotfix, branch `hotfix/<name>`; còn lại F3). Output: `Flow: F3 / F4`.

## Bước 2: Assign BUG-XXX + Severity

```bash
grep -oE 'BUG-[0-9]+' docs/BUGS.md | sort -u | tail -5
```

Số kế tiếp. Severity: Critical (prod down/mất data/security/core chết) | High (feature chính lỗi có workaround) | Medium (feature phụ/UX) | Low (cosmetic/edge hiếm).

## Bước 3: Fill template vào section Open của BUGS.md

Dùng **đúng template trong `docs/BUGS.md`** (header `[BUG-XXX] [Severity] [Layer] <title>`, Status, Reporter+Date ISO, Environment, Related task/FR, Mô tả, Steps, Expected/Actual, Root cause để trống, Regression test để trống). F4 emergency → Status `IN_PROGRESS`. Thông tin user chưa cấp (steps/env) → HỎI, đừng bịa.

## Bước 4: Tạo task T-XXX

```bash
grep -oE 'T-[0-9]+' docs/TASKS.md | sort -u | tail -5
```

Priority map theo severity: **Critical→P0, High→P1, Medium→P2, Low→P3**. Entry:

```
[T-XXX] [P0-P3] [F3|F4] [FE|BE|Both|Infra] Fix BUG-XXX: <title> — DOING (YYYY-MM-DD)
```

Cross-link: BUGS.md `Related task: T-XXX` ↔ TASKS.md `Fix BUG-XXX`.

## Bước 5: Nhắc bước tiếp của flow

Theo **CLAUDE.md > F3** (RCA → fix → regression test BẮT BUỘC `it('regression BUG-XXX: ...')` → update BUGS/TASKS/PROGRESS/CHANGELOG → commit `fix:` + `Fixes: BUG-XXX`) hoặc **F4** (Phase A deploy + mark `FIXED (hotfix, pending RCA)` → Phase B <24h: RCA + regression test + bỏ "pending RCA"). Nhắc: Session Bootstrap sau sẽ grep "pending RCA" → đừng quên Phase B.

---

## Output Report

```
🐞 Bug logged
- ID       : BUG-XXX
- Severity : <…> → Priority P<N>
- Layer    : <FE/BE/Both/Infra>
- Flow     : F3 / F4
- Task     : T-XXX (DOING)
- Next     : <RCA + fix + regression test> / <F4 Phase A → Phase B>
```

---

## Tham chiếu

- `docs/BUGS.md` — template (source of truth cho field)
- `CLAUDE.md > F3 / F4` — flow chi tiết
- `CLAUDE.md > Testing > Regression Test` + `feedback_bug_vs_change_request`
