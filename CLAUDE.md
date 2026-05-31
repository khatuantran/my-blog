# CLAUDE.md — Critical Rules cho MyBlog

> File này auto-load mỗi session Claude Code. **Mọi rule dưới đây BẮT BUỘC tuân thủ.**
> Doc index: [docs/INDEX.md](docs/INDEX.md). Spec project: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

## Session Bootstrap

Đầu MỖI session mới, Claude PHẢI đọc theo thứ tự:

1. **`CLAUDE.md`** (chính file này) — auto-loaded
2. **`docs/PROGRESS.md`** — biết đang ở đâu trong roadmap
3. **`docs/TASKS.md`** — grep status `DOING` và `BLOCKED` để biết task dang dở
4. **`docs/BUGS.md`** — grep `OPEN`, `IN_PROGRESS`, `FIXED (hotfix, pending RCA)`. Nếu có pending RCA → **NHẮC user hoàn tất F4 Phase B trước khi làm task khác**
5. **`docs/REQUIREMENTS.md`** — đọc nếu prompt liên quan FR/UC/NFR
6. **`docs/DATA_MODEL.md`** + **`docs/API_CONTRACT.md`** — đọc khi prompt touch DB/API

Sau khi đọc xong, BÁO CÁO NGẮN với user (1-3 dòng):

- Task đang dang dở: ...
- Bug open: ...
- Hotfix pending RCA: ... (nếu có)

Rồi mới xử lý prompt mới.

---

## Tech Stack Reference

Spec chi tiết: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Local setup: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

| Layer               | Tech                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Monorepo            | **Turborepo** + pnpm workspaces (`apps/web` + `apps/api` + `packages/`)                                        |
| Frontend (apps/web) | **Vite + React 19 + React Router v7** + TanStack Query + Zustand + Tailwind + shadcn/ui                        |
| Backend (apps/api)  | **NestJS** + Passport JWT (access 15min + refresh 30d) + bcrypt + class-validator                              |
| Database            | **PostgreSQL** — Neon free (prod) + Docker local 2 DB (main + test)                                            |
| ORM                 | **Prisma** via `nestjs-prisma`                                                                                 |
| Storage             | **Storage driver** (ADR-010) — Cloudinary signed upload (prod) / local volume (dev), chọn qua `STORAGE_DRIVER` |
| Real-time           | **WebSocket** qua `@nestjs/websockets` + Socket.io                                                             |
| API contract        | **OpenAPI 3.0 auto-gen** từ NestJS qua `@nestjs/swagger`; FE qua `openapi-typescript`                          |
| Testing             | **Vitest** (FE) + **Jest** (BE) + **Supertest** (integration) + **Playwright** (E2E)                           |
| Deploy              | FE → Vercel, BE → Fly.io free tier, DB → Neon free tier                                                        |

Files quan trọng (sau khi scaffold):

- `apps/api/prisma/schema.prisma` — DB schema (theo `docs/DATA_MODEL.md`)
- `apps/api/src/main.ts` — NestJS bootstrap + Swagger + CORS
- `apps/api/src/auth/` — Auth module + JWT strategies + guards
- `apps/web/src/main.tsx` + `src/routes.tsx` — Vite entry + React Router config
- `apps/web/src/services/api/` — typed HTTP client (generated từ openapi.yaml)
- `docs/contracts/openapi.yaml` — API spec source of truth
- `docker-compose.yml` — local Postgres 2 DBs
- `turbo.json` + `pnpm-workspace.yaml` — monorepo config

---

## Flow Router

Khi nhận prompt từ user, Claude PHẢI xác định task thuộc loại nào và follow đúng flow:

| Trigger / Keyword                                                    | Flow                    |
| -------------------------------------------------------------------- | ----------------------- |
| "thêm chức năng", "feature mới", "implement X"                       | **F1: New Feature**     |
| "có FR/requirement mới", "user muốn X" mà chưa có trong REQUIREMENTS | **F2: New Requirement** |
| "bug", "sai", "lỗi" (không critical)                                 | **F3: Bug Fix**         |
| "prod down", "critical", "hotfix", "user không dùng được"            | **F4: Hotfix**          |
| "refactor", "tách component", "đổi pattern", không đổi behavior      | **F5: Refactor**        |
| "update docs", "viết doc", "cập nhật README"                         | **F6: Docs-only**       |
| "update deps", "config", "lint", "CI", "script package.json"         | **F7: Chore**           |

Nếu không rõ loại → dùng `AskUserQuestion` hỏi user.

**Edge cases:**

- Task touch **cả code lẫn docs** → KHÔNG phải F6. Dùng flow của code (F1/F3/F5/F7); docs update là bước trong flow đó.
- Task **PURE docs** (không touch file `.ts/.tsx/.css`) → F6.
- Task **PURE config** (chỉ `.json`, `.yml`, `Dockerfile`, lock file) → F7.
- Task **thêm component UI mới** (vd: thêm `Tooltip`) → F1 (code + DESIGN_SYSTEM.md spec mới).
- Task **đổi design token** → F1 nếu kèm code change / F5 nếu pure refactor token (xem DESIGN_SYSTEM.md Token Change Policy).
- Task **migrate breaking** (vd: NestJS 10→11) → F7 + có thể spawn F1/F5 con.
- **KHÔNG tin keyword của user — luôn tự verify flow đúng:**
  - User có thể dùng "fix bug", "đây là bug", "lỗi" theo nghĩa thông tục (= "vấn đề"), KHÔNG có nghĩa scenario thực sự là F3. Tương tự "thêm feature" có thể là F2 (FR chưa có) hoặc F5 refactor (code tương đương đã có).
  - **BẮT BUỘC chạy test phân biệt trước khi pick flow** — KHÔNG follow keyword của user mù quáng. Cụ thể cho Bug vs Change Request:
    - Test: "Code hiện tại có match spec hiện tại (REQUIREMENTS.md AC + CHANGELOG entries) không?"
    - **Match** → user muốn đổi spec → **F2 amend FR** (clarify → update FR/AC → API_CONTRACT/UI_DESIGN → task F1 → execute). Commit `feat:` hoặc `refactor:`. CHANGELOG `Changed`. KHÔNG log BUGS.md.
    - **Không match** (code thật sự sai vs spec đã định) → **F3 Bug Fix** (log BUGS.md + regression test). Commit `fix:` + `Fixes: BUG-XXX`. CHANGELOG `Fixed`.
  - Pattern tương tự cho các flow khác (vd: "thêm validation" có thể là F1 nếu FR đã ghi / F2 nếu FR chưa ghi; "tối ưu performance" có thể là F5 refactor / F3 nếu vi phạm NFR đo lường được).
  - **Khi test phân biệt nói khác keyword của user → BẮT BUỘC ngắt và propose flow đúng** qua `AskUserQuestion`. KHÔNG tự xếp loại theo từ user dùng.
  - Vd: user nói "fix bug change password validation quá khắt khe" — test phân biệt: FR-11.3 đã ghi "min 8 chars" → code match spec → đây là **F2 change request** (đổi policy), không phải F3. Phải propose F2 amend flow rồi mới execute.
  - **Reductio rhetorical question** ("đây là bug sao không gợi ý SDD?") thường là **thử phán đoán** chứ không phải xác nhận. Đọc implicit intent, không react theo surface text.

### Mọi task PHẢI note `Affected layer`

Trong TASKS.md template (và khi report cho user), mỗi task chỉ rõ:

- `FE` — chỉ touch `apps/web`
- `BE` — chỉ touch `apps/api`
- `Both` — touch cả 2
- `Infra` — touch root (Docker, Turbo, CI, deploy config)
- `Docs` — chỉ touch `docs/` (F6 only)

---

## F1: New Feature Flow

**Khi nào:** Thêm chức năng mới (đã có FR hoặc cần thêm FR).

1. **Verify Requirement** — Check `docs/REQUIREMENTS.md` có FR + UC liên quan. Không có → chuyển sang **F2** trước.
2. **Design** — Update doc thiết kế liên quan TRƯỚC khi code:
   - DB change → `docs/DATA_MODEL.md` (entity + Prisma snippet + migration log summary)
   - API change → `docs/API_CONTRACT.md` (narrative) + regenerate `docs/contracts/openapi.yaml` sau khi BE controller có decorator
   - WebSocket event change → `docs/API_CONTRACT.md > WebSocket Events`
   - UI screen change → `docs/UI_DESIGN.md` (wireframe + state machine + interactions)
   - UI component / design token mới → `docs/DESIGN_SYSTEM.md` (BẮT BUỘC trước khi code component)
   - Architecture change → `docs/ARCHITECTURE.md` + ADR mới
3. **Plan Task** — Add entry vào `docs/TASKS.md` với template đầy đủ + `Flow: F1` + `Affected layer`. Status `DOING`.
4. **Implement** — Code theo `docs/CODING_CONVENTION.md` (Universal + FE/BE section tương ứng). Commit thẳng `main` (trunk-based).
5. **Test & NFR Verify (BẮT BUỘC trước commit)** — Theo [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md):
   - **MỖI service mới (BE):** unit test `apps/api/tests/<feature>/<feature>.service.spec.ts` cover ≥1 happy + ≥2 error cases. Coverage ≥80%.
   - **MỖI controller endpoint mới (BE):** integration test `apps/api/tests/<feature>.e2e-spec.ts` (Supertest + real postgres-test :5433) cover happy + 401/403/404 nếu có guard.
   - **MỖI hook / service / validator mới (FE):** Vitest test `apps/web/tests/<area>/<name>.test.ts(x)`.
   - **DTO / Zod schema mới:** validator test (positive + negative).
   - **E2E (Playwright):** nếu user-facing flow mới (`e2e/` root).
   - **NFR:** API perf < 500ms p95 (Sentry transaction), Lighthouse ≥ 85 perf+a11y (cho page public), keyboard nav manual.
   - **Smoke curl/dev browser KHÔNG đủ** — phải có file test commit kèm trong cùng task.
6. **Update Docs After**:
   - `docs/TASKS.md` → status `DONE` + ngày. **KHÔNG cần commit hash** — git log là source of truth, tra cứu qua `git log --grep "T-XXX"`. Tránh duplicate info + tránh chicken-and-egg (hash chưa tồn tại khi update docs).
   - `docs/PROGRESS.md` → cập nhật % + weekly log
   - `docs/CHANGELOG.md` → entry trong `[Unreleased] > Added`
   - `docs/contracts/openapi.yaml` → regenerate nếu touch BE controller/DTO
   - `apps/web/src/types/api.ts` → regenerate (`pnpm --filter web openapi:types`) nếu yaml change
   - `docs/DESIGN_SYSTEM.md` → sync spec nếu impl component khác design
   - `docs/API_CONTRACT.md` → **BẮT BUỘC** sync khi thêm/sửa endpoint: Notes column ghi rõ body shape + key response fields + status codes chính (KHÔNG để generic kiểu "Issue X" / "Remove Y"). Spec đầy đủ để FE đọc Notes là đủ implement, không cần đọc code BE.
   - `docs/DATA_MODEL.md` + `apps/api/docs/MIGRATIONS.md` → sync nếu migration thật khác design
   - `docs/DEPLOYMENT.md` → sync khi thêm env var mới (kể cả stub cho `.env.test`), đổi script setup, đổi port/service mới
7. **Commit** — `feat(<scope>): <subject>` + footer `Refs: T-XXX, UC-YY`.

---

## F2: New Requirement Flow

**Khi nào:** User yêu cầu chức năng chưa có trong REQUIREMENTS.md.

1. **Clarify** — Dùng `AskUserQuestion` làm rõ scope, user role, acceptance criteria.
2. **Add FR + UC** — Update `docs/REQUIREMENTS.md`:
   - Thêm FR-XX với template (acceptance Given/When/Then đo lường được)
   - Thêm UC-YY mô tả flow chi tiết
   - Update Glossary nếu có term mới
   - Update Traceability mini-matrix
3. **Scope Analysis** — Xác định: cần touch DB? API? UI? WebSocket? Architecture?
4. **Update Design Docs** — Theo scope từ bước 3 (DATA_MODEL / API_CONTRACT / UI_DESIGN / DESIGN_SYSTEM / ARCHITECTURE).
5. **Break Down Tasks** — Tạo nhiều entry T-XXX trong `docs/TASKS.md`, mỗi task có `Affected layer` + `Depends on` rõ.
6. **STOP & Confirm** — KHÔNG implement ngay. Dùng `AskUserQuestion` show:
   - Danh sách task vừa tạo (T-XXX, title, priority, affected layer)
   - Thứ tự thực thi đề xuất (theo dependency: BE trước FE)
   - Option: "Bắt đầu T-XXX đầu tiên (Recommended)" | "Điều chỉnh thứ tự" | "Sửa task trước"

   Chỉ chuyển sang F1 sau khi user chọn task cụ thể.

---

## F3: Bug Fix Flow

**Khi nào:** Bug mọi severity (Low/Medium/High/Critical) KHI prod KHÔNG bị down/blocking user.
**Phân biệt với F4:** F4 chỉ dùng khi prod đang xuống, user không dùng được core feature, cần fix < 1h. Mọi case khác → F3 (kể cả Critical nếu chưa deploy hoặc impact thấp).

1. **Log Bug** — Add entry vào `docs/BUGS.md` với template đầy đủ (Steps, Expected, Actual, Environment + Affected layer), status `OPEN`.
2. **Reproduce** — Confirm steps. Nếu không reproduce → status `WONT_FIX` + lý do.
3. **Add Task** — `docs/TASKS.md`: `[T-XXX] [<priority>] [F3] [<layer>] Fix BUG-XXX`, status `DOING`. **Priority dynamic theo severity:** Critical→P0, High→P1, Medium→P2, Low→P3.
4. **Root Cause Analysis** — Tìm nguyên nhân, ghi vào BUGS.md field `Root cause`.
5. **Implement Fix** — Commit thẳng `main` (trunk-based). Theo CODING_CONVENTION.md.
6. **Regression Test** — BẮT BUỘC viết test reproduce bug + assert fixed:
   - BE bug: Jest unit hoặc Supertest integration
   - FE bug: Vitest unit
   - User-facing: Playwright E2E
   - Test name: `it('regression BUG-XXX: <description>', ...)`
7. **Update Docs**:
   - `docs/BUGS.md` → status `FIXED` + file path regression test (commit hash KHÔNG cần — git log là source of truth)
   - `docs/TASKS.md` → `DONE` + ngày (KHÔNG cần commit hash)
   - `docs/PROGRESS.md` → log
   - `docs/CHANGELOG.md` → entry trong `[Unreleased] > Fixed`
8. **Commit** — `fix(<scope>): <subject>` + footer `Fixes: BUG-XXX`.

---

## F4: Hotfix Flow

**Khi nào:** Bug Critical, prod đang ảnh hưởng user, cần fix gấp.
**Trigger keyword bắt buộc:** "hotfix", "critical", "prod down", "user không dùng được"

### Phase A — Emergency (trong vòng <1h)

1. **Quick Log** — `docs/BUGS.md`: entry với severity `Critical`, status `IN_PROGRESS` + Affected layer (tối thiểu: title, môi trường, impact).
2. **Minimal Patch** — Fix tối thiểu, KHÔNG refactor, KHÔNG thêm feature. **Tạo branch `hotfix/<name>`** (ngoại lệ trunk-based, để dễ revert).
3. **Manual Test** — Smoke test thủ công happy path + bug reproduction. (Skip unit test mới ở phase này.)
4. **Commit & Deploy** — `fix(hotfix): <subject>` + `Fixes: BUG-XXX`. Deploy ngay (`fly deploy` cho BE / Vercel promote cho FE).
5. **Mark fixed** — `docs/BUGS.md` status `FIXED (hotfix, pending RCA)`.

### Phase B — Post-Hotfix (BẮT BUỘC trong vòng 24h)

6. **Root Cause Analysis** — Update `docs/BUGS.md` field `Root cause` chi tiết.
7. **Regression Test** — Viết unit + integration + e2e test cho bug (theo nature), đảm bảo pass.
8. **Lesson Learned** — Nếu architectural issue → add ADR vào `docs/ARCHITECTURE.md`.
9. **Update Docs**:
   - `docs/CHANGELOG.md` → entry `Fixed` với note `(hotfix YYYY-MM-DD)`
   - `docs/PROGRESS.md` → log incident
   - `docs/BUGS.md` → status `FIXED` (bỏ "pending RCA")
10. **Commit Phase B** — `test(hotfix): regression test for BUG-XXX` + `docs(bugs): RCA for BUG-XXX`.

**KHÔNG được dừng ở Phase A.** Cơ chế nhắc: Claude không có timer xuyên session — thay vào đó, ở **Session Bootstrap**, Claude grep `docs/BUGS.md` cho status `FIXED (hotfix, pending RCA)`. Nếu có entry → nhắc user hoàn tất Phase B trước khi làm task khác.

---

## F5: Refactor Flow

**Khi nào:** Cải thiện code (đổi structure, tách module, đổi pattern) KHÔNG đổi behavior.

1. **Pre-check** — Verify test hiện tại pass 100% (làm baseline).
2. **Add Task** — `docs/TASKS.md`: `[T-XXX] [P2] [F5] [<layer>] Refactor <X>`, status `DOING`.
3. **Design Doc Update (nếu cần)** — Nếu đổi pattern/architecture → add ADR vào `docs/ARCHITECTURE.md`.
4. **Implement** — Commit thẳng `main` (trunk-based). Nhỏ + atomic, mỗi commit deploy-able.
5. **Test** — Run ALL test (unit + integration + e2e). PHẢI pass 100% (không có test mới, dùng test cũ làm contract).
6. **Update Docs**:
   - `docs/TASKS.md` → `DONE`
   - `docs/CHANGELOG.md` → entry `Changed`
   - `docs/PROGRESS.md` → log
7. **Commit** — `refactor(<scope>): <subject>`.

**Reject nếu:** Refactor làm thay đổi behavior → phải tách thành F1 (feature) hoặc F3 (bug fix).

---

## F6: Docs-only Flow

**Khi nào:** Chỉ update tài liệu, không touch code (file `.ts/.tsx/.css/.json` code).

1. **Identify Scope** — Xác định doc nào cần update (xem Doc Update Trigger dưới).
2. **Verify Accuracy** — Đối chiếu với code thực tế (nếu doc mô tả code).
3. **Update Doc** — Tuân thủ template + language convention (heading EN, body VN, technical term EN).
4. **Cross-link Check** — Update các doc khác nếu có reference (vd: sửa API_CONTRACT.md → check ARCHITECTURE.md + DATA_MODEL.md sync).
5. **Commit** — `docs(<scope>): <subject>`.

**Không cần:** Task entry trong TASKS.md (trừ khi task lớn như "rewrite toàn bộ ARCHITECTURE.md").

---

## F7: Chore Flow

**Khi nào:** Update deps, config (lint, prettier, CI, Docker, Turbo), package.json scripts.

1. **Risk Check** — Đánh giá impact: minor bump (low) vs major bump (high). Major (vd: NestJS 10→11, React 18→19) → spawn F1/F5 con.
2. **Add Task** — `docs/TASKS.md` nếu task lớn. Skip nếu patch bump.
3. **Implement** — Update file config / lockfile / scripts.
4. **Smoke Test** — `pnpm build` + `pnpm dev` chạy không lỗi. Run test suite.
5. **Update Docs**:
   - `docs/CHANGELOG.md` → nếu user-facing impact, entry `Changed` hoặc `Security`
   - `docs/DEPLOYMENT.md` → nếu đổi env var hoặc deploy step
6. **Commit** — `chore(<scope>): <subject>`.

---

## Testing (high-level — chi tiết ở `docs/TESTING_STRATEGY.md`)

Test stack chia per app:

- **FE unit:** Vitest + RTL + MSW
- **BE unit:** Jest (NestJS default) + mocked Prisma
- **BE integration:** Supertest + real test Postgres
- **E2E:** Playwright (chromium)

### Test required theo flow

| Flow              | Unit test mới?                                                                |
| ----------------- | ----------------------------------------------------------------------------- |
| F1 New Feature    | **BẮT BUỘC** thêm test mới cho code mới                                       |
| F3 Bug Fix        | **BẮT BUỘC** thêm regression test (xem TESTING_STRATEGY.md > Regression Test) |
| F4 Hotfix Phase B | **BẮT BUỘC** thêm regression test                                             |
| F5 Refactor       | **KHÔNG** thêm test mới. Test cũ pass = contract giữ nguyên                   |
| F6 Docs           | Không áp dụng                                                                 |
| F7 Chore          | Smoke test (build/dev chạy), không yêu cầu unit test mới                      |

### Test Failure Rule — TỐI QUAN TRỌNG

Khi test FAIL:

1. **STOP — KHÔNG sửa test** để pass.
2. **Report theo template chuẩn (BẮT BUỘC):**

   ```
   ❌ TEST FAILED
   - File: <path>:<line>
   - Test: <test name / describe block>
   - Error: <error message>
   - Stack: <relevant stack frames>
   - Likely cause: [code-bug | test-stale-assumption | flaky | env | data-setup | dependency-change]
   - Evidence: <log/screenshot/diff supporting the cause>
   - Proposed fix:
     - [ ] Option A: ...
     - [ ] Option B: ...
   - Recommended: Option <X> vì <lý do>
   ```

3. **Hành động theo cause:**
   - `code-bug` → sửa code, GIỮ test
   - `test-stale-assumption` (business logic đổi hợp lệ) → cập nhật test KÈM giải thích trong commit body
   - `flaky` → `test.skip` TẠM THỜI + log `BUGS.md` (severity ≥ Medium) + task fix flaky
   - `env`/`data-setup` → sửa fixture/setup, KHÔNG sửa assertion
   - `dependency-change` → log vào CHANGELOG + fix appropriately

4. **KHÔNG được:**
   - Comment-out test
   - Đổi assertion để pass mà không hiểu lý do
   - Dùng `expect.any()`/`expect.anything()` để né cụ thể
   - Skip không log vào BUGS.md
   - Nói "test fail nhưng OK" — phải report theo template

### Chi tiết Test data, E2E catalog, CI

Xem [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md).

---

## Strict Enforcement

- Khi user prompt yêu cầu task nhưng KHÔNG theo flow tương ứng (vd: "thêm endpoint X" mà không update API_CONTRACT.md trước):
  - **KHÔNG implement.**
  - Trả lời: "Yêu cầu này thuộc Flow [F1/.../F7]. Bước hiện tại cần làm: [step]. Cụ thể: [hành động]. Bạn muốn tôi tiến hành theo flow đúng không?"
- Chỉ thực thi sau khi user confirm hoặc Claude tự hoàn thành step bị thiếu.
- KHÔNG bao giờ skip step "Update Docs After" — kể cả khi user nói "code thôi, đừng update doc".
- **Exceptions cho rule "phải thêm unit test":**
  - **F4 Phase A** — skip unit test, NHƯNG bắt buộc Phase B trong 24h
  - **F5 Refactor** — KHÔNG thêm test mới (test cũ là contract)
  - **F6 Docs-only** — không áp dụng
  - **F7 Chore** — smoke test thay vì unit test mới

---

## Pre-flight Checklist (BẮT BUỘC trước khi viết dòng code đầu tiên)

Đây là **sanity check cuối cùng** sau khi đã làm xong design step của flow tương ứng. KHÔNG thay thế các step của flow — đây là double-check trước commit đầu tiên.

- [ ] Task có entry trong `docs/TASKS.md` với status `DOING` + `Flow` + `Affected layer` rõ ràng
- [ ] FR/NFR + UC liên quan tồn tại trong `docs/REQUIREMENTS.md`
- [ ] Nếu touch DB → `docs/DATA_MODEL.md` đã có model mới/sửa
- [ ] Nếu touch API REST → `docs/API_CONTRACT.md` đã có endpoint mới/sửa với Notes column chi tiết (body shape + key response fields + status codes — KHÔNG generic kiểu "Issue X")
- [ ] Nếu thêm env var mới (kể cả `.env.test` stub) → `docs/DEPLOYMENT.md` Quick Start setup section đã update
- [ ] Nếu touch WebSocket → `docs/API_CONTRACT.md > WebSocket Events` đã có event mới
- [ ] Nếu touch UI screen → `docs/UI_DESIGN.md` đã có wireframe screen
- [ ] Nếu touch UI component / token mới → `docs/DESIGN_SYSTEM.md` đã có spec
- [ ] Nếu đổi pattern/arch → `docs/ARCHITECTURE.md` đã có ADR
- [ ] Test strategy đã rõ (file path, cases) theo `docs/TESTING_STRATEGY.md`
- [ ] Test file paths đã xác định (unit + integration), cases đã list ra
- [ ] BE: test DB infra sẵn sàng (postgres-test :5433 healthy + `apps/api/.env.test` set)
- [ ] Nếu touch field enumerated value → đã có Prisma enum / `as const` đối ứng (KHÔNG string literal union)
- [ ] KHÔNG có `console.*` trong code (BE: `Logger`, FE: `logger` từ `@/lib/logger`)

**Nếu bất kỳ check nào FAIL → DỪNG, quay về step design tương ứng. Không viết code.**

---

## Commit Convention (Conventional Commits)

Format: `<type>(<scope>): <subject ngắn>`

**Type:**

- `feat` — chức năng mới
- `fix` — sửa bug
- `docs` — chỉ update docs/
- `refactor` — refactor không đổi behavior
- `test` — thêm/sửa test
- `chore` — config, deps, build
- `style` — format/whitespace
- `perf` — tối ưu performance

**Scope (tuỳ chọn):** `auth`, `post`, `comment`, `like`, `upload`, `feed`, `admin`, `db`, `api`, `ws`, `web`, `infra`

**Examples:**

- `feat(post): thêm CRUD bài viết cho admin`
- `feat(api,post): add POST /posts endpoint with file attachment support`
- `fix(auth): sửa lỗi session expire sai timezone`
- `docs(api): cập nhật API_CONTRACT.md với WebSocket events`
- `refactor(feed): tách PostCard thành component riêng`
- `chore(deps): bump nestjs 10.3 → 10.4`

**Rules:**

- Subject < 72 ký tự, viết thường, không chấm cuối
- Body (tùy chọn) giải thích WHY (cách dòng trống sau subject)
- Footer reference: `Refs: T-001, UC-01` hoặc `Fixes: BUG-001`
- 1 task hoàn chỉnh = 1 commit (trừ khi quá lớn cần split logic)

**Language rule:**

- `<type>` và `<scope>`: English (cố định theo Conventional Commits)
- `<subject>`: ưu tiên English; cho phép Tiếng Việt nếu rõ nghĩa hơn
- Body có thể VN (giải thích chi tiết WHY)

---

## Branching Strategy (Trunk-based)

Dự án solo — commit thẳng `main`. KHÔNG dùng feature branch cho task thường (F1/F3/F5/F6/F7).

**Quy trình mỗi task:**

1. Pull latest `main`
2. Code + test theo flow
3. Pre-commit check: `pnpm lint && pnpm test:unit` PHẢI pass (E2E run định kỳ, không bắt buộc mỗi commit)
4. Commit theo Commit Convention
5. Push `main` → Vercel auto-deploy FE; `fly deploy` BE manual

**Ngoại lệ — KHI NÀO mới tạo branch:**

- **F4 Hotfix** — bắt buộc branch `hotfix/<name>` để dễ revert nếu fix sai
- **Experiment lớn** — task có nguy cơ cao bị abandon (vd: thử framework mới). Branch `experiment/<name>`
- **WIP qua đêm** — commit chưa muốn deploy → branch `wip/<name>` cho đến khi xong

Sau khi merge branch về main → squash merge + xoá branch.

**Khi scale team trong tương lai** → bật full branching (`feat/`, `fix/`, ...) + PR review.

---

## Clarification Rule

Khi yêu cầu user chưa rõ:

- KHÔNG đoán intent.
- Dùng `AskUserQuestion` với 2-4 options.
- LUÔN có 1 option ghi `(Recommended)` — là đề xuất của Claude kèm lý do ngắn.
- Mỗi option có description giải thích trade-off.

---

## Doc Language Convention

- **Heading:** English (`## Architecture`, `### Database Schema`)
- **Body:** Tiếng Việt
- **Technical term:** giữ nguyên English (middleware, gateway, DTO, guard, interceptor, hook, query, mutation, schema, migration, deploy, scaffold, route handler, signed URL, ...)
- **Code/identifier:** English (theo CODING_CONVENTION.md)
- **Date format:** `YYYY-MM-DD` (ISO)

---

## Multi-step Prompt Rule

Khi prompt user yêu cầu nhiều task cùng lúc (vd: "thêm endpoint /api/x VÀ sửa bug Y VÀ update README"):

1. **Decompose** — Tách prompt thành danh sách task riêng biệt.
2. **Classify** — Mỗi task xác định Flow (F1-F7) + Affected layer theo Flow Router.
3. **Order by dependency** — Sắp xếp theo thứ tự thực thi:
   - F2 (Requirement) trước F1 (Feature)
   - BE trước FE (FE cần API ready)
   - F1 trước F3 (Bug có thể phát sinh từ feature mới)
   - F4 (Hotfix) ưu tiên tuyệt đối nếu có
4. **Confirm với user** — Liệt kê task + flow + layer + thứ tự, dùng `AskUserQuestion` nếu thứ tự có thể đảo.
5. **Execute từng task TUẦN TỰ** — Mỗi task hoàn tất ĐẦY ĐỦ flow (gồm update doc + commit) TRƯỚC khi sang task tiếp. KHÔNG gộp doc update cuối cùng.
6. **Doc per task** — Mỗi task có liên quan doc nào → update doc đó NGAY khi task xong.

---

## Doc Update Trigger (quick lookup)

Xem chi tiết: [docs/INDEX.md > Doc Update Trigger](docs/INDEX.md).

Nhanh:

| Thay đổi                                                      | Doc cần update                                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| FR/NFR/UC                                                     | `docs/REQUIREMENTS.md`                                                                                                               |
| DB schema                                                     | `docs/DATA_MODEL.md` + `apps/api/docs/MIGRATIONS.md`                                                                                 |
| REST endpoint mới/sửa                                         | `docs/API_CONTRACT.md` (Notes: body + key response fields + status codes — KHÔNG generic) + regenerate `docs/contracts/openapi.yaml` |
| WebSocket event                                               | `docs/API_CONTRACT.md > WebSocket Events`                                                                                            |
| Screen                                                        | `docs/UI_DESIGN.md`                                                                                                                  |
| Component / token                                             | `docs/DESIGN_SYSTEM.md`                                                                                                              |
| Pattern / architecture                                        | `docs/ARCHITECTURE.md` (+ ADR)                                                                                                       |
| Convention                                                    | `docs/CODING_CONVENTION.md`                                                                                                          |
| Test strategy / E2E flow                                      | `docs/TESTING_STRATEGY.md`                                                                                                           |
| Env var mới (kể cả `.env.test` stub) / deploy / script / port | `docs/DEPLOYMENT.md` (Quick Start setup + Env matrix)                                                                                |
| Task xong                                                     | `docs/TASKS.md` (DONE + ngày, không hash) + `docs/PROGRESS.md` + `docs/CHANGELOG.md`                                                 |
| Bug phát hiện/fix                                             | `docs/BUGS.md` + `docs/CHANGELOG.md`                                                                                                 |

**Rule:** Cross-cut nhiều file → update TẤT CẢ cùng commit, không tách lẻ.

---

## Do NOT

- KHÔNG implement code khi doc chưa update
- KHÔNG skip SDD step
- KHÔNG đoán intent — luôn hỏi qua `AskUserQuestion`
- KHÔNG tạo file `.md` mới ngoài `docs/` trừ khi user yêu cầu
- KHÔNG commit `main` khi lint/test fail
- KHÔNG branch cho task thường (trunk-based) — chỉ branch khi F4 Hotfix / Experiment / WIP qua đêm
- KHÔNG dùng `any` trong TypeScript (dùng `unknown` rồi narrow)
- KHÔNG bỏ qua test fail
- KHÔNG hardcode secret / env value
- KHÔNG store JWT trong localStorage (httpOnly cookie only)
- KHÔNG dùng `$queryRawUnsafe` Prisma với user input
- KHÔNG ghi đè manual file `docs/contracts/openapi.yaml` — chỉ regenerate từ NestJS Swagger
- KHÔNG dùng string literal union làm enum ảo — define Prisma enum + re-export (BE), hoặc FE `as const` object + `z.nativeEnum`. Xem [docs/CODING_CONVENTION.md > Enums](docs/CODING_CONVENTION.md)
- KHÔNG dùng `console.log/error/warn` trong production code — dùng NestJS `Logger` (BE) hoặc `logger` từ `@/lib/logger` (FE, loglevel). Xem [docs/CODING_CONVENTION.md > Logging](docs/CODING_CONVENTION.md)
- KHÔNG commit feature code mới (F1/F2) khi thiếu test file. Smoke curl/dev browser KHÔNG thay thế. Exception: F4 Phase A (test follow Phase B), F5 (test cũ làm contract), F6/F7 (smoke đủ).
