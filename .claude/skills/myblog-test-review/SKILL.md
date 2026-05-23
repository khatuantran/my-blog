---
name: myblog-test-review
description: Review test cases vừa viết trong MyBlog project để kiểm tra có follow TESTING_STRATEGY.md chưa. Kích hoạt sau mỗi lần viết/sửa test — khi user nói "viết test xong", "review test", "check test", "done test", hoặc khi Claude vừa tạo/sửa file *.test.ts(x) / *.spec.ts / *.e2e-spec.ts. Kiểm tra file location, naming, import alias, coverage đủ case (happy + error), regression test naming, E2E data-testid convention. Không bỏ qua kể cả 1 test nhỏ.
---

# MyBlog Test Review

Skill này review test vừa thay đổi theo `docs/TESTING_STRATEGY.md` + Testing Rules trong CLAUDE.md.
Chạy SAU khi viết test, TRƯỚC khi commit.

---

## Bước 1: Xác định test file đã thay đổi

```bash
git diff --name-only HEAD
git diff --name-only --cached
```

Lọc file test: `*.test.ts(x)`, `*.spec.ts`, `*.e2e-spec.ts`. Phân loại:

- **FE unit**: `apps/web/tests/**/*.test.ts(x)` (Vitest)
- **BE unit**: `apps/api/tests/**/*.spec.ts` (Jest)
- **BE integration**: `apps/api/tests/**/*.e2e-spec.ts` (Supertest + real Postgres)
- **E2E**: `e2e/**/*.spec.ts` (Playwright)

---

## Bước 2: File Location & Naming

- [ ] Test nằm trong `tests/` (FE/BE) hoặc `e2e/` (root) — **KHÔNG co-located trong `src/`**
- [ ] Cấu trúc `tests/` mirror cấu trúc `src/` (vd: `src/hooks/usePosts.ts` → `tests/hooks/usePosts.test.ts`)
- [ ] Đúng extension: FE `*.test.ts(x)`, BE unit `*.spec.ts`, BE integration `*.e2e-spec.ts`, E2E `*.spec.ts`
- [ ] Helper/factory/fixture nằm trong `tests/_helpers/` — không lẫn với test file
- [ ] Import từ test → source dùng path alias `@/*`, **KHÔNG relative `./` hoặc `../`**

---

## Bước 3: Coverage đủ case (theo flow)

### Service mới (BE unit) — F1 New Feature

- [ ] ≥ 1 happy path case
- [ ] ≥ 2 error/edge cases (not found, invalid input, forbidden, ...)
- [ ] Mock Prisma đúng cách (`useValue` với jest.fn())
- [ ] Coverage service ≥ 80%

### Controller endpoint mới (BE integration) — F1

- [ ] Happy path (status đúng: 200/201)
- [ ] Nếu có guard: test 401 (chưa login) và/hoặc 403 (sai role)
- [ ] Nếu có resource lookup: test 404
- [ ] Nếu có validation: test 400 (invalid input)
- [ ] Dùng **real Postgres test** (:5433), KHÔNG mock DB ở integration test

### Hook / Service / Validator mới (FE unit) — F1

- [ ] Validator (Zod): test positive + negative (coverage target 100%)
- [ ] Hook: render với QueryClientProvider wrapper, assert isSuccess/data
- [ ] Service: mock fetch / MSW handler

### Regression test (bug fix) — F3 / F4 Phase B

- [ ] Test name format: `it('regression BUG-XXX: <description>', ...)`
- [ ] Setup reproduce điều kiện gây bug → Act trigger → Assert bug KHÔNG còn
- [ ] Đặt cùng layer với bug (BE unit/integration, FE unit, hoặc E2E)

---

## Bước 4: Assertion Quality (Testing Rule — quan trọng)

- [ ] Assertion cụ thể — **KHÔNG dùng `expect.any()` / `expect.anything()` để né** check cụ thể
- [ ] Assert giá trị thật, không chỉ `toBeDefined()` khi có thể assert chính xác
- [ ] Integration test assert cả HTTP status VÀ response body shape
- [ ] Không có test rỗng (chỉ render không assert)
- [ ] Không `test.skip` / `it.skip` mà không có lý do + log BUGS.md (flaky case)

---

## Bước 5: E2E-specific (nếu có file `e2e/`)

- [ ] Selector dùng `data-testid="<kebab-case>"` — **KHÔNG dùng CSS class hoặc ARIA** (volatile)
- [ ] Naming testid: `<context>-<element>` (vd: `post-card`, `like-button`, `login-submit`)
- [ ] Dùng `storageState` cho login-persistent flow (tránh re-login mỗi test)
- [ ] Nếu là E2E flow MỚI → đã update Core Flow Catalog table trong TESTING_STRATEGY.md + link FR/UC chưa?

---

## Bước 6: Output Report

```
## 🧪 Test Review

**Test files thay đổi**: [N file] — [FE unit / BE unit / BE integration / E2E]

### ✅ Passed
- [list rule passed ngắn gọn]

### ❌ Violations
| # | Rule | File | Detail | Cách fix |
|---|------|------|--------|---------|
| 1 | Thiếu error case | `posts.service.spec.ts` | Chỉ có happy path, F1 cần ≥2 error case | Thêm test not-found + forbidden |
| 2 | Co-located test | `src/hooks/usePosts.test.ts` | Test nằm trong src/ | Move sang `tests/hooks/` |

### ⚠️ Coverage gaps
- [vd: validator chưa có negative case → target 100% không đạt]

### 📌 Action items trước commit
1. Thêm [missing case]: ...
2. Move [file] sang đúng location
3. [...]
```

Nếu pass hết: `✅ Test review passed — N files, đủ coverage case, naming + location đúng. Safe to commit.`

---

## Tham chiếu

- `docs/TESTING_STRATEGY.md` — full test strategy, coverage targets, examples
- `CLAUDE.md > Testing` — test required theo flow + Test Failure Rule
- `CLAUDE.md > F1/F3/F4` — coverage requirement per flow
