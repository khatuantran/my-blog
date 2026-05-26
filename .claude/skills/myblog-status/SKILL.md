---
name: myblog-status
description: Báo cáo tiến độ MyBlog gộp 4 góc nhìn — (1) task đang DOING/BLOCKED, (2) summary milestone + % hoàn thành, (3) open bugs (Critical/High ưu tiên + hotfix pending RCA), (4) gợi ý task tiếp theo (P0→P1→P2, dep-aware, prefer current milestone). Kích hoạt khi user hỏi "tiến độ", "status", "project đến đâu", "task tiếp", "làm gì tiếp", "task nào nên làm", "còn gì chưa xong", "summary task", "báo cáo dự án", "report task", hoặc bất kỳ câu hỏi tổng quan trạng thái dự án. Read-only — KHÔNG tự edit docs/code, chỉ tổng hợp + đề xuất. Source: `docs/TASKS.md` + `docs/BUGS.md` + `docs/PROGRESS.md`.
---

# MyBlog Project Status

Skill 1-shot read-only tổng hợp trạng thái dự án cho user. Không tự thực thi task — chỉ trả lời câu hỏi "đang đến đâu / làm gì tiếp".

---

## Bước 1: Đọc 3 nguồn

Chạy song song (parallel tool calls) để giảm latency:

```bash
# Tasks DOING/BLOCKED (bỏ header line + template line)
grep -nE "^\s*-\s*\[T-[0-9]+\].*\b(DOING|BLOCKED)\b" docs/TASKS.md

# Open bugs (loại trừ FIXED không có "pending RCA")
grep -nE "^\s*-\s*\[BUG-[0-9]+\].*\b(OPEN|IN_PROGRESS|pending RCA)\b" docs/BUGS.md

# Milestone table + completion %
grep -nE "^(##\s*Trạng thái|^\|\s*M[0-9])" docs/PROGRESS.md | head -25

# TODO candidates trong current milestone (skip SUPERSEDED + DONE)
grep -nE "^\s*-\s*\[T-[0-9]+\].*(TODO|^\s*-\s*\[T-)" docs/TASKS.md | grep -v "DONE\|SUPERSEDED" | head -30
```

Đọc full block của candidate task khi cần kiểm tra `Depends on` field.

## Bước 2: Phân loại + check dep

### Suggest priority order

1. **F4 Hotfix pending RCA** (BUGS.md "FIXED (hotfix, pending RCA)") → propose Phase B trong 24h **trước mọi task khác**
2. **BUG Critical/High OPEN hoặc IN_PROGRESS** → propose F3 fix
3. **Task DOING** đang dang dở → continue thay vì pick task mới
4. **TODO P0 → P1 → P2 → P3**, lọc bằng:
   - `Depends on: T-XXX` — chỉ suggest khi all deps là DONE (hoặc SUPERSEDED bởi task khác đã DONE)
   - **Prefer current milestone** (milestone status `🟡 Doing` trong PROGRESS.md) — task ngoài milestone hiện tại đặt cuối

### Dep check pattern

Khi entry có `Depends T-XXX + T-YYY`:

```bash
grep -nE "^\s*-\s*\[T-(XXX|YYY)\]" docs/TASKS.md  # check status field
```

Nếu bất kỳ dep nào không DONE → skip task này, hoặc note kèm warning "blocked by T-XXX".

## Bước 3: Output template

ALWAYS dùng đúng cấu trúc dưới (markdown, link clickable theo path):

```
## 📊 Project Status — kha.blog
> <YYYY-MM-DD> · <milestone-completion>% · M11.9 in progress

### 🔄 In Progress
- [[T-XXX](docs/TASKS.md)] [P1] [F1] [FE] <title> — DOING
(— none — nếu trống)

### 🚧 Blocked
- [[T-XXX](docs/TASKS.md)] blocker: <reason>
(— none —)

### 🐛 Open Bugs
- [[BUG-XXX](docs/BUGS.md)] [Critical] [FE] <title> → Refs T-YYY
(— none —)
⚠️ Hotfix pending RCA: [BUG-ZZZ] — Phase B chưa hoàn tất → cần làm trong 24h

### 📈 Milestones
| #     | Milestone                            | Status   | Target     |
|-------|--------------------------------------|----------|------------|
| M11.9 | Design-file phase 2 polish (18 task) | 🟡 Doing | 2026-06-26 |
| M13   | Deploy Vercel + Fly + Neon + CI/CD   | ⬜ Todo  | TBD        |
| ...   | ...                                  | ...      | ...        |

(2-4 milestone gần nhất; bỏ ✅ Done quá lâu trừ khi user hỏi full)

### 💡 Suggested Next (top 3)

1. **[T-XXX]** [P1] [F1] [FE] `<title>`
   - Lý do: priority cao nhất trong M11.9, deps DONE (T-AAA, T-BBB), no blockers
   - Estimate: ~<2h>
   - Files chính: `apps/web/src/...`

2. **[T-YYY]** [P2] [F1] [Both] `<title>`
   - Lý do: deps DONE, current milestone, tiếp nối flow vừa làm
   - ...

3. **[T-ZZZ]** [P2] [F5] [FE] `<title>`
   - Lý do: refactor nhẹ, no test mới, có thể xen vào giữa feature task để giảm fatigue

### 🎯 Next move recommendation
**→ Bắt đầu T-XXX**: <1-2 câu giải thích why now (deps fresh / momentum / unblock downstream / business value)

---
Need full task list? `grep "TODO" docs/TASKS.md | head -50`
Need bug detail? Read [docs/BUGS.md](docs/BUGS.md).
```

## Bước 4: Edge cases

| Tình huống                      | Cách xử lý                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 0 task DOING                    | "— none —" trong section In Progress, suggest mạnh hơn (top 3 + rationale chi tiết)                                 |
| Có hotfix pending RCA           | **ƯU TIÊN TUYỆT ĐỐI** ở top suggested — đẩy lên trước Top 1, đỏ + bold                                              |
| TODO list quá dài (>30)         | Chỉ show 3 best candidate + footnote `grep TODO docs/TASKS.md \| wc -l = N` còn lại                                 |
| User hỏi specific milestone     | Filter task theo section milestone đó, show tỉ lệ X/Y task DONE                                                     |
| User hỏi "ETA" / "khi nào xong" | KHÔNG đoán ngày — explain chỉ ước tính dựa trên velocity 7d gần nhất từ PROGRESS.md weekly log + remaining task qty |
| Task có `SUPERSEDED by T-XXX`   | Skip — đề cập T-XXX thay thế nếu T-XXX còn TODO                                                                     |
| Không tìm thấy task nào suggest | "Sprint clean — milestone hiện tại có thể đã DONE. Recheck PROGRESS.md milestone table."                            |

## Bước 5: Cấm

- KHÔNG tự `Edit` TASKS.md / BUGS.md / PROGRESS.md (skill read-only). Nếu user muốn mark DOING → delegate sang [[myblog-task-implement]].
- KHÔNG suggest task có dep chưa DONE — phải kiểm tra explicit.
- KHÔNG đoán milestone % nếu PROGRESS.md có sẵn — đọc dòng "Trạng thái tổng" thẳng.
- KHÔNG bỏ qua hotfix pending RCA dù user không hỏi — luôn surface lên top.
- KHÔNG output trên 100 dòng cho 1 report — long-form chi tiết tách sang follow-up question.

---

## Examples

### Example 1: User hỏi tổng quan

User: `tiến độ dự án đang như thế nào?`
→ Đọc 3 docs → output full template với 5 sections.

### Example 2: User hỏi specific

User: `task tiếp theo nên làm gì?`
→ Skip In Progress / Milestones (hoặc thu gọn), focus mạnh vào Suggested Next + Next move recommendation.

### Example 3: User trong session đang code

User: `xong T-XYZ rồi, làm gì tiếp?`
→ Verify T-XYZ status (nếu chưa DONE → nhắc commit qua [[myblog-commit-helper]] trước), rồi suggest task tiếp theo trong M11.9 với deps fresh (giữ momentum).

### Example 4: Hotfix pending

User: `status dự án`
BUGS.md có `BUG-006 FIXED (hotfix, pending RCA)` → bắt buộc surface warning bold ở đầu Open Bugs section + suggest "Phase B RCA cho BUG-006" làm task TOP suggested, vượt mọi feature task.

---

## Tham chiếu

- [CLAUDE.md > Session Bootstrap](CLAUDE.md) — Claude đã đọc TASKS/BUGS/PROGRESS đầu mỗi session, skill này tổng hợp + format đẹp
- [CLAUDE.md > Flow Router](CLAUDE.md) — context phân biệt F1-F7 khi đề xuất task
- Sibling skills:
  - [[myblog-task-implement]] — khi user chọn 1 task để execute
  - [[myblog-bug-logger]] — nếu phát hiện bug mới chưa log
  - [[myblog-commit-helper]] — nếu task DOING cần commit trước
