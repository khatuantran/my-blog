# Progress Tracker

## Trạng thái tổng: 🟡 Docs Foundation Phase

## Milestone

| # | Milestone | Trạng thái | Ngày target |
|---|-----------|-----------|-------------|
| M1 | Setup SDD docs v2 (cyberpunk + monorepo stack) | ✅ Done | 2026-05-17 |
| M2 | Monorepo scaffold (Turborepo + Docker + apps skeleton) | 🟡 Doing | |
| M3 | Backend NestJS — Auth (JWT) + Users + Prisma schema | ⬜ Todo | |
| M4 | Backend — Posts + Files (Cloudinary signed upload) + Tags | ⬜ Todo | |
| M5 | Backend — Comments + Likes + CommentLikes + Saved | ⬜ Todo | |
| M6 | Backend — Admin endpoints (stats, users, moderation) + WebSocket gateway | ⬜ Todo | |
| M7 | Frontend — Layout (TopBar, StatusBar, CommandPalette, Sidebar, RightPanel) | ⬜ Todo | |
| M8 | Frontend — Feed + Post Detail (ImageCarousel + file download) | ⬜ Todo | |
| M9 | Frontend — Create Post + Admin Dashboard | ⬜ Todo | |
| M10 | Frontend — Login + auth flow + protected routes | ⬜ Todo | |
| M11 | Real-time integration (Socket.io client + activity log + live visitors) | ⬜ Todo | |
| M12 | Testing — unit (FE Vitest + BE Jest) + integration (Supertest) + E2E (Playwright) | ⬜ Todo | |
| M13 | Deploy — Vercel FE + Fly.io BE + Neon DB + CI/CD GitHub Actions | ⬜ Todo | |
| M14 | Monitoring + observability (Sentry + Fly metrics + alert rules) | ⬜ Todo | |

## Tỉ lệ hoàn thành: 7% (1/14 milestone)

> ⬜ Todo | 🟡 Doing | ✅ Done | 🔴 Blocked

---

## Weekly Log

### 2026-05-17 (Week 1)

- **Done:**
  - SDD docs v2 restructure hoàn tất:
    - REQUIREMENTS.md với Vision + Personas + Use Cases (UC-01→UC-12) + Glossary + FR-01→FR-09 + NFR + Traceability matrix
    - ARCHITECTURE.md với C4 diagrams + 8 ADRs (Turborepo, NestJS, React Router v7, Socket.io, Prisma, JWT cookie, Fly.io, OpenAPI auto-gen) + Security policy + Operations runbook
    - DATA_MODEL.md với 14 entities (added File, CommentLike, PostView, AnonymousSession, RefreshToken) + 4 enums + Prisma schema snippet + indexing strategy
    - API_CONTRACT.md narrative + WebSocket events catalog + link `contracts/openapi.yaml` placeholder
    - UI_DESIGN.md 5 screens chi tiết theo cyberpunk design source (Feed/Post Detail/Create Post/Admin/Login)
    - DESIGN_SYSTEM.md dark-only cyberpunk theme: tokens (10 color layers + 7 typography + 4px spacing + radius + shadow + motion) + ~25 components + patterns + Mood/File color maps
    - CODING_CONVENTION.md split Universal/Frontend/Backend + Security & Performance checklists
    - TESTING_STRATEGY.md test pyramid + Vitest/Jest/Supertest/Playwright + 13 E2E flows catalog + data strategy
    - DEPLOYMENT.md Local Docker Compose + Vercel + Fly.io + Neon + env matrix + CI/CD plan
    - CLAUDE.md update (sẽ làm tiếp)
    - PROGRESS.md, TASKS.md, BUGS.md, CHANGELOG.md, INDEX.md update
    - Removed docs/PROMPT.md (obsolete spec, REQUIREMENTS.md mới thay thế)
    - Renamed: DATABASE_SCHEMA → DATA_MODEL, API → API_CONTRACT
    - Created: docs/contracts/openapi.yaml placeholder, root README + .env.example
- **Done (M2 start):**
  - Tách env per-app: `apps/api/.env.example` + `apps/web/.env.example` (root xóa)
  - Init git repository (branch `main`) + `.gitignore` (ignore `design-file/` reference-only)
  - **T-002** Monorepo skeleton: `package.json` + `pnpm-workspace.yaml` + `turbo.json` + `.npmrc` + `.nvmrc` (Node 24 LTS) + `packages/`. Turbo 2.9.14, pnpm 9.15.0
  - **T-003** `docker-compose.yml`: postgres-main (persistent) + postgres-test (tmpfs) + healthcheck
- **Doing:**
  - M2 in progress (T-003 → T-007 còn lại)
- **Blocked:**
  - —
- **Next (M2 remaining):**
  - T-003: `docker-compose.yml` (Postgres main + test)
  - T-004: Scaffold `apps/api` (NestJS + Prisma + Swagger)
  - T-005: Scaffold `apps/web` (Vite + React 19 + React Router v7 + Tailwind + shadcn/ui)
  - T-006: ESLint + Prettier + husky + lint-staged
  - T-007 (remaining): `dotenv-safe` runtime validation

---

## Template thêm milestone mới

```markdown
| M<N> | <tên milestone> | ⬜ Todo | YYYY-MM-DD |
```

## Template log tiến độ hằng tuần

```markdown
### YYYY-MM-DD (Week N)
- **Done:** ...
- **Doing:** ...
- **Blocked:** ...
- **Next week:** ...
```
