# `@myblog/api` — Backend

NestJS + Prisma + Passport JWT + Socket.io. Storage driver (ADR-010): Cloudinary (prod) / local volume (dev) qua `STORAGE_DRIVER`.

## Quick Start

**Khuyến nghị (ADR-010): chạy trong Docker** (api + postgres, storage=local):

```bash
# Từ root repo — cần apps/api/.env (cp từ .env.example, điền JWT/ADMIN)
cp apps/api/.env.example apps/api/.env
docker compose up -d postgres-main api          # api: Dockerfile.dev, install→generate→migrate→watch :3001
# Swagger UI: http://localhost:3001/swagger · uploads local: ./storage/uploads → /uploads
```

**Hoặc chạy host:**

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
# Optional: apps/api/.env.test (override DATABASE_URL → :5433 cho test)
docker compose up -d postgres-main postgres-test
pnpm --filter api prisma:generate
pnpm --filter api dev                           # nest start --watch → :3001
# Storage host: set STORAGE_DRIVER=local (volume) hoặc cloudinary + creds trong .env
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
