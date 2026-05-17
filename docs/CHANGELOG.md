# Changelog

Tuân theo [Keep a Changelog](https://keepachangelog.com/) + [SemVer](https://semver.org/).

## [Unreleased]

### Added

- **T-002** Monorepo skeleton: `package.json` + `pnpm-workspace.yaml` + `turbo.json` + `.npmrc` + `.nvmrc` + `packages/`. Turborepo 2.9.14, pnpm 9.15.0, Node 24 LTS. Pipeline tasks build/dev/lint/test/typecheck.
- **T-003** `docker-compose.yml`: 2x Postgres 16-alpine (`postgres-main` :5432 persistent volume, `postgres-test` :5433 tmpfs in-memory) + healthcheck.
- **T-004** Scaffold `apps/api` NestJS skeleton: bootstrap (helmet/compression/cookie-parser/CORS/ValidationPipe/Swagger dev), `common/` (HttpExceptionFilter + Transform/Logging interceptors), `config/env.schema.ts` (Zod fail-fast validate), `prisma/` (nestjs-prisma + Placeholder model). NestJS 10.4, Prisma 5.22, @nestjs/swagger 7.4, helmet 8.
- **T-005** Scaffold `apps/web` Vite + React 19 skeleton: RouterProvider (RR v7 + lazy + Suspense) + QueryClient (TanStack Query 5 + DevTools dev-only) + Tailwind 3.4 (cyberpunk tokens) + shadcn/ui init + Zod env validation + fetch client wrapper + Vitest smoke test.
- **T-006** ESLint 9 flat config + Prettier 3 + Husky 9 + lint-staged + commitlint. Root `eslint.config.mjs` shared base (no-console, no-explicit-any, typescript-eslint) + per-app extends (NestJS, React hooks+refresh). Pre-commit: lint-staged auto-fix + format. Commit-msg: commitlint enforce Conventional Commits. Format baseline áp dụng 28 files.
- Init git repository (default branch `main`) + `.gitignore` (Node + Turborepo + Vite + NestJS + env secret + IDE + OS). Trunk-based workflow chính thức bắt đầu.

### Changed

- Add 2 convention rules vào CODING_CONVENTION.md: (1) cấm string literal union làm enum ảo — define Prisma `enum` (BE) hoặc `as const` + `z.nativeEnum` (FE); (2) cấm `console.*` — dùng NestJS `Logger` (BE) hoặc `loglevel` qua `@/lib/logger` (FE). Refactor `apps/api/src/main.ts` + `apps/web/src/lib/env.ts` xóa console. Cross-ref CLAUDE.md Do NOT + Pre-flight Checklist.
- **Convention change**: test files PHẢI tách khỏi src — chuyển sang `apps/<app>/tests/` (mirror src structure). Move `apps/web/src/App.test.tsx` → `apps/web/tests/App.test.tsx`, `apps/web/src/test/setup.ts` → `apps/web/tests/setup.ts`, `apps/api/test/` → `apps/api/tests/`. Update vitest + jest configs + tsconfig include + e2e config rootDir. Helpers/factories/setup vào `tests/_helpers/`. Imports test → source dùng alias `@/*` (KHÔNG relative). Update CODING_CONVENTION.md + TESTING_STRATEGY.md.
- Split root `.env.example` thành `apps/api/.env.example` (BE vars) + `apps/web/.env.example` (FE `VITE_*` vars). Root file đã xóa — per-app convention chuẩn Turborepo, dễ maintain khi scaffold M2. Update `README.md` + `docs/DEPLOYMENT.md` Quick Start bỏ dòng `cp .env.example .env.local` root.

---

## [0.2.0-alpha] - 2026-05-17

### BREAKING — Migration v1 → v2 (docs + stack)

Major restructure: tech stack chuyển từ Next.js full-stack → monorepo Turborepo (Vite React FE + NestJS BE) + design overhaul cyberpunk theme + SDD docs theo new framework. **Codebase v1 chưa init**, nên không có breaking deps update — chỉ docs refactor + design retarget.

### Changed

- **Tech stack:** Next.js full-stack → Monorepo Turborepo
  - FE: `Vite + React 19 + React Router v7 + TanStack Query + Zustand` (thay Next.js App Router)
  - BE: `NestJS + Passport JWT + bcrypt + class-validator` (thay Next.js API routes + NextAuth)
  - DB: PostgreSQL via `Prisma` qua `nestjs-prisma` (giữ ORM)
  - Storage: Cloudinary signed upload (giữ)
  - Real-time: `WebSocket via @nestjs/websockets + Socket.io` (thay SSE)
  - API contract: OpenAPI 3.0 auto-gen từ `@nestjs/swagger` (thay narrative markdown)
  - Testing: `Vitest (FE) + Jest (BE) + Supertest + Playwright` (thay Vitest + Playwright)
  - Deploy: Vercel (FE static SPA) + Fly.io free tier (BE) + Neon free tier (DB)
  - Local dev: Docker Compose 2 Postgres (main + test)
- **Docs structure** restructure theo SDD principles:
  - REQUIREMENTS.md: thêm Vision + Personas (P1/P2/P3) + Glossary + Use Cases (UC-01→UC-12) + Acceptance Criteria (Given/When/Then) + Traceability mini-matrix
  - ARCHITECTURE.md: C4 diagrams (Context/Container/Component) + 8 ADRs + Security policy + Operations runbook
  - DATA_MODEL.md (rename từ DATABASE_SCHEMA.md): Prisma snippet đầy đủ + migration log summary strategy (chi tiết → `apps/api/docs/MIGRATIONS.md`)
  - API_CONTRACT.md (rename từ API.md): narrative + error catalog + WebSocket events catalog + link tới `contracts/openapi.yaml`
  - UI_DESIGN.md: 5 screens chi tiết theo design source cyberpunk (Feed/Post Detail/Create Post/Admin/Login) + Shared Layout
  - DESIGN_SYSTEM.md: dark-only cyberpunk theme rewrite hoàn toàn — tokens (color/typo/spacing/radius/shadow/motion) + ~25 component primitives + Mood/File color maps + Token versioning
  - CODING_CONVENTION.md: split Universal + Frontend + Backend sections + Security & Performance checklists
  - DEPLOYMENT.md: Vercel + Fly.io + Neon + Docker local + env matrix
  - INDEX.md: navigation updated cho 14 file mới + Doc Update Trigger table
  - PROGRESS.md, TASKS.md, BUGS.md: update template với `Affected layer` field + flow mapping
- **Design system overhaul:** Pastel notebook → Cyberpunk / terminal dark theme (per `design-file/`)
  - Color: deep navy `#0A0E1A` background + cyan `#00FFE5` accent + 8 accent colors
  - Typography: Space Grotesk (brand/heading) + Inter (body) + JetBrains Mono (terminal/code) — thay Plus Jakarta Sans
  - Motion: glitch (9s logo), pulse (online dot), scan line (Login card), CRT scanline overlay
  - Mood emoji EXCITED: 🎉 → ⚡; mood colors update theo design source
  - Light mode removed (TBD)

### Added

- **FR-06: File Attachments** — Admin upload PDF/DOC/DOCX/XLS/XLSX/TXT/CSV (max 20/post, ≤ 20MB) qua Cloudinary signed URL. Hiển thị + download trong PostCard/Post Detail.
- **FR-07: Admin Dashboard** — 4 stat cards với sparkline + mood distribution + users table (ban/view) + comments moderation (approve/delete) + activity log real-time.
- **FR-08: Command Palette** — ⌘K overlay global navigation/actions với filter + keyboard nav.
- **FR-09: Real-time** — WebSocket activity log feed + live visitors panel + online count + comment hot-reload + 28-day activity heatmap.
- Extended: FR-02.5 (file upload), FR-03.5 (comment likes), FR-04.5 (view tracking), FR-04.6 (post views), FR-04.7 (anonymous naming format).
- **8 ADRs** (ARCHITECTURE.md):
  - ADR-001: Monorepo Turborepo
  - ADR-002: NestJS cho backend
  - ADR-003: React Router v7
  - ADR-004: WebSocket via Socket.io
  - ADR-005: Prisma ORM (giữ)
  - ADR-006: JWT trong httpOnly cookie
  - ADR-007: Fly.io BE deploy
  - ADR-008: OpenAPI auto-gen từ NestJS
- **New entities (DATA_MODEL.md):** `File`, `CommentLike`, `PostView`, `AnonymousSession`, `RefreshToken`
- **New enums:** `FileType` (7 values), `CommentStatus` (3 values); extended `Role` với `BANNED`
- **`docs/TESTING_STRATEGY.md`** — extract từ CLAUDE.md + expand đầy đủ test pyramid + tools + data strategy + E2E catalog (E2E-01→E2E-13) + CI plan
- **`docs/contracts/openapi.yaml`** — placeholder (sẽ auto-gen sau khi BE scaffold)
- **Root `README.md`** — quick start + stack overview + link docs/INDEX.md
- **Root `.env.example`** — env matrix theo DEPLOYMENT.md

### Removed

- **`docs/PROMPT.md`** — spec gốc obsolete sau khi đổi stack + theme + features. `REQUIREMENTS.md` mới là single source of truth (Vision + Personas + Use Cases + FR + NFR + Traceability)
- **`docs/DATABASE_SCHEMA.md`** (renamed → `docs/DATA_MODEL.md`)
- **`docs/API.md`** (renamed → `docs/API_CONTRACT.md`)
- **Light mode spec** trong DESIGN_SYSTEM.md (TBD — sẽ document khi có yêu cầu)

### Migration notes

- v1 codebase chưa init → no breaking deps update
- v2 docs là source of truth cho mọi implementation tasks sau này
- Recovery: nếu cần spec gốc cũ, recover từ git history `git show <commit>:docs/PROMPT.md`
- Light mode: recover từ git history khi cần

---

## Template thêm release mới

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- ...

### Changed

- ...

### Deprecated

- ...

### Removed

- ...

### Fixed

- ...

### Security

- ...
```
