# `@myblog/api` — Backend

NestJS + Prisma + Passport JWT + Socket.io + Cloudinary.

## Quick Start

```bash
# Từ root repo
pnpm install
cp apps/api/.env.example apps/api/.env.local   # điền secrets thật
docker compose up -d                            # postgres-main + postgres-test
pnpm --filter api prisma:generate               # generate Prisma client
pnpm --filter api dev                           # nest start --watch → :3001
# Swagger UI: http://localhost:3001/swagger (dev only)
```

## Scripts

| Script                              | Mô tả                                               |
| ----------------------------------- | --------------------------------------------------- |
| `pnpm --filter api dev`             | NestJS watch mode                                   |
| `pnpm --filter api build`           | Compile to `dist/`                                  |
| `pnpm --filter api start`           | Run prod build (`node dist/main`)                   |
| `pnpm --filter api test`            | Jest unit                                           |
| `pnpm --filter api test:e2e`        | Supertest integration (require postgres-test :5433) |
| `pnpm --filter api typecheck`       | `tsc --noEmit`                                      |
| `pnpm --filter api prisma:generate` | Regenerate Prisma client                            |

## Structure

Xem [docs/ARCHITECTURE.md > apps/api modules](../../docs/ARCHITECTURE.md). Conventions: [docs/CODING_CONVENTION.md §Backend](../../docs/CODING_CONVENTION.md).

## Migrations

Migration log: [`apps/api/docs/MIGRATIONS.md`](./docs/MIGRATIONS.md). Summary cấp cao: [`docs/DATA_MODEL.md`](../../docs/DATA_MODEL.md).
