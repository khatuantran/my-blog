# System Architecture

> HOW the system works. WHAT/WHY: [REQUIREMENTS.md](./REQUIREMENTS.md). DATA: [DATA_MODEL.md](./DATA_MODEL.md). API: [API_CONTRACT.md](./API_CONTRACT.md).

## Overview

MyBlog là **monorepo** split frontend / backend rõ ràng:

- `apps/web` — Vite + React 19 + React Router v7 (SPA static)
- `apps/api` — NestJS (REST + WebSocket)
- `packages/` — shared types, lib chung (sẽ thêm khi cần)

Deploy độc lập: FE → Vercel, BE → Fly.io, DB → Neon.

## Context Diagram (C4 Level 1)

```
                  ┌──────────────────┐
                  │   User browser   │
                  │  (Admin / Auth / │
                  │    Anonymous)    │
                  └────────┬─────────┘
                           │ HTTPS + WSS
                           ▼
                  ┌──────────────────┐
                  │   MyBlog System  │
                  └──────┬───┬───────┘
                         │   │
              ┌──────────┘   └──────────┐
              ▼                          ▼
       ┌────────────┐            ┌────────────┐
       │  Neon DB   │            │ Cloudinary │
       │ (Postgres) │            │ (img+file) │
       └────────────┘            └────────────┘
```

## Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────┐
│                       MyBlog System                          │
│                                                              │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │   apps/web (Vercel)  │         │   apps/api (Fly.io)  │  │
│  │                      │         │                      │  │
│  │  Vite + React 19     │  HTTPS  │  NestJS              │  │
│  │  React Router v7     │ ◄─────► │  Passport JWT        │  │
│  │  TanStack Query      │         │  Prisma              │  │
│  │  Socket.io-client    │  WSS    │  Socket.io           │  │
│  │  Tailwind + shadcn   │ ◄─────► │  Cloudinary SDK      │  │
│  └──────────────────────┘         └──────────┬───────────┘  │
│                                              │              │
│                              ┌───────────────┼──────────┐   │
│                              ▼               ▼          │   │
│                       ┌────────────┐  ┌────────────┐   │   │
│                       │  Neon PG   │  │ Cloudinary │   │   │
│                       │   (DaaS)   │  │   (SaaS)   │   │   │
│                       └────────────┘  └────────────┘   │   │
└────────────────────────────────────────────────────────────┘
```

**Communication:**

- Browser ↔ apps/web: HTTPS static asset (Vercel CDN)
- apps/web ↔ apps/api: HTTPS REST (`fetch` via TanStack Query) + WSS (Socket.io)
- apps/api ↔ Neon: SQL via Prisma (pooled `DATABASE_URL` + direct `DIRECT_URL` cho migration)
- apps/api ↔ Cloudinary: HTTPS upload qua signed URL (**prod**, `STORAGE_DRIVER=cloudinary`)

**Storage driver (ADR-010):** tầng upload trừu tượng hoá theo `STORAGE_DRIVER`. **Prod** dùng `cloudinary` (sơ đồ trên). **Local dev** dùng `local`: FE upload multipart lên apps/api → ghi volume bind-mount `./storage/uploads` → serve tĩnh `/uploads` (không cần Cloudinary).

**Local dev topology (ADR-010):** khác prod — **apps/api + postgres chạy trong Docker Compose** (`apps/api/Dockerfile.dev`, bind-mount source + named-volume node_modules), **apps/web chạy host** (Vite `:5173`); storage = local volume. Prod vẫn Vercel + Fly.io + Neon + Cloudinary như sơ đồ.

## Component Diagram (C4 Level 3)

### apps/web components

```
apps/web/
├── src/                        ← source code (PURE, không test)
│   ├── pages/                  ← React Router v7 routes
│   │   ├── FeedPage.tsx        (/)
│   │   ├── PostDetailPage.tsx  (/post/:id)
│   │   ├── CreatePostPage.tsx  (/admin/create)
│   │   ├── AdminPage.tsx       (/admin)
│   │   ├── LoginPage.tsx       (/auth/login)
│   │   └── RegisterPage.tsx    (/auth/register)
│   ├── components/
│   │   ├── layout/             (TopBar, StatusBar, AppLayout, AuthLayout, Logo)
│   │   ├── post/               (PostCard, PostContent, ImageGrid, ImageCarousel, FileAttachments)
│   │   ├── ui/                 (shadcn primitives: Button, Card, Input, Dialog, ...)
│   │   ├── shared/             (MoodBadge, TagPill, Avatar, Sparkline, AsciiBar)
│   │   ├── command-palette/    (CommandPalette overlay)
│   │   └── admin/              (StatCard, MoodBar, UsersTable, CommentsModeration, ActivityLog)
│   ├── hooks/                  (useAuth, usePosts, useComments, useWebSocket, useCommandPalette)
│   ├── services/
│   │   ├── api/                (typed HTTP client, generated từ openapi.yaml)
│   │   ├── ws/                 (Socket.io client + event handlers)
│   │   └── storage.ts          (cookie + localStorage helpers)
│   ├── lib/
│   │   ├── validators.ts       (Zod schemas)
│   │   ├── logger.ts           (loglevel wrapper)
│   │   ├── env.ts              (Zod VITE_* validate)
│   │   └── utils.ts            (cn helper)
│   ├── stores/                 (Zustand — UI state global khi cần)
│   └── types/                  (re-export từ generated openapi types)
└── tests/                      ← TÁCH KHỎI src (mirror structure)
    ├── setup.ts                (Vitest setupFiles)
    ├── _helpers/               (factories, fixtures, MSW handlers)
    ├── hooks/                  (*.test.ts mirror src/hooks/)
    ├── components/             (*.test.tsx mirror src/components/)
    └── lib/                    (*.test.ts mirror src/lib/)
```

### apps/api modules (NestJS)

```
apps/api/
├── src/                        ← source code (PURE, không test)
│   ├── auth/                   AuthModule
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts  (POST /auth/login, /register, /refresh, /logout)
│   │   ├── auth.service.ts     (bcrypt + JWT issue/verify)
│   │   ├── strategies/         (JwtStrategy, JwtRefreshStrategy)
│   │   ├── guards/             (JwtAuthGuard, RolesGuard)
│   │   └── dto/                (LoginDto, RegisterDto)
│   ├── users/                  UsersModule (CRUD users, ban)
│   ├── posts/                  PostsModule (CRUD posts + view tracking)
│   ├── comments/               CommentsModule (CRUD + moderation)
│   ├── likes/                  LikesModule (toggle posts/comments — 2 endpoint riêng)
│   ├── files/                  FilesModule (StorageService driver: Cloudinary | local volume — ADR-010)
│   ├── tags/                   TagsModule (CRUD tags + popular list)
│   ├── admin/                  AdminModule (stats, activity, users mgmt)
│   ├── realtime/               RealtimeGateway (Socket.io @WebSocketGateway)
│   ├── prisma/                 PrismaModule (singleton PrismaService)
│   ├── config/                 (env.schema.ts — Zod validate)
│   ├── common/
│   │   ├── filters/            (HttpExceptionFilter — format `{error: {code, message}}`)
│   │   ├── interceptors/       (TransformInterceptor — wrap `{data, meta}`, LoggingInterceptor)
│   │   ├── pipes/              (ZodValidationPipe — optional, default class-validator)
│   │   ├── decorators/         (@CurrentUser, @Public, @Roles)
│   │   └── middleware/         (AnonymousIdMiddleware — issue cookie nếu chưa có)
│   └── main.ts                 (bootstrap + Swagger setup + CORS + global pipes)
├── prisma/                     (schema.prisma + migrations)
└── tests/                      ← TÁCH KHỎI src (unit + e2e + helpers)
    ├── jest-e2e.json           (e2e config, rootDir=..)
    ├── _helpers/               (factories, db reset, app init)
    ├── auth/                   (*.spec.ts mirror src/auth/)
    ├── posts/                  (*.spec.ts mirror src/posts/)
    └── *.e2e-spec.ts           (integration tests at top level)
```

## Data Flow Diagrams

### Login flow (JWT issuance + refresh)

```
[Browser]                    [apps/web]                  [apps/api]                   [DB]
   │  POST /auth/login          │                            │                          │
   │ ──────────────────────────►│  fetch('/auth/login')      │                          │
   │                            │ ──────────────────────────►│                          │
   │                            │                            │  bcrypt.compare()        │
   │                            │                            │ ────────────────────────►│
   │                            │                            │  user record             │
   │                            │                            │◄─────────────────────────│
   │                            │                            │  jwt.sign(access 15min)  │
   │                            │                            │  jwt.sign(refresh 30d)   │
   │                            │  Set-Cookie: access_token  │                          │
   │                            │  Set-Cookie: refresh_token │                          │
   │                            │◄───────────────────────────│                          │
   │  Set-Cookie httpOnly       │                            │                          │
   │◄───────────────────────────│                            │                          │
   │                            │                            │                          │
   │  (15min later)             │                            │                          │
   │  Request với access expired│                            │                          │
   │                            │  catch 401 → refresh flow  │                          │
   │                            │  POST /auth/refresh        │                          │
   │                            │ ──────────────────────────►│                          │
   │                            │                            │  verify refresh_token    │
   │                            │                            │  issue new access        │
   │                            │  new access_token cookie   │                          │
   │                            │◄───────────────────────────│                          │
```

### Post creation flow (image/file upload)

> Sơ đồ dưới = `STORAGE_DRIVER=cloudinary` (prod). Với `local` (dev, ADR-010): `/files/sign` trả `{ provider:'local', uploadUrl:'/files/upload' }`; FE POST file multipart lên `apps/api POST /files/upload` (thay Cloudinary) → BE ghi volume + trả `{ url, publicId }`; các bước `/posts` về sau giống hệt.

```
[CreatePostPage] [apps/api]                  [Cloudinary]       [DB]
   │  POST /files/sign           │                                  │
   │ ───────────────────────────►│  generate signed params          │
   │                             │  (provider + sign with secret)   │
   │  signed params              │                                  │
   │◄────────────────────────────│                                  │
   │                                                                │
   │  POST direct lên Cloudinary với signed params                  │
   │  (local: POST /files/upload multipart → apps/api ghi volume)   │
   │ ──────────────────────────────────────────►│                   │
   │  { secure_url, public_id, ... }            │                   │
   │◄───────────────────────────────────────────│                   │
   │                                                                │
   │  POST /posts với { content, mood, tags, images[], files[] }    │
   │ ───────────────────────────►│                                  │
   │                             │  Prisma create transaction       │
   │                             │ ────────────────────────────────►│
   │                             │  post + image[] + file[] + tag[] │
   │                             │◄─────────────────────────────────│
   │                             │  emit 'post:new' WS event        │
   │  201 + post                 │                                  │
   │◄────────────────────────────│                                  │
```

### Real-time comment flow (WebSocket)

```
[Viewer A: PostDetail]  [Viewer B: PostDetail]   [apps/api WS]            [DB]
   │  WSS connect              │  WSS connect              │                  │
   │ ─────────────────────────────────────────────────────►│                  │
   │  join room `post:abc123`  │ ─────────────────────────►│                  │
   │                           │  join room `post:abc123`  │                  │
   │                           │                           │                  │
   │  POST /comments           │                           │                  │
   │  (REST)                   │                           │                  │
   │ ─────────────────────────────────────────────────────►│                  │
   │                           │                           │  Prisma create   │
   │                           │                           │ ────────────────►│
   │                           │                           │◄─────────────────│
   │                           │                           │  emit 'comment:new' │
   │                           │                           │  to room post:abc123│
   │  WS event 'comment:new'   │  WS event 'comment:new'   │                  │
   │◄──────────────────────────│◄──────────────────────────│                  │
   │  TanStack Query           │  TanStack Query           │                  │
   │  invalidate comments      │  invalidate comments      │                  │
```

## ADRs (Architecture Decision Records)

### ADR-001: Monorepo Turborepo

- **Date:** 2026-05-17
- **Status:** Accepted
- **Context:** Cần code-share giữa FE/BE (types từ OpenAPI), build/dev/test độc lập, deploy riêng.
- **Decision:** **Turborepo** với pnpm workspaces. `apps/web` + `apps/api` + `packages/shared-types` (sẽ thêm khi cần).
- **Alternatives considered:**
  - Nx — feature phong phú hơn nhưng overhead cao, plugin-heavy
  - Lerna — legacy, không recommended cho project mới
  - Bare pnpm workspaces — thiếu cache build/test → chậm CI
- **Consequences:**
  - Pro: cache local + remote (Vercel remote cache free), parallel pipeline, atomic deploy
  - Con: cần học turbo.json + filter syntax `--filter`

### ADR-002: NestJS cho Backend

- **Date:** 2026-05-17
- **Status:** Accepted
- **Context:** Cần structured backend với DI, modular, OpenAPI auto-gen, WebSocket support.
- **Decision:** **NestJS** v10+.
- **Alternatives considered:**
  - Express raw — quá low-level, mỗi concern phải tự build (DI, validation, swagger)
  - Fastify — nhanh hơn nhưng ecosystem smaller, ít plugin chuẩn
  - Hono — edge-first, nhưng @nestjs ecosystem stronger cho enterprise pattern + Prisma integration
- **Consequences:**
  - Pro: decorator-based clean, `@nestjs/swagger` auto-gen OpenAPI, `@nestjs/websockets` cho Socket.io, opinionated structure dễ onboard
  - Con: heavier than Hono/Fastify (~50MB node_modules); cold start chậm hơn trên Fly.io free

### ADR-003: React Router v7 cho Frontend

- **Date:** 2026-05-17
- **Status:** Accepted
- **Context:** SPA cần routing client-side, support code-split per route, không cần SSR.
- **Decision:** **React Router v7** (formerly Remix Router).
- **Alternatives considered:**
  - TanStack Router — type-safe routes, nhưng smaller community
  - Next.js App Router — full framework, bị loại vì user yêu cầu KHÔNG dùng Next.js
  - Remix v2 — full framework with SSR, overkill cho static SPA + Vercel deploy
- **Consequences:**
  - Pro: mature, lazy loading routes built-in, `data` loader pattern (optional dùng), familiar
  - Con: less type-safety so với TanStack Router (cần wrap)

### ADR-004: WebSocket via Socket.io

- **Date:** 2026-05-17
- **Status:** Accepted
- **Context:** Cần real-time bi-directional (FR-09): activity feed admin, live visitors, online count, comment hot-reload.
- **Decision:** **Socket.io** qua `@nestjs/websockets`.
- **Alternatives considered:**
  - Native WebSocket (ws lib) — không có room management, không auto-reconnect, fallback manual
  - SSE (Server-Sent Events) — one-way only, không phù hợp comment hot-reload (cần broadcast tới room)
  - Polling — waste bandwidth, lag, không real-time đúng nghĩa
- **Consequences:**
  - Pro: rooms, auto-reconnect, fallback long-polling, native NestJS gateway support, broadcast tới room dễ
  - Con: Fly.io free tier giới hạn concurrent connection; cần config CORS WS riêng

### ADR-005: Prisma ORM (giữ)

- **Date:** 2026-05-17
- **Status:** Accepted
- **Context:** Cần ORM type-safe cho Postgres, integrate NestJS DI.
- **Decision:** **Prisma** qua `nestjs-prisma` (PrismaService singleton).
- **Alternatives considered:**
  - Drizzle — lightweight, SQL-first, type inference tốt, nhưng migration tooling less mature
  - TypeORM — legacy, decorator clash với NestJS, schema sync issues
  - Kysely — SQL-builder thuần, không có migration tool tích hợp
- **Consequences:**
  - Pro: ergonomic schema DSL, `prisma migrate` tốt, generated client type-safe, Neon adapter sẵn
  - Con: Prisma client size lớn (~10MB) ảnh hưởng cold start; cần `prisma generate` step trong CI

### ADR-006: JWT trong httpOnly cookie (vs localStorage)

- **Date:** 2026-05-17
- **Status:** Accepted
- **Context:** Auth token storage strategy.
- **Decision:** **httpOnly cookie** với `SameSite=Strict; Secure` (prod) cho cả access + refresh token.
- **Alternatives considered:**
  - localStorage — vulnerable XSS, không nên cho session token
  - sessionStorage — mất khi đóng tab, UX kém
- **Consequences:**
  - Pro: immune XSS (JS không đọc được), CSRF protected bởi SameSite=Strict
  - Con: cross-domain phức tạp hơn (cần FE và API cùng domain hoặc proper CORS); cần `credentials: 'include'` mỗi fetch

### ADR-007: Fly.io free tier cho BE deploy

- **Date:** 2026-05-17
- **Status:** Accepted
- **Context:** Cần host BE Node.js, budget zero.
- **Decision:** **Fly.io** free tier — 1 machine shared CPU + 256MB RAM + auto_stop.
- **Alternatives considered:**
  - Railway — free trial expire sau $5 credit
  - Render — free tier sleep 15min idle, cold start chậm
  - Cloudflare Workers — Node compat hạn chế, Prisma support limited (edge runtime)
  - Vercel Functions — serverless, không phù hợp WebSocket persistent connection
- **Consequences:**
  - Pro: free + always-on option (chấp nhận trade-off), region SIN/HKG gần VN, deploy `fly deploy` simple
  - Con: sleep sau idle → cold start ~3-5s; 256MB RAM cần optimize NestJS bundle size; concurrent WS connection giới hạn

### ADR-008: OpenAPI auto-gen từ NestJS

- **Date:** 2026-05-17
- **Status:** Accepted
- **Context:** Cần single source of truth cho API contract, sync giữa BE + FE.
- **Decision:** **`@nestjs/swagger`** auto-generate `docs/contracts/openapi.yaml` từ NestJS decorator. FE dùng `openapi-typescript` generate `apps/web/src/types/api.ts`.
- **Alternatives considered:**
  - Viết tay OpenAPI trước (spec-first) — overhead duplicate spec + code, dễ drift
  - tRPC — bỏ REST, không phù hợp khi muốn public API + flexibility
  - GraphQL — overkill cho project nhỏ, học cost cao
- **Consequences:**
  - Pro: 1 source (code is spec), FE types auto-sync, contract test dễ
  - Con: phụ thuộc decorator discipline (mọi DTO + endpoint phải có `@ApiProperty`, `@ApiResponse`); cần CI step `pnpm openapi:generate` + commit yaml

### ADR-009: RichTextEditor engine — execCommand → TipTap (ProseMirror)

- **Date:** 2026-05-31
- **Status:** Accepted
- **Context:** RichTextEditor (Create Post, T-368/T-369) ban đầu dựng trên `document.execCommand` + `contentEditable`. `execCommand` đã deprecated và sinh HTML không kiểm soát (`<font>`, `<span style>` lồng nhau) → content phình to với text ngắn (BUG-020), markup khó render/truncate ổn định ở preview (BUG-019), và spacing block không nhất quán (BUG-021).
- **Decision:** Thay engine sang **TipTap (ProseMirror)** — schema-based editor cho output HTML semantic gọn và đoán được (`<p>/<strong>/<em>/<u>/<s>/<mark>/<h1>/<h2>/<ul>/<ol>/<a>`). Giữ nguyên public contract của component (`RichTextEditorHandle.applyLink`, `onRequestLink`, `value/onChange` HTML string) + design-file fidelity (11-button toolbar, 7 text-color/7 highlight swatches, EmojiPicker, data-testid/aria) — chỉ đổi cơ chế bên trong.
- **Alternatives considered:**
  - Giữ contentEditable + tự normalize output (Range/DOM manipulation) — không thêm dep nhưng code DOM-manip thủ công tỉ mỉ, dễ phát sinh edge-case; user chọn lib chuẩn.
  - Slate / Lexical — mạnh tương đương; TipTap chọn vì API React (`useEditor`) gọn + extension sẵn cho color/highlight/link/underline.
- **Consequences:**
  - Pro: markup sạch ổn định → fix 3 bug tận gốc (preview render đúng, không phình, prose spacing kiểm soát qua CSS); chuẩn lib maintain dễ.
  - Con: thêm dependency FE (~100kb gồm ProseMirror core + extensions); toolbar binding viết lại theo TipTap command; test RichTextEditor rewrite (bỏ stub execCommand → assert mark/node render).
  - Backward-compatible: content cũ (markdown legacy / HTML execCommand đã publish) vẫn render qua nhánh `isHtmlContent`/markdown của `PostContent` — không cần migrate.

### ADR-010: Storage driver abstraction (Cloudinary prod / local volume dev)

- **Date:** 2026-05-31
- **Status:** Accepted
- **Context:** Upload trước đây hardcode Cloudinary (signed direct upload). Local dev cần upload được mà không phụ thuộc Cloudinary creds; user muốn local lưu file vào volume trên máy. Đồng thời backend local chuyển chạy trong Docker (api + postgres), prod giữ Vercel/Fly/Neon.
- **Decision:** Trừu tượng hoá tầng lưu trữ qua `StorageDriver` (`signUpload`, `destroyMany`, `saveUpload`), chọn bằng env **`STORAGE_DRIVER` (`cloudinary` | `local`, default `cloudinary`)**:
  - **`cloudinary`** (prod): giữ nguyên flow — `POST /files/sign` trả signed params (`provider:'cloudinary'`), FE upload thẳng `api.cloudinary.com`.
  - **`local`** (dev): `POST /files/sign` trả `{ provider:'local', uploadUrl:'/files/upload' }`; FE POST file multipart lên `POST /files/upload`; BE ghi vào `STORAGE_LOCAL_PATH` (bind-mount `./storage/uploads`) + serve tĩnh tại `/uploads`; URL tuyệt đối `${STORAGE_PUBLIC_URL}/uploads/<publicId>`.
  - FE chọn nhánh theo field `provider` trong response sign (BE là nguồn chân lý, không cần VITE flag).
  - `StorageService` facade chọn driver; inject vào `files.service` / `posts.service` / `users.service` thay `CloudinaryService` trực tiếp (giữ method signature).
- **Alternatives considered:**
  - VITE_UPLOAD_MODE riêng ở FE — dễ lệch với BE; bỏ (driver chọn ở BE, FE đọc provider).
  - Containerize cả web — user chọn chỉ api+postgres (web giữ host vite).
  - `@nestjs/serve-static` — dùng `app.useStaticAssets` (platform-express có sẵn) để khỏi thêm dep.
- **Consequences:**
  - Pro: local dev không cần Cloudinary; file thấy trực tiếp trên host; prod bất biến; DB `publicId` provider-agnostic nên KHÔNG đổi schema.
  - Con: thêm endpoint `POST /files/upload` (multipart, cần multer) chỉ dùng ở local; 2 flow upload khác nhau (sign→direct vs sign→BE-upload); orphan-file cleanup local là best-effort `unlink`.

## Security Policy

### Auth model

- **JWT access token:** 15min TTL, signed với `JWT_SECRET`
- **JWT refresh token:** 30d TTL, signed với `JWT_REFRESH_SECRET`, lưu trong DB (table `RefreshToken`) để có thể revoke
- **Rotation:** mỗi lần refresh issue token mới, invalidate cũ
- **Storage:** httpOnly cookie `SameSite=Strict; Secure` (prod) / `SameSite=Lax` (dev)
- **Logout:** xóa cả 2 cookie + invalidate refresh token trong DB

### CORS

- BE chỉ allow origin từ env `CORS_ORIGIN` (FE Vercel URL) + `http://localhost:5173` (dev)
- `credentials: true` để cookie work cross-origin
- WS namespace dùng cùng CORS config

### Rate limiting

- `@nestjs/throttler` global, default 60 req/min/IP
- Override cho endpoints sensitive:
  - `POST /auth/register`: 5 req/min/IP
  - `POST /auth/login`: 10 req/min/IP
  - `POST /comments`: 10 req/min/IP/anonymousId
  - `POST /likes/*`: 30 req/min/IP/anonymousId

### Input validation

- BE: `ValidationPipe` global với `whitelist: true, forbidNonWhitelisted: true, transform: true`
- BE: DTOs với `class-validator` decorators
- FE: Zod schemas trong `src/lib/validators.ts` cho mọi form

### Secret management

- KHÔNG hardcode trong code
- Local: `apps/api/.env` + `apps/web/.env.local` (gitignored)
- Prod FE: Vercel Environment Variables UI
- Prod BE: `fly secrets set KEY=value`
- Rotation policy: rotate `JWT_SECRET` + `JWT_REFRESH_SECRET` mỗi 90 ngày (invalidate hết session — user phải re-login)

### Threat model (top 5)

| Threat            | Mitigation                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **SQL Injection** | Prisma parameterized queries; KHÔNG dùng `$queryRawUnsafe` với user input                                           |
| **XSS (stored)**  | Sanitize user-generated content (comment, anonymousName) bằng DOMPurify FE; CSP header `script-src 'self'`          |
| **CSRF**          | httpOnly cookie + `SameSite=Strict`; CSRF token cho mutation request từ form (NestJS có thể dùng `csurf`)           |
| **Broken Auth**   | bcrypt cost ≥ 10; refresh token rotation; logout invalidate; rate limit login; lock account sau 5 fail trong 10min  |
| **IDOR**          | Check ownership trong service layer cho mọi resource (vd: chỉ admin xóa post của mình); KHÔNG trust client-sent IDs |

## Operations Runbook

### Monitoring

- **Sentry (FE + BE):** Error tracking, performance transactions, release tagging
- **Fly metrics:** CPU, memory, network, HTTP status — built-in dashboard
- **Neon dashboard:** Query performance, connection count, storage
- **Vercel Analytics:** Web Vitals (LCP, FID, CLS), traffic
- **Custom WebSocket metrics:** Track concurrent connection count qua Prometheus endpoint `/metrics` (optional, sau)

### Alert rules

| Alert                          | Trigger               | Action                                                       |
| ------------------------------ | --------------------- | ------------------------------------------------------------ |
| BE 5xx rate > 1% (5min window) | Sentry alert email    | Check Fly logs `fly logs`, Sentry issue list                 |
| BE p95 latency > 500ms (5min)  | Fly metrics → webhook | Check slow query trong Neon, add index nếu cần               |
| DB connection > 80% pool       | Neon dashboard alert  | Restart BE machine, check connection leak                    |
| Cloudinary quota > 80%         | Manual monthly check  | Cleanup unused images, plan upgrade                          |
| BE machine down                | Fly health check fail | Auto-restart bởi Fly; manual `fly machine restart` nếu stuck |

### Incident response steps

1. **Acknowledge** trong < 15 min (Sentry email / Slack webhook nếu setup)
2. **Triage** severity:
   - **Critical:** prod down, user không dùng được → F4 Hotfix flow (xem CLAUDE.md)
   - **High:** 1 feature broken nhưng workaround có → F3 Bug Fix
   - **Medium/Low:** không impact user ngay → F3 với P2/P3
3. **Mitigate first**: rollback deployment > add feature flag > hotfix code
4. **Document** trong `docs/BUGS.md` với severity + impact
5. **Post-mortem** (cho Critical): ADR vào ARCHITECTURE.md nếu architectural issue

### Backup strategy

- **Neon auto-backup:** Point-in-time restore 7 days (free tier)
- **Cloudinary:** Resources kept indefinitely (free tier 25GB)
- **Code:** GitHub repository
- **Secrets:** lưu trong password manager (1Password / Bitwarden) — KHÔNG commit
- **Local DB dump (optional):** `pg_dump` weekly export → cloud storage

### Restore procedure

1. **DB:** Neon Console → Branches → tạo branch từ PITR timestamp → swap connection string
2. **App:** `fly deploy` lại từ commit cũ; hoặc Vercel UI promote previous deployment
3. **Verify:** smoke test core flows (login, feed, create post)

### Scaling considerations

- **FE (Vercel):** Auto-scale CDN; không cần config
- **BE (Fly.io):** Free tier 1 machine; upgrade `fly scale count 2` khi cần horizontal
- **DB (Neon):** Free tier 0.5GB storage + 100h compute/month; upgrade Pro $19/mo nếu vượt
- **WebSocket sticky session:** khi scale > 1 machine, cần Redis adapter cho Socket.io (`socket.io-redis`) — chưa cần ở giai đoạn early

---

## Template thêm ADR mới

```markdown
### ADR-XXX: <Tiêu đề quyết định>

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-YYY
- **Context:** Vấn đề cần giải quyết
- **Decision:** Chọn cái gì
- **Alternatives considered:** Đã cân nhắc gì, vì sao loại
- **Consequences:** Trade-off, ảnh hưởng
```

## Template thêm Threat Model row mới

```markdown
| <Threat name> | <Mitigation strategy> |
```

## Template thêm Alert rule mới

```markdown
| <Alert name> | <Trigger condition> | <Action when fired> |
```
