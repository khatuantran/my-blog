# Coding Convention

> Rules cố định cho code style + naming + lint + security + performance + git.
> Áp dụng cho monorepo: chia 3 section — **Universal** (cả FE + BE) + **Frontend** (apps/web) + **Backend** (apps/api).

## Universal (cả FE + BE)

### TypeScript

- `strict: true` trong tsconfig (`strictNullChecks`, `noImplicitAny`, ...)
- **KHÔNG dùng `any`** — dùng `unknown` rồi narrow, hoặc define proper type
- Type cho mọi public function (export)
- Prefer `type` hơn `interface`, trừ khi cần extend / implements
- Avoid type assertion `as X` trừ khi thực sự cần (vd: narrow union sau check); dùng type guards trước

### Naming

- File component: `PascalCase.tsx` (vd: `PostCard.tsx`)
- File utility/hook/service: `camelCase.ts` (vd: `useDebounce.ts`, `apiClient.ts`)
- File test: **luôn nằm trong `tests/` ngang cấp với `src/`**, KHÔNG co-located trong `src/`. Mirror cấu trúc src để dễ tìm. FE: `*.test.ts(x)`. BE: `*.spec.ts` (unit) hoặc `*.e2e-spec.ts` (e2e). Setup/helpers/factories đặt trong `tests/` (vd: `tests/setup.ts`, `tests/_helpers/factory.ts`). Xem [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- File route (FE): kebab-case folder hoặc PascalCase page (`pages/PostDetail.tsx`)
- Component name: `PascalCase`
- Variable/function: `camelCase`
- Constant: `UPPER_SNAKE_CASE`
- Type/Interface: `PascalCase`
- Enum: `PascalCase` (values UPPER_SNAKE)
- DB (Prisma model): `PascalCase` (singular)

### Enums (TỐI QUAN TRỌNG)

**KHÔNG dùng string literal union làm enum ảo.** Mọi tập giá trị enumerated PHẢI define enum tường minh để:

- Reuse across FE + BE + DB (1 source of truth)
- Refactor an toàn (rename = compile error mọi reference)
- Auto-complete + exhaustiveness check (`switch` không match → TS error)
- Serialize/deserialize nhất quán (Prisma ↔ DTO ↔ API JSON ↔ FE)

#### ❌ KHÔNG

```ts
// String literal union — fragile, không reuse được
type Mood = 'HAPPY' | 'SAD' | 'ANGRY';
function getMood(m: 'HAPPY' | 'SAD' | 'ANGRY') { /* ... */ }

// Hardcode string trong DTO
@IsIn(['ADMIN', 'USER'])
role: string;
```

#### ✅ ĐÚNG

**DB layer** — Prisma enum (single source):

```prisma
enum Mood { HAPPY EXCITED THOUGHTFUL CALM SAD GRATEFUL ANGRY }

model Post {
  mood Mood
}
```

**BE DTO** — re-export Prisma enum + `@IsEnum`:

```ts
import { Mood } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ enum: Mood })
  @IsEnum(Mood)
  mood!: Mood;
}
```

**FE — business domain enum** (mirror từ openapi-typescript):

```ts
import { z } from 'zod';
import type { Mood } from '@/types/api'; // gen từ openapi.yaml

const schema = z.object({ mood: z.nativeEnum(Mood) });
```

**FE-only state enum** (UI state không có ở BE) — `as const` object:

```ts
export const EditorMode = {
  EDIT: 'EDIT',
  PREVIEW: 'PREVIEW',
} as const;
export type EditorMode = (typeof EditorMode)[keyof typeof EditorMode];
```

#### Quy tắc cụ thể

- **Business domain enum** (Role, Mood, FileType, CommentStatus, ...): Prisma `enum` là single source
- **FE-only state enum** (vd: UI mode `'EDIT' | 'VIEW'`): dùng `as const` object + type derive, KHÔNG raw union
- **Internal-only TS literal** (≤ 2 giá trị, kèm với function param, không export): `'asc' | 'desc'` chấp nhận được
- **External API contract**: PHẢI có enum định nghĩa (mirror trong openapi.yaml `enum:`)

#### Cross-references

- DB enums: [DATA_MODEL.md > Enums](./DATA_MODEL.md) (Role, Mood, FileType, CommentStatus)
- Design enum-color mapping: [DESIGN_SYSTEM.md > Mood Color Map](./DESIGN_SYSTEM.md)
- API enum: phải xuất hiện trong `docs/contracts/openapi.yaml` `components.schemas.<Name>.enum`

### Logging (TỐI QUAN TRỌNG)

**KHÔNG dùng `console.log` / `console.error` / `console.warn` trong production code.** Lý do:

- Không có log level filter (debug/info/warn/error)
- Không có metadata (timestamp, scope, request ID)
- Không integrate được với Sentry / observability stack
- Bị strip bởi production bundle config khác nhau (FE Vite có thể keep, không nhất quán)

#### Backend (`apps/api`)

Dùng NestJS built-in `Logger`:

```ts
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  async create(dto: CreatePostDto) {
    this.logger.log(`Creating post by user ${dto.authorId}`);
    try {
      // ...
    } catch (err) {
      this.logger.error('Failed to create post', err instanceof Error ? err.stack : err);
      throw err;
    }
  }
}
```

- `logger.log` (info) | `logger.warn` | `logger.error` | `logger.debug` | `logger.verbose`
- Bootstrap (`main.ts`): `const logger = new Logger('Bootstrap'); logger.log('Server started')`
- KHÔNG inject `LoggerService` qua DI cho service đơn giản (overhead) — dùng `new Logger(ClassName.name)` per instance

#### Frontend (`apps/web`)

Dùng `loglevel` (lightweight, level-filterable, browser+node):

```ts
// src/lib/logger.ts
import log from 'loglevel';
log.setDefaultLevel(import.meta.env.DEV ? 'debug' : 'warn');
export const logger = log;
```

Usage:

```ts
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId });
logger.error('Failed to fetch posts', err);
```

- Dev: full log (debug+)
- Prod: chỉ warn + error
- Sentry integration: gắn vào `logger.methodFactory` để forward error level (M14)

#### Exception: bootstrap pre-logger

Code chạy TRƯỚC khi logger init (vd: env validate fail) được phép `throw new Error(message)` — error message tự đủ thông tin, không cần `console.error` extra.

#### Lint enforcement (defer T-006)

ESLint rule `no-console` enable cho `src/` (allow trong `test/`).

### Imports

Thứ tự (newline separator giữa các nhóm):

1. External (`react`, `nestjs`, `prisma`, ...)
2. Internal absolute (`@/components/...`, `@/lib/...`)
3. Relative (`./`, `../`)
4. Type-only imports cuối: `import type { ... } from '...'`

Path alias: `@/*` → `src/*` cho mỗi app (cả `apps/web` và `apps/api`)

### Comments

- Default: KHÔNG comment khi code self-explanatory
- Comment khi:
  - WHY non-obvious (hidden constraint, workaround, subtle invariant)
  - Surprising behavior cho future reader
- KHÔNG comment WHAT (well-named identifier đã đủ)
- KHÔNG reference task/issue trong comment (đặt ở commit/PR description)
- JSDoc cho public API/library function (vd: trong `packages/shared-types`)
- TODO format: `// TODO(name): description` — chỉ dùng cho temp, plan removal

### Error handling

- Don't add error handling cho case không xảy ra (vd: trust internal API contracts)
- Chỉ validate ở **system boundaries**: HTTP input (BE controller), user form (FE form), external API response
- Throw typed exceptions; catch ở boundary; KHÔNG silent catch

### Lint & Format

- **ESLint** với plugins:
  - `@typescript-eslint`
  - `eslint-plugin-react` (FE) / `eslint-plugin-react-hooks`
  - `eslint-plugin-import` (order)
  - `eslint-plugin-jsx-a11y` (FE)
- **Prettier:** `semi: true, singleQuote: true, printWidth: 100, trailingComma: 'all'`
- **Pre-commit:** husky + lint-staged → run `eslint --fix` + `prettier --write` trên staged files
- **CI:** `pnpm lint` + `pnpm format:check` PHẢI pass

### Git

- Conventional Commits format (xem [CLAUDE.md > Commit Convention](../CLAUDE.md))
- Branch: trunk-based (commit `main` trực tiếp); exception: F4 Hotfix / Experiment / WIP qua đêm

---

## Frontend Conventions (`apps/web`)

### Stack reminder

Vite + React 19 + React Router v7 + TanStack Query + Zustand + Tailwind + shadcn/ui.

### Component

- **Function-based** (no class component)
- **< 200 dòng** per file — tách nếu lớn hơn
- Props inline type cho component nhỏ: `function Foo({ name }: { name: string })`
- Named export prefer over default export (consistent grep)
- Server-side concerns? KHÔNG — đây là pure SPA, mọi data fetch qua TanStack Query

### Hooks

- File: `useCamelCase.ts` (vd: `usePosts.ts`, `useAuth.ts`)
- Naming: bắt đầu bằng `use`
- Custom hooks return `[value, actions]` tuple HOẶC object — consistent per project (default: object cho > 2 fields)

### TanStack Query

- **Query key convention:** array với hierarchical key
  - `['posts']` — list all
  - `['posts', { mood, tag, page }]` — list filtered
  - `['post', postId]` — single
  - `['comments', postId]` — list comments per post
  - `['admin', 'stats']` — admin stats
- **`staleTime` strategy:**
  - List endpoints (feed, comments): 30s
  - Static-ish (tags): 5min
  - User-specific (saved, me): 1min
- **Mutation invalidation:** invalidate specific keys, KHÔNG dùng `invalidateQueries()` rộng
- **Optimistic update:** dùng cho like, save, comment delete (UX critical)

### State management

- **Server state:** TanStack Query (mọi data từ BE)
- **Form state:** react-hook-form + zod resolver
- **Client UI state:**
  - Local component: `useState`
  - Shared 2+ components: Zustand store
  - Global: Zustand store ở `src/stores/`
- **Zustand pattern:**
  - 1 store per domain (vd: `useAuthStore`, `useUIStore`)
  - Selector pattern: `const user = useAuthStore(s => s.user)`
  - Avoid bloated single store

### Routing (React Router v7)

- Routes config ở `src/routes.tsx` (centralized)
- Lazy load per page: `lazy: () => import('./pages/FeedPage')`
- Use `<Outlet>` cho layout wrapping
- Navigate: `useNavigate()` hook hoặc `<Link>`
- Protected routes: `<ProtectedRoute requireAdmin>` HOC wrapping

### File structure

```
apps/web/src/
├── pages/                  Top-level page components (1 per route)
├── components/
│   ├── ui/                 shadcn primitives (Button, Card, Input, ...)
│   ├── layout/             TopBar, StatusBar, Sidebar, RightPanel
│   ├── post/               PostCard, PostContent, ImageGrid, ImageCarousel, ...
│   ├── shared/             MoodBadge, TagPill, Avatar, Sparkline, AsciiBar
│   ├── command-palette/    CommandPalette overlay
│   └── admin/              StatCard, MoodBar, UsersTable, ...
├── hooks/                  Custom hooks (useAuth, usePosts, useWebSocket, ...)
├── services/
│   ├── api/                HTTP client (typed via openapi-typescript)
│   ├── ws/                 Socket.io client + event handlers
│   └── storage.ts          cookie + localStorage helpers
├── stores/                 Zustand stores (slices per domain)
├── lib/
│   ├── validators.ts       Zod schemas
│   └── utils.ts            cn helper, formatters
├── types/                  Re-export từ generated openapi types
├── styles/                 globals.css + design tokens CSS variables
├── routes.tsx              React Router config
└── main.tsx                Entry point
```

### Import alias

`@/*` → `apps/web/src/*`

### Form

- react-hook-form + zod resolver: `useForm<T>({ resolver: zodResolver(schema) })`
- Schema ở `src/lib/validators.ts` — reuse cho FE form + có thể share với BE qua `packages/shared-types`
- Error display: inline below input, design system pattern (red border + helper text)

### CSS

- **Tailwind utility** cho mọi styling
- **CSS variables** cho design tokens (xem DESIGN_SYSTEM.md): inject vào `:root` trong `styles/globals.css`
- Custom CSS file: chỉ dùng cho keyframes phức tạp hoặc complex selector (scrollbar, body::after)
- **KHÔNG hardcode color/spacing** trong code — luôn dùng token (`var(--cyan)` hoặc Tailwind class với token-based config)
- shadcn/ui components: customize qua CSS variables override

### Code split

- Per-route lazy load (xem Routing)
- Heavy library (vd: Markdown renderer, syntax highlight): dynamic import + Suspense
- `React.lazy()` for component-level split khi cần

---

## Backend Conventions (`apps/api`)

### Stack reminder

NestJS + Passport JWT + Prisma + Socket.io + class-validator + Swagger.

### Module structure

Mỗi feature = 1 NestJS module folder:

```
src/<feature>/
├── <feature>.module.ts       module definition (imports, providers, controllers, exports)
├── <feature>.controller.ts   HTTP endpoints
├── <feature>.service.ts      business logic
├── <feature>.gateway.ts      WebSocket gateway (nếu có)
├── dto/                      Request/Response DTOs với class-validator decorators
│   ├── create-<x>.dto.ts
│   └── update-<x>.dto.ts
├── entities/                 Domain entity (optional, nếu khác Prisma model)
└── <feature>.service.spec.ts unit test
```

### DTOs

- **class-validator** decorators trên mỗi field: `@IsString()`, `@IsEmail()`, `@IsEnum()`, `@MinLength()`, ...
- **class-transformer** cho `@Transform()` (vd: trim string, lowercase tag)
- **Swagger:** `@ApiProperty({ description, example, required })` cho mỗi field — feed vào OpenAPI auto-gen
- Separate DTOs cho create / update / response — KHÔNG reuse entity

### Validation Pipe

Global trong `main.ts`:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // strip unknown fields
    forbidNonWhitelisted: true, // throw nếu có field lạ
    transform: true, // auto-convert types (string → number, etc.)
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

### Guards

- `JwtAuthGuard` — verify access_token cookie, attach `req.user`
- `JwtRefreshGuard` — verify refresh_token (chỉ cho `/auth/refresh`)
- `RolesGuard` — check `user.role` against `@Roles('ADMIN')` decorator
- `OptionalAuthGuard` — không bắt buộc auth nhưng attach user nếu có (cho endpoint anonymous OK)
- Apply globally `JwtAuthGuard` + `RolesGuard` + opt-in `@Public()` decorator để skip

### Interceptors

- `LoggingInterceptor` — log request/response time + status
- `TransformInterceptor` — wrap response `{ data, meta }` format (xem API_CONTRACT.md)
- Áp dụng global trong `main.ts`

### Filters

- `HttpExceptionFilter` — catch all exception, format `{ error: { code, message, details? } }` per API_CONTRACT.md
- Apply global

### Decorators (custom)

- `@CurrentUser()` — extract `req.user` (sau JwtAuthGuard)
- `@Public()` — mark endpoint không cần auth
- `@Roles('ADMIN', 'USER')` — RBAC
- `@AnonymousId()` — extract anonymous cookie ID

### Prisma

- Inject `PrismaService` qua `nestjs-prisma` package
- **Singleton** — 1 instance global, lifecycle managed
- **Transaction** khi mutate nhiều bảng (vd: create post + images + files + tags):
  ```ts
  this.prisma.$transaction([
    this.prisma.post.create({ data: ... }),
    this.prisma.image.createMany({ data: ... }),
    ...
  ])
  ```
- **Select chỉ field cần** — `select: { id: true, content: true }` để giảm payload size
- KHÔNG dùng `$queryRawUnsafe` với user input (SQL injection risk); `$queryRaw` với tagged template OK

### Swagger / OpenAPI

- Bootstrap trong `main.ts`:
  ```ts
  const config = new DocumentBuilder()
    .setTitle('MyBlog API')
    .setVersion('0.2.0-alpha')
    .addCookieAuth('access_token')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, doc); // dev only
  ```
- **Decorator usage required** cho mỗi endpoint:
  - `@ApiTags('posts')` — group
  - `@ApiOperation({ summary: '...' })` — endpoint summary
  - `@ApiResponse({ status: 200, type: PostDto })` — response shape
  - `@ApiBody({ type: CreatePostDto })` — request body
- **CI step:** generate `docs/contracts/openapi.yaml` from running app dump
  ```bash
  pnpm --filter api openapi:generate
  ```

### WebSocket Gateway

- `@WebSocketGateway({ cors: { origin: env.CORS_ORIGIN, credentials: true } })`
- Lifecycle hooks: `handleConnection`, `handleDisconnect`
- `@SubscribeMessage('event:name')` cho client → server
- `server.to(room).emit('event', payload)` cho server → client
- Cookie auth: dùng `socket.handshake.headers.cookie` để decode JWT (giống HTTP)
- Room management: client emit `room:join` → server `socket.join(room)`; on disconnect `socket.leaveAll()` auto

### Rate limiting

- `@nestjs/throttler` global module
- Override per route: `@Throttle({ default: { limit: 5, ttl: 60000 } })`
- Key generator: include IP + anonymousId cho anonymous endpoints

### File structure

```
apps/api/src/
├── auth/
├── users/
├── posts/
├── comments/
├── likes/
├── files/
├── tags/
├── admin/
├── realtime/             RealtimeGateway
├── prisma/               PrismaModule + PrismaService
├── common/
│   ├── filters/          HttpExceptionFilter
│   ├── interceptors/     LoggingInterceptor, TransformInterceptor
│   ├── pipes/            (optional ZodValidationPipe)
│   ├── decorators/       @CurrentUser, @Public, @Roles, @AnonymousId
│   ├── guards/           Jwt + Roles + OptionalAuth
│   └── middleware/       AnonymousIdMiddleware (issue cookie)
├── config/               env validation (@nestjs/config + Joi/Zod)
└── main.ts               bootstrap (Swagger, CORS, global pipes/filters/interceptors)
```

### Import alias

`@/*` → `apps/api/src/*`

### Async

- **Async/await mọi nơi**, không callback / `.then` chain
- Promise.all cho parallel queries không phụ thuộc

---

## Security Checklist

Kiểm trước khi merge mỗi feature/fix có touch endpoint hoặc data.

- [ ] **Password hash** bằng bcrypt cost ≥ 10, KHÔNG plain
- [ ] **JWT secret** strong (`openssl rand -base64 32`), separate cho access vs refresh
- [ ] **Validate input:**
  - BE: DTOs với class-validator decorators, `ValidationPipe forbidNonWhitelisted: true`
  - FE: Zod schemas trong form + boundary
- [ ] **CSRF:** httpOnly cookie + `SameSite=Strict` (prod) — KHÔNG disable
- [ ] **Rate limit:**
  - Default 60 req/min/IP
  - Register: 5/min, Login: 10/min, Comment: 10/min, Like: 30/min
- [ ] **SQL injection:** Prisma parameterized query; KHÔNG `$queryRawUnsafe` với user input
- [ ] **XSS:** sanitize user-generated content (comment, anonymousName) bằng DOMPurify FE; CSP header `script-src 'self'`
- [ ] **Auth check:** mọi admin endpoint có `@Roles('ADMIN')`; mọi `/admin/*` route FE check session
- [ ] **IDOR:** Service layer check ownership (vd: chỉ admin xóa post của mình); KHÔNG trust client-sent IDs
- [ ] **Secrets:** chỉ ở `apps/api/.env` / `apps/web/.env.local` (gitignored) hoặc Vercel/Fly secrets — KHÔNG hardcode
- [ ] **Upload:** validate MIME + size limit ở Cloudinary upload preset + BE re-check
- [ ] **CORS:** allow chỉ FE origin từ `CORS_ORIGIN` env, KHÔNG `*`
- [ ] **Cookie:** `httpOnly`, `Secure` (prod), `SameSite=Strict` (prod) / `Lax` (dev)

## Performance Checklist

- [ ] **API endpoint < 500ms p95** — đo qua Sentry transactions hoặc `console.time`
- [ ] **DB query có index** nếu filter/sort (check explain plan); add `@@index` trong Prisma schema khi cần
- [ ] **DB query select chỉ field cần** — `select: { ... }` giảm payload
- [ ] **Avoid N+1 query** — dùng Prisma `include` hoặc `select` nested
- [ ] **Avoid waterfall** — `Promise.all` cho query song song
- [ ] **FE: lazy load per route** (React.lazy + Suspense)
- [ ] **FE: image lazy load** — `<img loading="lazy">` hoặc Cloudinary URL với `w_auto,f_auto`
- [ ] **FE: TanStack Query `staleTime`** config phù hợp (xem Frontend section)
- [ ] **BE: response compression** — NestJS `app.use(compression())`
- [ ] **BE: Prisma connection pool** — default 10 cho Neon pooled URL
- [ ] **Lighthouse score > 85** (perf + a11y) cho page public — chạy weekly với `unlighthouse`
- [ ] **WebSocket message size** — keep < 1KB per event; large payload thì lazy fetch by ID

## Test (high-level — chi tiết ở TESTING_STRATEGY.md)

- File test cùng folder source: `<name>.test.ts(x)` (FE Vitest) hoặc `<name>.spec.ts` (BE Jest)
- Mỗi feature mới có ≥ 1 unit test (xem [CLAUDE.md > Testing Rules](../CLAUDE.md))
- Bug fix có regression test BẮT BUỘC

## Test ID convention (cho E2E selector)

- Element cần E2E test target: `data-testid="<kebab-case-id>"`
- Vd: `data-testid="post-card"`, `data-testid="like-button"`, `data-testid="cmd-palette-input"`
- KHÔNG dùng CSS class hoặc ARIA cho E2E selector (volatile)

---

## Templates

### Template thêm rule mới

````markdown
## <Section>

- **Rule:** ...
- **Why:** ...
- **Example:**
  ```ts
  // Good
  ...
  // Bad
  ...
  ```
````

````

### Template Security Checklist item

```markdown
- [ ] **<Concern>:** <specific check + how to verify>
````

### Template Performance Checklist item

```markdown
- [ ] **<Metric>:** <threshold + measurement tool>
```
