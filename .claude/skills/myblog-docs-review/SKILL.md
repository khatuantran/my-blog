---
name: myblog-docs-review
description: Review docs vừa được update trong MyBlog project để kiểm tra xem có follow đúng SDD process và template yêu cầu chưa. Kích hoạt sau mỗi lần update docs — khi user nói "review doc", "check doc", "xong doc", "đã update", hoặc khi Claude vừa sửa file trong docs/. Kiểm tra template đúng format, cross-reference giữa các doc, và language convention. Không bỏ qua kể cả update nhỏ.
---

# MyBlog Docs SDD Review

Skill này review các file docs vừa thay đổi để đảm bảo tuân thủ SDD process trong CLAUDE.md và INDEX.md.

---

## Bước 1: Xác định docs đã thay đổi

```bash
git diff --name-only HEAD -- docs/
git diff --name-only --cached -- docs/
```

List ra file docs nào vừa thay đổi. Nếu không có file nào → report "Không có docs thay đổi."

---

## Bước 2: Check từng doc theo template

Đọc từng file đã thay đổi và verify theo checklist tương ứng:

### TASKS.md

Mỗi task entry mới/sửa phải có:

- [ ] Format: `[T-XXX] [P0-P3] [F1-F7] [FE/BE/Both/Infra/Docs] <title> — STATUS (YYYY-MM-DD)`
- [ ] `Flow` label đúng F1-F7
- [ ] `Affected layer` đúng: `FE | BE | Both | Infra | Docs`
- [ ] Status hợp lệ: `TODO | DOING | DONE | BLOCKED`
- [ ] Nếu `DONE`: có ngày (YYYY-MM-DD), **KHÔNG có commit hash** (git log là source of truth)
- [ ] Nếu `BLOCKED`: có ghi rõ lý do / dependency

### BUGS.md

Mỗi bug entry mới/sửa phải có:

- [ ] Format header: `[BUG-XXX] [Severity] [Layer] <title> — Status`
- [ ] Severity: `Critical | High | Medium | Low`
- [ ] Status: `OPEN | IN_PROGRESS | FIXED | FIXED (hotfix, pending RCA) | WONT_FIX`
- [ ] Affected layer: `FE | BE | Both | Infra`
- [ ] Steps to reproduce (numbered list)
- [ ] Expected behavior vs Actual behavior
- [ ] Environment (browser/OS, local/preview/prod, layer impacted)
- [ ] Nếu `FIXED`: có `Root cause` field + `Regression test` path (KHÔNG cần commit hash)
- [ ] Nếu `FIXED (hotfix, pending RCA)`: chưa có root cause đầy đủ — F4 Phase B chưa xong
- [ ] Nếu `WONT_FIX`: có lý do rõ ràng

### API_CONTRACT.md

Mỗi endpoint mới/sửa phải có Notes column với:

- [ ] Body shape cụ thể: field names + types (vd: `{ title: string, mood: Mood, tags: string[] }`)
- [ ] Key response fields (vd: `returns { id, title, author, createdAt }`)
- [ ] Status codes chính (vd: `201 Created | 400 Bad Request | 401 Unauthorized`)
- [ ] **KHÔNG** generic kiểu "Issue X", "Remove Y", "Handle Z" — phải đủ để FE implement mà không đọc code BE
- [ ] Nếu endpoint có guard → ghi rõ auth requirement

### DATA_MODEL.md

Mỗi entity mới/sửa phải có:

- [ ] Entity section với tên + description
- [ ] Fields list với types
- [ ] Prisma schema snippet (relevant fields)
- [ ] Migration log summary entry nếu có schema change
- [ ] Enum mới → ghi vào Enums section

### DESIGN_SYSTEM.md

Mỗi component/token mới phải có:

- [ ] Component spec: tên, variants, props (types), usage example
- [ ] Design token mới: tên token + value + context sử dụng
- [ ] Token Change History entry nếu token bị sửa giá trị
- [ ] Component không được defined trong DESIGN_SYSTEM.md trước khi có code → verify thứ tự đúng

### ARCHITECTURE.md

Mỗi architecture decision/change phải có:

- [ ] ADR mới với format: `## ADR-N: <title>` + `Status | Context | Decision | Consequences`
- [ ] ADR `Status`: `Proposed | Accepted | Deprecated | Superseded by ADR-X`
- [ ] Diagram/C4 section update nếu structural change
- [ ] Cross-link với TASKS.md task liên quan

### PROGRESS.md

Mỗi weekly log entry phải có:

- [ ] Date header format: `YYYY-MM-DD`
- [ ] `Done:` section với bullet list
- [ ] Milestone % cập nhật nếu milestone thay đổi trạng thái
- [ ] Milestone status icons đúng: `⬜ Todo | 🟡 Doing | ✅ Done | 🔴 Blocked`

### CHANGELOG.md

Mỗi entry mới phải có:

- [ ] Nằm trong `[Unreleased]` section (chưa release)
- [ ] Subsection đúng theo flow:
  - F1 New Feature → `### Added`
  - F2 Amend → `### Added` hoặc `### Changed`
  - F3 Bug Fix → `### Fixed`
  - F4 Hotfix → `### Fixed` với note `(hotfix YYYY-MM-DD)`
  - F5 Refactor → `### Changed`
  - F7 Chore nếu user-facing → `### Changed` hoặc `### Security`
- [ ] Entry ngắn gọn, mô tả từ góc nhìn user (không là technical detail)
- [ ] Không có entry trùng lặp

### DEPLOYMENT.md

Nếu có env var mới:

- [ ] Env var xuất hiện trong Quick Start setup section
- [ ] Env matrix table có entry mới (local / preview / prod value)
- [ ] `.env.test` stub nếu cần cho integration test

---

## Bước 3: Cross-reference Check

Dựa vào Doc Update Trigger (INDEX.md), verify đồng bộ giữa các docs:

| Nếu doc này thay đổi              | Phải kiểm tra thêm                                     |
| --------------------------------- | ------------------------------------------------------ |
| TASKS.md có `DONE`                | PROGRESS.md + CHANGELOG.md cũng update?                |
| BUGS.md có `FIXED`                | CHANGELOG.md `### Fixed` có entry?                     |
| BUGS.md có bug mới `OPEN`         | TASKS.md có task F3 tương ứng?                         |
| API_CONTRACT.md thay đổi          | `docs/contracts/openapi.yaml` được regenerate?         |
| DATA_MODEL.md thay đổi            | `apps/api/docs/MIGRATIONS.md` có per-migration detail? |
| DESIGN_SYSTEM.md có component mới | UI_DESIGN.md có screen reference?                      |
| ARCHITECTURE.md có ADR mới        | CHANGELOG.md hoặc TASKS.md có reference?               |

Cross-cut rule: nếu nhiều doc phải update cùng nhau → phải cùng 1 commit, không tách lẻ.

---

## Bước 4: Language Convention Check

Verify trên tất cả docs vừa thay đổi:

- [ ] **Heading**: English (`## Architecture`, `### Database Schema`, `## Fixed`)
- [ ] **Body**: Tiếng Việt (mô tả, giải thích)
- [ ] **Technical term**: giữ nguyên English (endpoint, migration, DTO, guard, hook, schema, ...)
- [ ] **Date format**: `YYYY-MM-DD` (ISO) — không dùng `DD/MM/YYYY` hoặc relative date
- [ ] **Code/identifier**: English (field names, class names, enum values, ...)

---

## Bước 5: Output Report

```
## 📄 Docs SDD Review

**Docs thay đổi**: [list file]

### ✅ Đúng format
- [file]: [rule passed — ngắn gọn]

### ❌ Vi phạm template/process
| # | Doc | Rule vi phạm | Chi tiết | Cách fix |
|---|-----|-------------|---------|---------|
| 1 | TASKS.md | Thiếu `Affected layer` | T-305 không có [FE/BE/Both] | Thêm [BE] vào header task |
| 2 | API_CONTRACT.md | Notes generic | `POST /posts` Notes ghi "Issue body" | Ghi body shape: `{ title: string, mood: Mood }` |

### ⚠️ Cross-reference thiếu
- [ví dụ: TASKS.md có T-305 DONE nhưng CHANGELOG.md chưa có entry]

### 🌐 Language convention
- [pass / vi phạm cụ thể]

### 📌 Action items
1. Sửa [vi phạm #1]: ...
2. Update [cross-reference thiếu]: ...
```

Nếu tất cả pass: `✅ Docs review passed — N files, N checks, 0 violations. SDD process followed correctly.`

---

## Tham chiếu

- `docs/INDEX.md` — Doc Update Trigger table + cross-reference rules
- `CLAUDE.md > Doc Language Convention` — language rules
- `CLAUDE.md > F1-F7 flows > Update Docs After` — template requirements per flow
