---
name: myblog-backend-review
description: Review chuyên sâu code backend (apps/api, NestJS) trong MyBlog project. Kích hoạt sau mỗi lần viết/sửa code BE — khi user nói "review backend", "xong BE", "check api", "done service", hoặc khi Claude vừa viết/sửa file trong apps/api/ (controller, service, gateway, dto, guard, prisma). Kiểm tra 2 tầng: (1) Convention — TypeScript, naming, enums, logging, DTO decorators, module structure; (2) Deep — NestJS architecture, DI, Prisma query correctness (N+1, transaction, select), guard/interceptor flow, security checklist, performance. Không bỏ qua kể cả thay đổi nhỏ.
---

# MyBlog Backend Deep Review

Review code BE (`apps/api/`) theo `docs/CODING_CONVENTION.md` (Universal + Backend) + `docs/ARCHITECTURE.md`.
Chạy SAU khi code BE xong, TRƯỚC khi commit.

---

## Bước 1: Xác định phạm vi

```bash
git diff --name-only HEAD -- apps/api/
git diff --name-only --cached -- apps/api/
```

Phân loại file: controller / service / gateway / dto / guard / interceptor / filter / prisma schema / module.
Nếu không có file BE → "Không có thay đổi backend."

---

## Tầng 1 — Convention Checks

### TypeScript & Naming

- [ ] Không `any` (dùng `unknown` + narrow)
- [ ] Public method có type annotation; prefer `type` over `interface`
- [ ] File: service `camelCase.service.ts`, controller `*.controller.ts`, module `*.module.ts`
- [ ] Class `PascalCase`, method/var `camelCase`, constant `UPPER_SNAKE`

### Enums

- [ ] Không string literal union làm enum ảo
- [ ] Business enum → re-export Prisma enum + `@IsEnum(Enum)` trong DTO
- [ ] Mọi external API value có enum trong openapi.yaml

### Logging

- [ ] Không `console.*` — dùng `new Logger(ClassName.name)` từ `@nestjs/common`
- [ ] `logger.error` có truyền stack: `err instanceof Error ? err.stack : err`

### DTO

- [ ] Mỗi field có `class-validator` decorator (`@IsString`, `@IsEnum`, `@MinLength`, ...)
- [ ] Mỗi field có `@ApiProperty({ description, example })` cho Swagger auto-gen
- [ ] Separate DTO cho create / update / response — không reuse Prisma entity
- [ ] `@Transform()` cho normalize (trim, lowercase) khi cần

### Module structure

- [ ] Feature folder đủ: `*.module.ts` + `*.controller.ts` + `*.service.ts` + `dto/`
- [ ] Module khai báo đúng imports/providers/controllers/exports
- [ ] Import dùng alias `@/*`, không relative dài

---

## Tầng 2 — Deep Review

### NestJS Architecture & DI

- [ ] Business logic ở **service**, controller chỉ orchestrate (mỏng)
- [ ] `PrismaService` inject qua constructor (singleton), không `new`
- [ ] Logger dùng `new Logger(ClassName.name)` per-instance, không inject DI cho service đơn giản
- [ ] Guard áp đúng tầng: global `JwtAuthGuard` + `@Public()` opt-out; `@Roles('ADMIN')` cho admin
- [ ] Custom decorator dùng đúng: `@CurrentUser()`, `@AnonymousId()`
- [ ] Response wrap qua `TransformInterceptor` (`{ data, meta }`) — không tự build trong controller
- [ ] Exception throw typed (`NotFoundException`, `ForbiddenException`, ...) — filter format ở `HttpExceptionFilter`

### Prisma Correctness (quan trọng — dễ sai)

- [ ] `select: { ... }` chỉ field cần — không over-fetch
- [ ] Tránh N+1: dùng `include`/`select` nested thay vì loop query
- [ ] Mutate nhiều bảng → `$transaction([...])` đảm bảo atomicity
- [ ] Query song song độc lập → `Promise.all`, không await tuần tự
- [ ] Filter/sort field có `@@index` trong schema
- [ ] **KHÔNG** `$queryRawUnsafe` với user input (SQL injection); `$queryRaw` tagged template OK
- [ ] Async/await mọi nơi — không `.then()` chain

### Security Checklist (khi touch endpoint/auth/data)

- [ ] Password bcrypt cost ≥ 10
- [ ] Input validate qua DTO + `ValidationPipe forbidNonWhitelisted: true`
- [ ] Mọi `/admin/*` có `@Roles('ADMIN')`
- [ ] Ownership check ở service trước mutate (tránh IDOR) — không trust client ID
- [ ] Cookie: `httpOnly`, `secure` (prod), `sameSite: strict/lax`
- [ ] CORS allow chỉ `CORS_ORIGIN`, không `*`
- [ ] Rate limit endpoint nhạy cảm (`@Throttle`): register 5/min, login 10/min
- [ ] Không hardcode secret/JWT key

### Performance (khi touch query/endpoint)

- [ ] API target < 500ms p95
- [ ] Connection pool Neon default 10
- [ ] Response compression bật (`compression()`)
- [ ] WebSocket payload < 1KB/event — large thì lazy fetch by ID

### WebSocket Gateway (nếu touch)

- [ ] `@WebSocketGateway({ cors: { origin, credentials: true } })`
- [ ] Cookie auth decode JWT từ `socket.handshake.headers.cookie`
- [ ] Room management: `room:join` → `socket.join(room)`
- [ ] `@SubscribeMessage('event:name')` đúng naming convention

### Contract Sync

- [ ] Touch controller/DTO → chạy `pnpm openapi:sync` (update openapi.yaml + api.generated.ts)
- [ ] Endpoint mới → update `apps/web/src/types/api.ts` thủ công (tới khi T-302 cutover)
- [ ] Controller có `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody`

---

## Bước cuối: Output Report

```
## 🔧 Backend Deep Review

**Files**: [N] — [controller/service/dto/prisma/...]

### ✅ Passed
- [convention + deep checks passed, ngắn gọn]

### ❌ Violations
| # | Tầng | Rule | File:Line | Detail | Cách fix |
|---|------|------|-----------|--------|---------|
| 1 | Deep/Prisma | N+1 query | posts.service.ts:42 | Loop findUnique trong map | Dùng findMany + include |
| 2 | Convention | Thiếu @ApiProperty | dto/create-post.dto.ts:10 | Field mood chưa có | Thêm @ApiProperty({ enum: Mood }) |

### 🔒 Security
- [pass/fail list — chỉ khi touch endpoint/auth]

### ⚡ Performance
- [pass/fail list — chỉ khi touch query]

### 📌 Action items trước commit
1. Fix [violation]: ...
2. Chạy `pnpm openapi:sync` (nếu touch DTO/controller)
```

Nếu pass: `✅ Backend review passed — N files, convention + deep checks OK. Safe to commit.`

---

## Tham chiếu

- `docs/CODING_CONVENTION.md` — Universal (6-227) + Backend (339-495) + Security (499-518) + Performance (520-533)
- `docs/ARCHITECTURE.md` — ADR + Security policy
- `docs/API_CONTRACT.md` — error catalog + response format
