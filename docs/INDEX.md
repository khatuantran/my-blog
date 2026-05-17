# Docs Index

> Navigation cho **14 file `.md` core** trong `docs/` + 1 file `contracts/openapi.yaml`. SDD workflow + flow rules: [../CLAUDE.md](../CLAUDE.md).

## Document List

| File                                               | Mục đích                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [REQUIREMENTS.md](./REQUIREMENTS.md)               | **WHAT & WHY** — Vision + Personas + Glossary + Use Cases + FR + NFR + Traceability matrix      |
| [ARCHITECTURE.md](./ARCHITECTURE.md)               | **HOW (system)** — C4 diagrams + 8 ADRs + Security policy + Operations runbook                  |
| [DATA_MODEL.md](./DATA_MODEL.md)                   | Entities + ERD + Prisma snippet + Migration log summary                                         |
| [API_CONTRACT.md](./API_CONTRACT.md)               | REST narrative + error catalog + WebSocket events + link OpenAPI spec                           |
| [contracts/openapi.yaml](./contracts/openapi.yaml) | **Single source of truth** REST API spec — auto-gen từ NestJS `@nestjs/swagger`                 |
| [UI_DESIGN.md](./UI_DESIGN.md)                     | 5 screens (Feed, Post Detail, Create Post, Admin, Login) + Shared Layout                        |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)             | Dark-only cyberpunk tokens + ~25 component primitives + Mood/File color maps + Token versioning |
| [CODING_CONVENTION.md](./CODING_CONVENTION.md)     | TS rules + Universal/FE/BE conventions + Security/Performance checklists + Git workflow         |
| [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)       | Test pyramid + Vitest (FE) / Jest (BE) / Supertest / Playwright + Test data + E2E catalog       |
| [DEPLOYMENT.md](./DEPLOYMENT.md)                   | Local Docker Compose + Vercel FE + Fly.io BE + Neon DB + env matrix + CI/CD                     |
| [PROGRESS.md](./PROGRESS.md)                       | Milestone tracker + weekly log                                                                  |
| [TASKS.md](./TASKS.md)                             | Backlog T-XXX với template chi tiết (Flow + Affected layer)                                     |
| [BUGS.md](./BUGS.md)                               | Bug tracker BUG-XXX với template (Severity + Affected layer + RCA + Regression test)            |
| [CHANGELOG.md](./CHANGELOG.md)                     | Keep a Changelog + SemVer — versioned release notes                                             |

## Per-App Docs (sẽ tạo khi scaffold)

- `apps/web/README.md` — FE quick start
- `apps/api/README.md` — BE quick start
- `apps/api/docs/MIGRATIONS.md` — chi tiết per-migration log (DATA_MODEL.md chỉ summary)

## Root Files

- [`CLAUDE.md`](../CLAUDE.md) — Critical rules cho Claude (auto-loaded mỗi session)
- [`README.md`](../README.md) — Project intro + quick start link

## Doc Update Trigger (quick lookup)

Khi đổi gì → update doc nào (lookup nhanh, áp dụng cho mọi flow):

| Thay đổi                                          | Doc cần update                                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Thêm/sửa FR hoặc NFR                              | [REQUIREMENTS.md](./REQUIREMENTS.md)                                                                             |
| Thêm/sửa Use Case                                 | [REQUIREMENTS.md > Use Cases](./REQUIREMENTS.md) + Traceability                                                  |
| Thêm Persona / Glossary term                      | [REQUIREMENTS.md](./REQUIREMENTS.md)                                                                             |
| Đổi schema DB / Prisma model                      | [DATA_MODEL.md](./DATA_MODEL.md) + `apps/api/docs/MIGRATIONS.md` (per-migration detail)                          |
| Thêm/sửa endpoint                                 | [API_CONTRACT.md](./API_CONTRACT.md) (narrative) + regenerate [contracts/openapi.yaml](./contracts/openapi.yaml) |
| Thêm/sửa WebSocket event                          | [API_CONTRACT.md > WebSocket Events](./API_CONTRACT.md)                                                          |
| Thêm/sửa screen                                   | [UI_DESIGN.md](./UI_DESIGN.md)                                                                                   |
| Thêm/sửa component primitive hoặc design token    | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) + Token Change History                                                    |
| Đổi pattern/cấu trúc thư mục/architecture         | [ARCHITECTURE.md](./ARCHITECTURE.md) (kèm ADR mới)                                                               |
| Đổi convention (lint, naming, security checklist) | [CODING_CONVENTION.md](./CODING_CONVENTION.md)                                                                   |
| Thêm/đổi test strategy                            | [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)                                                                     |
| Thêm/đổi E2E flow                                 | [TESTING_STRATEGY.md > E2E Flow Catalog](./TESTING_STRATEGY.md)                                                  |
| Đổi env var / deploy step                         | [DEPLOYMENT.md](./DEPLOYMENT.md)                                                                                 |
| Task xong (mọi flow)                              | [TASKS.md](./TASKS.md) (DONE) + [PROGRESS.md](./PROGRESS.md) + [CHANGELOG.md](./CHANGELOG.md)                    |
| Phát hiện bug                                     | [BUGS.md](./BUGS.md)                                                                                             |
| Bug fix xong                                      | [BUGS.md](./BUGS.md) (status FIXED) + [CHANGELOG.md](./CHANGELOG.md)                                             |
| Release version mới                               | [CHANGELOG.md](./CHANGELOG.md) (entry version) + [DEPLOYMENT.md](./DEPLOYMENT.md) (release note)                 |

**Rule:** Nếu thay đổi cross-cut nhiều file → update TẤT CẢ cùng commit, không tách lẻ.

## Reading Order (Session Bootstrap)

Theo [CLAUDE.md > Session Bootstrap](../CLAUDE.md), đầu mỗi session Claude PHẢI đọc:

1. **`CLAUDE.md`** — auto-loaded
2. **`docs/PROGRESS.md`** — biết roadmap đang ở đâu
3. **`docs/TASKS.md`** — task đang DOING / BLOCKED
4. **`docs/BUGS.md`** — bug OPEN / IN_PROGRESS / FIXED (pending RCA)
5. **`docs/REQUIREMENTS.md`** — đọc thêm nếu prompt liên quan FR/UC
6. **`docs/DATA_MODEL.md`** + **`docs/API_CONTRACT.md`** — đọc khi prompt touch DB/API

## SDD Workflow

Xem [../CLAUDE.md](../CLAUDE.md) cho:

- **Flow Router** — Claude tự nhận diện task thuộc F1-F7
- **F1: New Feature** — full SDD 7 bước
- **F2: New Requirement** — clarify → add FR → break tasks → STOP & confirm
- **F3: Bug Fix** — log → RCA → fix + regression test
- **F4: Hotfix** — Phase A emergency + Phase B post-RCA
- **F5: Refactor** — no behavior change + test cũ làm contract
- **F6: Docs-only** — pure docs update
- **F7: Chore** — deps + config + smoke test
- **Strict Enforcement** — Claude từ chối skip flow
- **Pre-flight Checklist** — sanity check trước khi code
- **Commit Convention** + **Branching Strategy** (trunk-based)
- **Multi-step Prompt Rule** — decompose + execute sequentially
