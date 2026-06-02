# Prod image cho apps/api (NestJS) — Fly.io.
# Build context = REPO ROOT (pnpm workspace cần lockfile + workspace manifests).
#   Build: `docker build -f apps/api/Dockerfile -t kha-blog-api .` (chạy từ repo root)
#   Fly:   fly.toml `build.dockerfile = "apps/api/Dockerfile"`, deploy từ repo root.
# Base theo Dockerfile.dev: alpine + libc6-compat + openssl (Prisma query engine) + pnpm@9.15.0.
# Giữ devDeps (prisma CLI + tsx) trong image để release_command chạy `prisma migrate deploy`
# và (one-time) `prisma db seed`. Single-stage cho độ tin cậy (symlink pnpm store nguyên vẹn).
FROM node:24-alpine

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /repo

# 1) Layer deps: chỉ copy manifests + lockfile → cache install khi source đổi mà deps không đổi.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter api...

# 2) Copy source api + build (prisma generate trước nest build).
COPY apps/api apps/api
RUN pnpm --filter api exec prisma generate \
  && pnpm --filter api build

WORKDIR /repo/apps/api
ENV NODE_ENV=production
EXPOSE 3001

# Migrate chạy ở fly.toml release_command (trước khi release live), KHÔNG ở CMD.
CMD ["node", "dist/main"]
