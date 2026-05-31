# Makefile — MyBlog dev shortcuts
#
# Wrapper tiện lợi quanh pnpm / turbo / docker compose (KHÔNG thay thế chúng — chỉ gom command hay dùng).
# Source of truth vẫn là package.json scripts + docker-compose.yml + docs/DEPLOYMENT.md.
# Dùng: `make` hoặc `make help` để xem danh sách.

# Dùng bash cho recipe (cú pháp || / && nhất quán).
SHELL := /bin/bash

# Postgres services trong docker-compose.yml (api service tách riêng cho ADR-010).
DB_SERVICES := postgres-main postgres-test

.DEFAULT_GOAL := help

# ── Help ───────────────────────────────────────────────────────────────────
.PHONY: help
help: ## Hiện danh sách command (mặc định)
	@echo "MyBlog — make targets:"
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ── Quick start ──────────────────────────────────────────────────────────────
.PHONY: start
start: db dev ## ⚡ Start nhanh: bật Postgres rồi chạy FE+BE dev (host)

.PHONY: setup
setup: install env db migrate seed openapi ## First-time setup: install + env + db + migrate + seed + openapi types

# ── Install / env ────────────────────────────────────────────────────────────
.PHONY: install
install: ## Cài dependencies toàn monorepo (pnpm)
	pnpm install

.PHONY: env
env: ## Copy env templates (KHÔNG ghi đè file đã tồn tại)
	@test -f apps/api/.env || cp apps/api/.env.example apps/api/.env && echo "apps/api/.env ready"
	@test -f apps/web/.env.local || cp apps/web/.env.example apps/web/.env.local && echo "apps/web/.env.local ready"

# ── Dev servers ──────────────────────────────────────────────────────────────
.PHONY: dev
dev: ## Chạy FE + BE dev song song (turbo, host) — FE :5173 / BE :3001
	pnpm dev

.PHONY: dev-web
dev-web: ## Chạy riêng FE dev (vite, :5173)
	pnpm --filter web dev

.PHONY: dev-api
dev-api: ## Chạy riêng BE dev (nest --watch, :3001)
	pnpm --filter api dev

# ── Docker / Postgres ────────────────────────────────────────────────────────
.PHONY: db
db: ## Bật Postgres main(:5434) + test(:5433) qua docker compose
	docker compose up -d $(DB_SERVICES)

.PHONY: db-down
db-down: ## Stop Postgres (giữ data)
	docker compose stop $(DB_SERVICES)

.PHONY: db-reset
db-reset: ## ⚠️ Xoá volume DB rồi bật lại (mất toàn bộ data local)
	docker compose down -v
	docker compose up -d $(DB_SERVICES)

.PHONY: docker-api
docker-api: ## Build + chạy api + postgres trong Docker (ADR-010, web vẫn chạy host)
	docker compose up -d --build api

.PHONY: docker-down
docker-down: ## Stop toàn bộ container (postgres + api), giữ data
	docker compose down

.PHONY: logs
logs: ## Tail log container api
	docker compose logs -f api

# ── Prisma / DB schema ───────────────────────────────────────────────────────
.PHONY: migrate
migrate: ## Chạy Prisma migrate dev (host, đọc apps/api/.env)
	pnpm --filter api prisma:migrate

.PHONY: generate
generate: ## Regenerate Prisma client
	pnpm --filter api prisma:generate

.PHONY: seed
seed: ## Seed DB (admin + sample posts/tags, idempotent)
	pnpm --filter api db:seed

.PHONY: studio
studio: ## Mở Prisma Studio (GUI xem DB)
	pnpm --filter api prisma:studio

# ── OpenAPI contract ─────────────────────────────────────────────────────────
.PHONY: openapi
openapi: ## Regenerate openapi.yaml (BE) + FE types
	pnpm openapi:sync

# ── Quality gates ────────────────────────────────────────────────────────────
.PHONY: lint
lint: ## Lint toàn monorepo (eslint, 0 warning)
	pnpm lint

.PHONY: format
format: ## Prettier format toàn repo
	pnpm format

.PHONY: typecheck
typecheck: ## Typecheck toàn monorepo (tsc --noEmit)
	pnpm typecheck

.PHONY: test
test: ## Chạy unit test (FE Vitest + BE Jest)
	pnpm test:unit

.PHONY: test-e2e
test-e2e: ## Chạy integration test (Supertest, cần Postgres test :5433)
	pnpm test:e2e

.PHONY: test-pw
test-pw: ## Chạy Playwright E2E (cần FE+BE đang chạy)
	pnpm test:e2e:playwright

.PHONY: check
check: lint typecheck test ## Pre-commit gate: lint + typecheck + unit test

.PHONY: build
build: ## Build production toàn monorepo
	pnpm build

# ── Cleanup ──────────────────────────────────────────────────────────────────
.PHONY: clean
clean: ## Xoá build artifact + node_modules (turbo clean)
	pnpm clean
