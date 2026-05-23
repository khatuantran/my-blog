---
name: myblog-docs-audit
description: Enforce docs reading and pre-flight audit BEFORE any MyBlog project task. Use this skill at the start of EVERY task request in the MyBlog codebase — "implement X", "add feature", "fix bug", "refactor", "thêm", "sửa", "build". The skill reads PROGRESS.md, TASKS.md, BUGS.md, runs a pre-flight checklist, and blocks coding if docs are out of sync. Do NOT skip this skill even if the task seems small.
---

# MyBlog Docs Audit

Skill này thực thi Session Bootstrap + Flow Router + Pre-flight Checklist cho MỌI task.

> **Nguyên tắc:** Các rule chi tiết là SOURCE OF TRUTH trong `CLAUDE.md` (đã auto-load mỗi session). Skill này KHÔNG chép lại — chỉ orchestrate (chạy lệnh, đọc file) và xuất report. Khi cần rule cụ thể, đọc thẳng mục tương ứng trong CLAUDE.md đang có sẵn trong context.

---

## Phase 1: Session Bootstrap

Thực thi đúng **CLAUDE.md > Session Bootstrap** (đọc theo thứ tự). Lệnh cụ thể:

```bash
grep -nE 'DOING|BLOCKED' docs/TASKS.md
grep -nE 'OPEN|IN_PROGRESS|FIXED \(hotfix, pending RCA\)' docs/BUGS.md
```

Đọc `docs/PROGRESS.md` (milestone + %). Đọc thêm REQUIREMENTS/DATA_MODEL/API_CONTRACT nếu prompt touch FR/DB/API (theo Session Bootstrap).

**Output report (giá trị riêng của skill — luôn xuất):**

```
📋 Session Status
- Task DOING : [T-XXX: title] hoặc "none"
- Bugs OPEN  : [BUG-XXX: title, ...] hoặc "none"
- Hotfix RCA : [BUG-XXX] ← nếu có → STOP, nhắc hoàn tất F4 Phase B trước (CLAUDE.md F4)
- Milestone  : [M-X: name] | Tổng: [N]%
```

---

## Phase 2: Flow Router

Phân loại task F1-F7 theo **CLAUDE.md > Flow Router** — gồm rule "KHÔNG tin keyword, luôn verify" + test code-match-spec (bug vs change request). KHÔNG tự đoán; không chắc → AskUserQuestion.

Output: `🔀 Flow: F[N] — [lý do]`

---

## Phase 3: Pre-flight Checklist

Chạy **CLAUDE.md > Pre-flight Checklist** (13 mục, đã auto-load — không lặp lại ở đây). Đối chiếu từng mục applicable với task hiện tại.

Output:

```
✅ Pre-flight: [N/M mục applicable pass] — [PASS / 🚫 BLOCKED]
```

Nếu BLOCKED:

```
🚫 Pre-flight FAILED
- Thiếu: [mục cụ thể trong checklist]
- Cần làm: [hành động]
Tôi hoàn tất [step] trước khi code. Proceed? (Recommended)
```

KHÔNG viết code đến khi mọi mục applicable pass (Strict Enforcement — CLAUDE.md).

---

## Phase 4: Docs cần đọc trước khi implement

Theo **CLAUDE.md / INDEX.md > Doc Update Trigger** — map scope task → doc cần đọc (DB→DATA_MODEL, endpoint→API_CONTRACT+openapi, UI→UI_DESIGN, component→DESIGN_SYSTEM, arch→ARCHITECTURE, test→TESTING_STRATEGY). Đọc các doc liên quan, rồi confirm:

`📚 Đã đọc: [list]`

---

## Output tổng hợp

```
📋 [T-XXX DOING / none] | bugs: [N] | hotfix RCA: [Y/N] | milestone: M-X [N%]
🔀 Flow: F[N] [type] | Layer: [FE/BE/Both/Infra/Docs]
✅ Pre-flight: [N/M] — [PASS / BLOCKED: reason]
📚 Docs đọc: [list]
▶  Sẵn sàng implement / ⛔ Cần hoàn tất [action] trước
```
