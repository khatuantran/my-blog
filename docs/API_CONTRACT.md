# API Contract

> **Narrative + WebSocket events catalog**. Full REST spec với schemas + examples: [`contracts/openapi.yaml`](./contracts/openapi.yaml) (auto-generated từ NestJS).
> Implementation: [`apps/api`](../apps/api). Endpoint mapping FR: [REQUIREMENTS.md > Traceability](./REQUIREMENTS.md).

## Base URLs

| Env        | URL                                                    |
| ---------- | ------------------------------------------------------ |
| Local      | `http://localhost:3001`                                |
| Production | `https://myblog-api.fly.dev` (TBD — adjust khi deploy) |

## Auth

- **Mechanism:** JWT trong httpOnly cookie (xem [ARCHITECTURE.md > ADR-006](./ARCHITECTURE.md))
- **Access token:** cookie `access_token`, TTL 15min
- **Refresh token:** cookie `refresh_token`, TTL 30d, rotation
- **Send credentials:** FE `fetch(url, { credentials: 'include' })`
- **CORS:** BE allow origin từ `CORS_ORIGIN` env (FE Vercel + localhost:5173)

## Response Format

### Success

```json
{
  "data": { ... },
  "meta": { ... }   // optional, cho pagination/extra
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable VN/EN message",
    "details": { ... }   // optional (field errors, stack trace dev mode)
  }
}
```

## HTTP Status Codes

| Code | Use                                       |
| ---- | ----------------------------------------- |
| 200  | OK — GET/PATCH success                    |
| 201  | Created — POST resource                   |
| 204  | No Content — DELETE / toggle off          |
| 400  | Bad Request — validation error            |
| 401  | Unauthorized — missing/invalid token      |
| 403  | Forbidden — auth ok nhưng không có quyền  |
| 404  | Not Found                                 |
| 409  | Conflict — unique constraint, race        |
| 422  | Unprocessable Entity — business rule fail |
| 429  | Too Many Requests — rate limited          |
| 500  | Internal Server Error                     |

## Error Code Catalog

| Code                    | HTTP | Use                                                     |
| ----------------------- | ---- | ------------------------------------------------------- |
| `VALIDATION_ERROR`      | 400  | Input format sai (Zod/class-validator fail)             |
| `AUTH_REQUIRED`         | 401  | Endpoint cần login, không có token                      |
| `AUTH_INVALID`          | 401  | Token invalid/expired                                   |
| `AUTH_REFRESH_FAILED`   | 401  | Refresh token invalid/revoked                           |
| `ACCOUNT_BANNED`        | 403  | User role = BANNED                                      |
| `FORBIDDEN`             | 403  | Không có quyền (vd: non-admin call admin endpoint)      |
| `NOT_FOUND`             | 404  | Resource không tồn tại                                  |
| `DUPLICATE_USERNAME`    | 409  | Register username trùng                                 |
| `DUPLICATE_LIKE`        | 409  | Race condition like (rare, có unique constraint handle) |
| `FILE_TOO_LARGE`        | 422  | Upload file > 20MB                                      |
| `FILE_TYPE_NOT_ALLOWED` | 422  | Upload file extension không cho phép                    |
| `POST_LIMIT_EXCEEDED`   | 422  | Vượt 10 ảnh / 20 file per post                          |
| `MODERATION_PENDING`    | 422  | Comment chưa được approve, không xóa được               |
| `RATE_LIMITED`          | 429  | Vượt rate limit                                         |
| `INTERNAL_ERROR`        | 500  | Server error (chi tiết log Sentry)                      |

## Rate Limiting

Default: **100 req / 60s / IP** global (memory storage, single-instance — Fly.io free tier).
Per-endpoint override **10 req / 60s / IP** cho sensitive paths (NFR-04):

- POST `/auth/register`, POST `/auth/login` (anti-bruteforce)
- POST `/posts/:id/comments`
- POST `/posts/:id/like`, POST `/comments/:id/like`

Exceed → 429 `RATE_LIMITED`. Test env (`NODE_ENV=test`) skip throttle (existing e2e tests không bị fail vì burst).

## Endpoint Groups

> Endpoints chi tiết (path, params, body, response schema, examples) ở [`contracts/openapi.yaml`](./contracts/openapi.yaml). Bảng dưới chỉ summary + auth + linked FR.

### Auth (`/auth/*`)

| Method | Path                    | Auth           | FR      | Notes                                                                                                                                                                                                                                      |
| ------ | ----------------------- | -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/auth/register`        | public         | FR-01.1 | Body: `{ username, password, email? }`                                                                                                                                                                                                     |
| POST   | `/auth/login`           | public         | FR-01.2 | Set access + refresh cookies                                                                                                                                                                                                               |
| POST   | `/auth/refresh`         | refresh cookie | FR-01.2 | Rotation — issue new pair                                                                                                                                                                                                                  |
| POST   | `/auth/logout`          | access cookie  | FR-01   | Clear cookies + revoke refresh in DB                                                                                                                                                                                                       |
| GET    | `/auth/me`              | access cookie  | FR-01   | Current user info                                                                                                                                                                                                                          |
| POST   | `/auth/change-password` | user           | FR-11.3 | Body: `{ currentPassword, newPassword }`. Verify current bcrypt → update + revoke ALL refresh tokens TRỪ current. Response 200 `{ ok: true }`. 401 `INVALID_CREDENTIALS` nếu current sai. 400 nếu newPassword < 8. Throttle 5 req/min/user |

### Users (`/users/*`)

| Method | Path                           | Auth   | FR             | Notes                                                                                                                                                                                                                                                                                                         |
| ------ | ------------------------------ | ------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/users/me`                    | user   | FR-01          | Alias `/auth/me`                                                                                                                                                                                                                                                                                              |
| PATCH  | `/users/me`                    | user   | FR-01, FR-11.3 | Update profile. Body: `{ avatarUrl?, email?, title? (max 80), bio? (max 500), skills? (max 20 items, each {name max 32, color hex regex /^#[0-9A-Fa-f]{6}$/}) }`. **Reject** `username` change. Response 200 User. 400 validation                                                                             |
| GET    | `/users/by-username/:username` | public | FR-11.1        | Public lookup by username. Response 200 `{ id, username, role, avatarUrl, title, bio, skills: {name,color}[], createdAt }`. 404 `USER_NOT_FOUND`                                                                                                                                                              |
| GET    | `/users/:id/stats`             | public | FR-11.4        | Profile stats aggregation. Response 200 `{ postsCount, likesReceived, commentsReceived, viewsTotal, streak, heatmap28d: [{date, count}], moodBreakdown: Record<Mood, number>, tagsUsed: [{name, color, count}] (top 8) }`. `streak`: distinct post-created days liên tiếp ngược tới ngày đầu break (UTC). 404 |

### Posts (`/posts/*`)

| Method | Path              | Auth   | FR      | Notes                                                                                      |
| ------ | ----------------- | ------ | ------- | ------------------------------------------------------------------------------------------ |
| GET    | `/posts`          | public | FR-04   | Query: `page`, `limit`, `mood`, `tag`, `sort: latest\|oldest\|likes` (default `latest`)    |
| GET    | `/posts/:id`      | public | FR-04   | Trả về full post (view tracking via POST /posts/:id/view — T-021)                          |
| POST   | `/posts`          | admin  | FR-02   | Body: `{ content, mood, tags[], images[], files[] }`                                       |
| PATCH  | `/posts/:id`      | admin  | FR-02   | Partial update                                                                             |
| DELETE | `/posts/:id`      | admin  | FR-02   | Cascade delete                                                                             |
| POST   | `/posts/:id/view` | public | FR-04.5 | Dedup 30min theo userId (auth) / anonymousId (anon). Response 200 `{ viewCount, counted }` |

### Comments (`/comments/*`, `/posts/:id/comments`)

| Method | Path                   | Auth                | FR      | Notes                                                                                                                                                                                                |
| ------ | ---------------------- | ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/posts/:id/comments`  | public (role-aware) | FR-03.2 | Public/USER trả APPROVED only. Admin trả tất cả status + field `status`. Sort `createdAt ASC`. Response `{ items: [...] }`. 404 nếu post không tồn tại                                               |
| POST   | `/posts/:id/comments`  | optional            | FR-03.2 | Body `{ content (1-2000), anonymousName? (1-50) }`. Auth → userId; anon → anonymousId cookie + optional anonymousName. Status default APPROVED. 201. 400 `VIEWER_ID_REQUIRED` nếu thiếu cả. 404 post |
| DELETE | `/comments/:id`        | admin               | FR-03.4 | Hard delete + cascade CommentLike. 204. 404                                                                                                                                                          |
| PATCH  | `/comments/:id/status` | admin               | FR-07.4 | Body `{ status: APPROVED \| REJECTED }` (PENDING không cho phép). Response 200 Comment. 404                                                                                                          |

### Likes (`/likes/*`)

| Method | Path                 | Auth     | FR      | Notes                                                                                                                                                             |
| ------ | -------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/posts/:id/like`    | optional | FR-03.1 | Toggle Like. Identity: userId (auth) hoặc anonymousId (anon cookie). Response 200 `{ liked, count }`. 404 post không tồn tại. 400 `VIEWER_ID_REQUIRED` thiếu cả 2 |
| POST   | `/comments/:id/like` | optional | FR-03.5 | Toggle CommentLike chỉ trên comment APPROVED. Response 200 `{ liked, count }`. 404 comment không tồn tại hoặc không APPROVED                                      |

### Saved (`/saved/*`)

| Method | Path              | Auth | FR      | Notes                                                                                                                                                                                  |
| ------ | ----------------- | ---- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/me/saved`       | user | FR-03.3 | Paginated saved posts (sort savedAt DESC). Query `page` (default 1), `limit` (default 10, max 50). Response 200 `{ items: [{ ...Post, savedAt }], total, page, limit }`. 401 no cookie |
| POST   | `/posts/:id/save` | user | FR-03.3 | Toggle bookmark. Response 200 `{ saved: boolean }`. 401 no cookie. 404 post                                                                                                            |

### Files (`/files/*`)

| Method | Path          | Auth  | FR               | Notes                                                                                                                                                    |
| ------ | ------------- | ----- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/files/sign` | admin | FR-02.3, FR-06.1 | Body: `{ resourceType: 'image'\|'raw', folder?, publicId? }`. Response 200 `{ signature, timestamp, apiKey, cloudName, folder, resourceType, publicId }` |
| DELETE | `/files/:id`  | admin | FR-06.4          | Hard delete DB + best-effort destroy Cloudinary asset. Response 204. `PostsService.remove`/`update` cũng auto-cascade Cloudinary                         |

### Tags (`/tags/*`)

| Method | Path        | Auth   | FR               | Notes                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | ----------- | ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/tags`     | public | FR-04.3, FR-10.1 | List tags với meta. Query: `limit` (default 20, max 100), `sort: name\|posts\|recent` (default `posts`), `q` (substring name filter), `withSparkline` (default true). Response 200 `{ items: [{ id, name, color, description, postCount, sparkline7d: number[7], createdAt }] }`. `sparkline7d` last 7 days post-create-with-tag count (oldest→newest). Empty `q` → toàn bộ tags |
| POST   | `/tags`     | admin  | FR-04.3, FR-10.4 | Body: `{ name, color?, description? (max 280) }`. Auto-assign color từ palette (cycle theo Tag count % 7) nếu thiếu. Response 201 `{ id, name, color, description }`. 409 `DUPLICATE_TAG`                                                                                                                                                                                        |
| PATCH  | `/tags/:id` | admin  | FR-04.3, FR-10.4 | Body: `{ name?, color?, description? }`. Rename/đổi color/description. Response 200 `{ id, name, color, description }`. 404, 409 nếu name trùng                                                                                                                                                                                                                                  |
| DELETE | `/tags/:id` | admin  | FR-04.3, FR-10.4 | Hard delete Tag + cascade PostTag rows. Query: `force` (default false). Response 204 nếu force=true HOẶC postCount=0. 409 `TAG_IN_USE` với body `{ code: 'TAG_IN_USE', postCount: N }` nếu force=false + postCount>0. 404                                                                                                                                                        |

### Admin (`/admin/*`)

| Method | Path              | Auth  | FR      | Notes                                                                                                                                                                                                                                                                          |
| ------ | ----------------- | ----- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/admin/stats`    | admin | FR-07.1 | 4 metrics aggregation. Response 200 `{ posts, likes, comments, views }` mỗi field `{ total: number, sparkline: number[12] (daily buckets oldest→newest), deltaToday: number (today vs yesterday) }`. 401 / 403                                                                 |
| GET    | `/admin/moods`    | admin | FR-07.2 | Mood distribution zero-filled. Response 200 `{ items: [{ mood, count }] }` — 7 entries (theo Mood enum), count=0 nếu không có post. 401 / 403                                                                                                                                  |
| GET    | `/admin/heatmap`  | admin | FR-09.3 | 28-day post creation heatmap. Response 200 `{ days: [{ date: 'YYYY-MM-DD', count }] }` — 28 entries (oldest→newest, zero-fill missing). 401 / 403                                                                                                                              |
| GET    | `/admin/comments` | admin | FR-07.4 | Cross-post comment moderation queue. Query: `status: PENDING\|APPROVED\|REJECTED` (default PENDING), `page` (default 1), `limit` (default 20, max 100). Response 200 `{ items: [{ ...Comment, post: { id, content: string (truncate 80) } }], total, page, limit }`. 401 / 403 |

> Endpoints khác (defer/overlap): `GET /users` + `POST /users/:id/ban` đã có ở UsersModule (T-014); `/admin/visitors` defer T-042 với AnonymousSession activity persist.

### Search (`/search`)

| Method | Path      | Auth   | FR    | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | --------- | ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/search` | public | FR-12 | Full-text search Postgres ILIKE multi-table. Query: `q` (string, empty cho default browse), `type: all\|posts\|files\|tags` (default `all`), `mood?: Mood`, `page` (default 1), `limit` (default 10, max 30). Response 200 `{ posts: { items: Post[], total, page, limit }, files: [{ id, name, postId, type }], tags: Tag[], stats: { totalPosts, withImages, withFiles, savedCount } }`. ILIKE pattern `%q%` trên `Post.content` + `Tag.name` (strip `#`) + `File.name`. `mood` filter chỉ apply `posts`. Authed user `posts.items[].saved` flag set. Empty `q` → posts/files/tags empty + stats toàn cục. Throttle 30 req/min/IP |

## Pagination

- Cursor không dùng (đơn giản hóa) — page-based
- Query: `?page=1&limit=10` (default `page=1, limit=10`, max `limit=50`)
- Response `data`: `{ items, total, page, limit }` (envelope `{ data: { ... } }` từ TransformInterceptor)
- FE tự tính `hasMore = page * limit < total` khi cần infinite scroll

## Versioning Policy

- Default version: **v1** (implicit, không prefix `/v1/`)
- Breaking changes: bump → prefix `/v2/` + maintain `/v1/` cho ≥ 6 tháng deprecation
- Non-breaking (add field, add endpoint): không bump
- Track breaking trong [CHANGELOG.md](./CHANGELOG.md) section `Changed` + tag commit `feat!:` hoặc `BREAKING CHANGE:` footer

## Rate Limiting

| Endpoint group               | Limit      | Key              |
| ---------------------------- | ---------- | ---------------- |
| Default                      | 60 req/min | IP               |
| `POST /auth/register`        | 5 req/min  | IP               |
| `POST /auth/login`           | 10 req/min | IP               |
| `POST /comments`             | 10 req/min | IP + anonymousId |
| `POST /*/like`               | 30 req/min | IP + anonymousId |
| `GET /search`                | 30 req/min | IP               |
| `POST /auth/change-password` | 5 req/min  | userId           |

Response khi rate limited: `429` với `Retry-After` header + error code `RATE_LIMITED`.

## WebSocket Events Catalog

> Connection: WSS qua Socket.io (`@nestjs/websockets` + `socket.io` client).
> URL: `wss://<API_BASE_URL>` với namespace mặc định `/`.
> Auth: cookie tự kèm trong handshake (httpOnly access_token).
> Rooms: `post:<postId>` (Post Detail viewers), `admin` (admin dashboard).

### Server → Client events

| Event             | Payload                               | Sent to                               | Trigger                         |
| ----------------- | ------------------------------------- | ------------------------------------- | ------------------------------- |
| `post:new`        | `{ post: Post }`                      | room `admin` + global feed (optional) | Admin tạo post mới              |
| `post:updated`    | `{ post: Post }`                      | room `admin`                          | Admin edit post                 |
| `post:deleted`    | `{ postId: string }`                  | room `admin`                          | Admin xóa post                  |
| `comment:new`     | `{ comment: Comment }`                | room `post:<id>` + room `admin`       | Comment tạo                     |
| `comment:status`  | `{ commentId, status }`               | room `post:<id>` + room `admin`       | Admin approve/reject            |
| `comment:deleted` | `{ commentId }`                       | room `post:<id>` + room `admin`       | Admin xóa                       |
| `like:new`        | `{ postId, count, byAnon?: boolean }` | room `post:<id>` + room `admin`       | Like post                       |
| `commentLike:new` | `{ commentId, count }`                | room `post:<id>`                      | Like comment                    |
| `save:new`        | `{ postId, userId }`                  | room `admin`                          | User save                       |
| `visitor:join`    | `{ session: AnonymousSession }`       | room `admin`                          | Anonymous mới connect           |
| `visitor:leave`   | `{ sessionId }`                       | room `admin`                          | Anonymous disconnect            |
| `visitor:update`  | `{ session: AnonymousSession }`       | room `admin`                          | Anonymous đổi page/action       |
| `online:count`    | `{ count: number }`                   | global broadcast                      | Online count change (debounced) |

### Client → Server events

| Event               | Payload                    | Auth     | Notes                                            |
| ------------------- | -------------------------- | -------- | ------------------------------------------------ |
| `room:join`         | `{ room: string }`         | optional | Client join room `post:<id>` khi vào Post Detail |
| `room:leave`        | `{ room: string }`         | optional | Khi rời page                                     |
| `visitor:heartbeat` | `{ lastPage, lastAction }` | optional | Anonymous update presence (mỗi 30s)              |

### Lifecycle hooks (NestJS Gateway)

- `handleConnection(client)` — issue/upgrade anonymousId cookie; emit `visitor:join` nếu anonymous
- `handleDisconnect(client)` — emit `visitor:leave` (debounced 5s grace period)
- `@SubscribeMessage('room:join')` — validate room access (vd: chỉ `admin` role mới join room `admin`)

### Reconnection strategy

- Client: Socket.io built-in auto-reconnect (exponential backoff, max 5 retries)
- Server: keep refresh token cookie active → handshake re-auth tự động
- Khi reconnect: client re-emit `room:join` cho rooms đang theo dõi

## OpenAPI Workflow

### Generate (sau khi BE scaffold)

```bash
# Generate OpenAPI YAML từ NestJS Swagger
pnpm --filter api openapi:generate
# → output: docs/contracts/openapi.yaml

# Generate TypeScript types cho FE
pnpm --filter web openapi:types
# → output: apps/web/src/types/api.ts
```

### Pre-commit hook

Trước khi commit task có touch BE controller hoặc DTO:

1. Run `pnpm --filter api openapi:generate`
2. Commit `docs/contracts/openapi.yaml` cùng commit code
3. Run `pnpm --filter web openapi:types`
4. Commit type changes

## Health & Metrics

- `GET /health` — readiness probe (200 OK + `{ status: 'ok', uptime, version }`)
- `GET /metrics` — Prometheus format (optional, sau khi setup observability)
- `GET /api/v1/swagger` — Swagger UI (dev only, disabled prod hoặc protected behind admin)

---

## Template thêm endpoint mới (cho narrative; full spec ở OpenAPI yaml)

```markdown
| <METHOD> | `/path` | <auth> | FR-XX | <1-line notes> |
```

## Template thêm WebSocket event mới

```markdown
| `event:name` | `{ payload schema }` | <target room/global> | <trigger description> |
```

## Template thêm error code mới

```markdown
| `ERROR_CODE` | HTTP_STATUS | When this is returned |
```
