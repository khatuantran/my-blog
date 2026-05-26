---
name: myblog-task-implement
description: Orchestrator để implement 1 task T-XXX end-to-end theo SDD flow F1-F7 của MyBlog. Kích hoạt khi user nói "implement task T-XXX", "làm task T-XXX", "start T-XXX", "execute T-XXX", "tiếp tục task", hoặc khi user yêu cầu code 1 feature/fix mà task entry đã có sẵn trong TASKS.md. Skill kiểm tra docs design step DONE trước khi code (Pre-flight Gate), code theo CODING_CONVENTION, viết test BẮT BUỘC theo flow (F1/F3/F4=test mới, F5=test cũ làm contract, F7=smoke), update docs theo Doc Update Trigger, rồi report check-list lại cho user. KHÔNG tự commit — delegate sang [[myblog-commit-helper]] để user duyệt message.
---

# MyBlog Task Implementer

Orchestrate 1 task T-XXX qua đủ lifecycle: **docs-check → code → test → docs-update → report**. Rule flow F1-F7 + Pre-flight Checklist + Doc Update Trigger là SOURCE OF TRUTH ở `CLAUDE.md` (auto-load) — skill này lo workflow, không lặp rule.

---

## Bước 0: Locate task entry

User cung cấp T-XXX hoặc skill auto-suy (1 task `DOING` duy nhất trong TASKS.md):

```bash
grep -nE "^- \[T-XXX\]|^### \[T-XXX\]" docs/TASKS.md
```

Đọc full entry để extract:

- **Flow** (F1/F2/F3/F4/F5/F6/F7) — quyết định doc gate + test requirement
- **Affected layer** (FE/BE/Both/Infra/Docs) — quyết định review skill nào sau
- **Depends on** — nếu prerequisite chưa DONE → **STOP** + báo user, không tự sửa thứ tự
- **Acceptance criteria + file paths** — checklist khi code
- **Related FR/UC/BUG** — để cross-link footer commit

Không tìm thấy task / status không `DOING` → AskUserQuestion: "T-XXX chưa có entry / status `TODO` — mark `DOING` ngay rồi tiếp?"

## Bước 1: Pre-flight Gate (TRƯỚC khi viết dòng code đầu tiên)

Chạy đủ checklist `CLAUDE.md > Pre-flight Checklist`. Map theo flow:

| Flow | Doc gate BẮT BUỘC trước code                                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| F1   | FR + UC tồn tại; DB→DATA_MODEL; API→API_CONTRACT (Notes column chi tiết); UI screen→UI_DESIGN; UI component/token→DESIGN_SYSTEM; arch→ADR |
| F2   | KHÔNG vào bước code — F2 phải execute trước (clarify→add FR/UC→update design docs→break tasks→user confirm) rồi mới sang F1               |
| F3   | BUGS.md entry tồn tại, status `IN_PROGRESS`/`DOING`; có Related task T-XXX cross-link                                                     |
| F4   | Phase A: chỉ cần entry BUGS.md `IN_PROGRESS` Critical; branch `hotfix/<name>`                                                             |
| F5   | Test hiện tại pass 100% (baseline); ADR nếu đổi pattern                                                                                   |
| F6   | Identify scope doc; verify accuracy vs code thực tế                                                                                       |
| F7   | Risk check minor vs major bump                                                                                                            |

Bất kỳ gate nào FAIL → **STOP**, delegate sang [[myblog-docs-audit]] hoặc nhắc user update doc thiếu, rồi quay lại. **KHÔNG code khi gate FAIL.**

## Bước 2: Code

Theo `CLAUDE.md > Do NOT` + `docs/CODING_CONVENTION.md`. Touch tối thiểu file cần, KHÔNG refactor ngoài scope task (per CLAUDE.md "Don't add features beyond what the task requires").

Trong khi code, nhắc các rule dễ quên:

- BE: dùng `Logger` (không `console.*`); Prisma enum / `as const` cho enumerated values; KHÔNG `$queryRawUnsafe` với user input.
- FE: dùng `logger` từ `@/lib/logger`; JWT chỉ httpOnly cookie (KHÔNG localStorage); KHÔNG `any` — `unknown` + narrow.
- Touch BE controller/DTO → sau khi code chạy `pnpm openapi:sync` để regenerate `docs/contracts/openapi.yaml` + `apps/web/src/types/api.generated.ts`.

## Bước 3: Test (BẮT BUỘC theo flow)

| Flow       | Test requirement                                                                                                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1         | Unit test mới cho code mới (BE service ≥1 happy + ≥2 error, coverage ≥80%); integration nếu touch controller; FE Vitest cho hook/service/validator/component; DTO/Zod test pos+neg; E2E Playwright nếu user-facing flow mới |
| F3         | Regression test BẮT BUỘC: `it('regression BUG-XXX: <desc>', ...)` — reproduce bug + assert fixed                                                                                                                            |
| F4 Phase A | Skip unit test (smoke manual); Phase B trong 24h BẮT BUỘC regression test                                                                                                                                                   |
| F5         | KHÔNG thêm test mới — test cũ là contract, phải pass 100%                                                                                                                                                                   |
| F6         | Không áp dụng                                                                                                                                                                                                               |
| F7         | Smoke (`pnpm build` + `pnpm dev`) thay vì unit test mới                                                                                                                                                                     |

Chạy test:

```bash
# Chọn 1 trong các pattern sau theo Affected layer + scope
cd apps/web && pnpm exec vitest run <path>
cd apps/api && pnpm exec jest <path>
cd apps/api && pnpm exec jest --config jest-e2e.json <path>
pnpm exec playwright test <path>
```

**Test FAIL** → STOP, follow `CLAUDE.md > Test Failure Rule` (report template chuẩn cause+fix). KHÔNG sửa test để pass (trừ `test-stale-assumption` có giải thích).

Sau khi pass → delegate quick check sang [[myblog-test-review]] nếu user muốn audit test quality (optional).

## Bước 4: Doc Update Trigger

Map theo `CLAUDE.md > Doc Update Trigger`. Cross-cut → update tất cả cùng commit. Check-list:

- [ ] `docs/TASKS.md` → status `DONE` + ngày YYYY-MM-DD (KHÔNG cần commit hash — git log là source of truth)
- [ ] `docs/PROGRESS.md` → weekly log entry
- [ ] `docs/CHANGELOG.md` → `[Unreleased] > Added/Changed/Fixed/Removed/Security/Deprecated`
- [ ] Nếu F3/F4 → `docs/BUGS.md` status `FIXED` + regression test path
- [ ] Nếu BE endpoint → `docs/API_CONTRACT.md` Notes chi tiết (body + key response fields + status codes — KHÔNG generic) + regenerate openapi.yaml
- [ ] Nếu DB migration → `docs/DATA_MODEL.md` + `apps/api/docs/MIGRATIONS.md`
- [ ] Nếu env var mới (kể cả `.env.test` stub) → `docs/DEPLOYMENT.md`
- [ ] Nếu UI screen/component → `docs/UI_DESIGN.md` / `docs/DESIGN_SYSTEM.md`
- [ ] Nếu pattern/arch → ADR vào `docs/ARCHITECTURE.md`

Doc-only delta lớn → delegate audit sang [[myblog-docs-review]] hoặc [[myblog-docs-audit]] tùy scope.

## Bước 5: Layer-specific review (optional, đề xuất khi diff lớn)

Trước khi commit, đề xuất user chạy review skill tương ứng để bắt convention violation:

- BE diff → [[myblog-backend-review]]
- FE diff → [[myblog-frontend-review]]
- OpenAPI changed → [[myblog-contract-sync]] verify yaml vs decorator
- Test mới đáng audit → [[myblog-test-review]]

Skip nếu task nhỏ + user confirm bỏ qua.

## Bước 6: Report

Output checklist cuối, KHÔNG tự commit:

```
✓ Task implemented: T-XXX
- Flow         : F<N> (<New Feature/Bug Fix/...>)
- Layer        : <FE/BE/Both/Infra>
- Files changed: <list path tóm tắt, dùng markdown link [path](path)>
- Tests        : <pass count>/<total>  (mới: <n> case)
- Docs updated : <list — TASKS/PROGRESS/CHANGELOG/[API_CONTRACT/UI_DESIGN/...]>
- Cross-links  : Refs T-XXX / Fixes BUG-XXX / FR-XX UC-YY
- Next         : Delegate sang myblog-commit-helper để draft commit message + commit sau khi user duyệt.
```

Sau report → gọi [[myblog-commit-helper]] (không tự commit). User duyệt message trước khi `git commit`.

---

## Examples

### Example 1: F1 Feature task

User: `implement T-372 ManagePostsPage`
→ Locate T-372 entry: Flow F1, layer FE, depends T-320+T-360+T-361+T-362.
→ Pre-flight: check 4 deps DONE → T-360 ~85%, T-320 TODO → **STOP**, báo user T-320 BE endpoints chưa có, không code FE được.

### Example 2: F3 Bug Fix task

User: `start T-380 fix BUG-006`
→ Locate T-380: Flow F3, layer FE, Related BUG-006 OPEN.
→ Pre-flight pass (BUGS entry tồn tại).
→ Code rename `likes` → `reactions` 3 sites.
→ Test: add `it('regression BUG-006: ...')` + run vitest → pass.
→ Docs: BUGS.md `FIXED` + RCA, TASKS.md `DONE 2026-05-26`, CHANGELOG `Fixed` entry, PROGRESS log.
→ Report + delegate commit-helper với footer `Fixes: BUG-006 / Refs: T-380`.

### Example 3: F5 Refactor task

User: `làm T-363 UploadZone extract`
→ Locate T-363: Flow F1 nhưng pure refactor essence → confirm với user F1 hay F5 (CLAUDE.md test phân biệt). Nếu F5: KHÔNG thêm test mới, test cũ pass = contract.

---

## Tham chiếu

- `CLAUDE.md > Flow Router` + `Pre-flight Checklist` + `Doc Update Trigger` + `Test Failure Rule` — source of truth
- `docs/TASKS.md` — task entry source
- `docs/CODING_CONVENTION.md` — code rule
- `docs/TESTING_STRATEGY.md` — test requirement chi tiết
- Sibling skills: [[myblog-docs-audit]] (pre-task gate), [[myblog-backend-review]] / [[myblog-frontend-review]] / [[myblog-test-review]] / [[myblog-docs-review]] (post-code review), [[myblog-contract-sync]] (openapi), [[myblog-bug-logger]] (nếu phát hiện bug mới khi implement), [[myblog-commit-helper]] (commit message draft)
