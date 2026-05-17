# MyBlog

> Social blog cá nhân — monorepo Turborepo (Vite React FE + NestJS BE).
> Cyberpunk / terminal aesthetic. Dark theme.

## Stack

- **Frontend** (`apps/web`): Vite + React 19 + React Router v7 + TanStack Query + Zustand + Tailwind + shadcn/ui
- **Backend** (`apps/api`): NestJS + Passport JWT + Prisma + Socket.io + Cloudinary + class-validator + Swagger
- **Database**: PostgreSQL (Neon prod / Docker local 2 DBs)
- **Real-time**: WebSocket via Socket.io
- **API contract**: OpenAPI 3.0 auto-gen từ NestJS Swagger
- **Testing**: Vitest (FE) + Jest (BE) + Supertest + Playwright
- **Deploy**: Vercel (FE) + Fly.io free tier (BE) + Neon free tier (DB)

## Quick Start (Local Dev)

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker Desktop

# 1. Clone & install
git clone <repo> myblog && cd myblog
pnpm install

# 2. Copy env templates (per app)
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local

# 3. Start Postgres (main + test)
docker compose up -d

# 4. Migrate + seed DB
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed

# 5. Generate OpenAPI types cho FE
pnpm --filter api openapi:generate
pnpm --filter web openapi:types

# 6. Start dev servers (Turbo parallel FE + BE)
pnpm dev
# FE: http://localhost:5173
# BE: http://localhost:3001
# Swagger UI: http://localhost:3001/swagger
```

Chi tiết setup: [docs/DEPLOYMENT.md > Local Dev Setup](docs/DEPLOYMENT.md).

## Documentation

| Doc | Mục đích |
|-----|----------|
| [docs/INDEX.md](docs/INDEX.md) | Navigation cho toàn bộ docs |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | WHAT & WHY (Vision, Personas, Use Cases, FR, NFR) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | HOW (C4 diagrams, ADRs, Security, Operations) |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Entities, ERD, Prisma schema |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | REST + WebSocket contract |
| [docs/UI_DESIGN.md](docs/UI_DESIGN.md) | Screens + wireframes |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Tokens + components (cyberpunk dark) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Setup + deploy guide |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Milestone tracker |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Release notes |

## Repository Layout

```
myblog/
├── apps/
│   ├── web/                Vite React frontend
│   │   ├── src/
│   │   ├── public/
│   │   └── vite.config.ts
│   └── api/                NestJS backend
│       ├── src/
│       ├── prisma/         schema.prisma + migrations + seed
│       ├── test/           integration tests
│       └── docs/
│           └── MIGRATIONS.md
├── packages/               shared types/utils (sẽ tạo khi cần)
├── docs/                   project documentation
├── design-file/            HTML/JSX prototype (read-only design source)
├── e2e/                    Playwright tests
├── docker-compose.yml      local Postgres
├── turbo.json              Turbo config
├── pnpm-workspace.yaml     workspaces
├── CLAUDE.md               AI assistant rules
└── README.md
```

**Lưu ý:** `apps/`, `packages/`, `docker-compose.yml`, `turbo.json`, `pnpm-workspace.yaml`, `e2e/` chưa tồn tại — sẽ được scaffold ở M2 (xem [docs/PROGRESS.md](docs/PROGRESS.md)).

## Workflow (SDD)

Mọi task PHẢI follow SDD workflow trong [CLAUDE.md](CLAUDE.md):

- **F1**: New Feature
- **F2**: New Requirement
- **F3**: Bug Fix
- **F4**: Hotfix (Phase A emergency + Phase B post-RCA)
- **F5**: Refactor
- **F6**: Docs-only
- **F7**: Chore

## Contributing

1. Đọc [CLAUDE.md](CLAUDE.md) để nắm SDD workflow + flow router
2. Check [docs/TASKS.md](docs/TASKS.md) để biết task đang DOING
3. Follow flow tương ứng (F1-F7)
4. Mỗi task hoàn tất ĐẦY ĐỦ flow (gồm test + doc update) trước khi commit

## License

(TBD — chưa quyết định, default proprietary)

## Tech References

- [Turborepo docs](https://turbo.build/repo/docs)
- [Vite docs](https://vitejs.dev/)
- [React Router v7](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query)
- [NestJS docs](https://docs.nestjs.com/)
- [Prisma docs](https://www.prisma.io/docs)
- [Neon docs](https://neon.tech/docs)
- [Fly.io docs](https://fly.io/docs)
- [Cloudinary docs](https://cloudinary.com/documentation)
