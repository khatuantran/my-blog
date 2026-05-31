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
- **POST `/ai/generate` — 10 req/min/admin (NEW FR-17.2, M11.8 — cost protection cho AI provider)**

Exceed → 429 `RATE_LIMITED`. Test env (`NODE_ENV=test`) skip throttle (existing e2e tests không bị fail vì burst).

## Endpoint Groups

> Endpoints chi tiết (path, params, body, response schema, examples) ở [`contracts/openapi.yaml`](./contracts/openapi.yaml). Bảng dưới chỉ summary + auth + linked FR.

### Auth (`/auth/*`)

| Method | Path                    | Auth           | FR             | Notes                                                                                                                                                                                                                                                                                                                       |
| ------ | ----------------------- | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/register`        | public         | FR-01.1        | Body: `{ username, password, email? }`                                                                                                                                                                                                                                                                                      |
| POST   | `/auth/login`           | public         | FR-01.2        | Set access + refresh cookies                                                                                                                                                                                                                                                                                                |
| POST   | `/auth/refresh`         | refresh cookie | FR-01.2        | Rotation — issue new pair                                                                                                                                                                                                                                                                                                   |
| POST   | `/auth/logout`          | access cookie  | FR-01          | Clear cookies + revoke refresh in DB                                                                                                                                                                                                                                                                                        |
| GET    | `/auth/me`              | access cookie  | FR-01, FR-11.8 | Current user — `AuthUserDto` full shape: `{ id, username, email, role, avatarUrl, avatarPublicId, title, bio, skills, name, location, bornYear, github, website, createdAt }` (FR-11.8 expand — was 6 fields, giờ 15 cho FE consume profile data 1 query).                                                                  |
| POST   | `/auth/change-password` | user           | FR-11.3        | Body: `{ currentPassword, newPassword }`. Verify current bcrypt → update + revoke ALL refresh tokens TRỪ current. Response 200 `{ ok: true }`. 401 `INVALID_CREDENTIALS` nếu current sai. 400 nếu password < 5 chars (cả 2 field). Throttle 5 req/min/user. **Validation amended 2026-05-19 (T-303): min 5 thay vì min 8.** |

### Users (`/users/*`)

| Method | Path                           | Auth              | FR                               | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------ | ------------------------------ | ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/users/me`                    | user              | FR-01                            | Alias `/auth/me`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| PATCH  | `/users/:id`                   | user (self/admin) | FR-01, FR-11.3, FR-11.8, FR-11.9 | Update profile (`:id` = chính user đang login; admin sửa user khác). Body: `{ username? (3-32, /^[a-zA-Z0-9_-]+$/, unique), avatarUrl?, email?, title? (max 80), bio? (max 500), skills? (max 20 items, each {name max 32, color hex regex /^#[0-9A-Fa-f]{6}$/}), name? (max 80), location? (max 80), bornYear? (Int 1900-currentYear), github? (max 120), website? (max 200) }`. **FR-11.9: cho phép đổi `username`/handle** (unique check case-insensitive trừ self → 409 `DUPLICATE_USERNAME`; lưu ý đổi handle làm URL `/profile/:username` cũ 404). **FE TẠM DISABLE 2026-05-31** — Handle read-only ở EditProfileDrawer, FE không gửi `username`; BE vẫn accept (dormant). github/website KHÔNG strict IsUrl. Response 200 User. 400 validation |
| GET    | `/users/by-username/:username` | public            | FR-11.1                          | Public lookup by username. Response 200 `{ id, username, role, avatarUrl, title, bio, skills: {name,color}[], createdAt }`. 404 `USER_NOT_FOUND`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| GET    | `/users/:id/stats`             | public            | FR-11.4                          | Profile stats aggregation. Response 200 `{ postsCount, likesReceived, commentsReceived, viewsTotal, streak, heatmap28d: [{date, count}], moodBreakdown: Record<Mood, number>, tagsUsed: [{name, color, count}] (top 8) }`. `streak`: distinct post-created days liên tiếp ngược tới ngày đầu break (UTC). 404                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| GET    | `/users/:id/activity`          | user (self/admin) | FR-13.2                          | Activity timeline hybrid (own actions + actions on own posts). Guard: `JwtAuthGuard`. Query: `page` (default 1) + `limit` (default 20, max 50). Response 200 `{ items: [{ id, type: 'POST_CREATED'\|'COMMENT_CREATED'\|'LIKE_CREATED'\|'SAVE_CREATED', direction: 'OUTGOING'\|'INCOMING', actor: { id, username, avatarUrl }, target: { type: 'POST'\|'COMMENT', id, snippet: string\|null (truncate 80, null nếu deleted) }, createdAt }], total, page, limit }`. `direction`: OUTGOING nếu `actor.id === :id`, INCOMING nếu `targetOwnerId === :id && actor.id !== :id`. Query SQL: `WHERE actorId = :id OR (targetOwnerId = :id AND actorId != :id)` order createdAt DESC. Errors: 401 anonymous / 403 other non-admin / 404 user not exists       |
| POST   | `/users/me/avatar/sign`        | user              | FR-11.7                          | Return Cloudinary signed upload params cho folder `avatars/` (reuse FilesModule sign pattern T-022 nhưng folder cố định + uploadPreset transform `c_fill,g_face,w_400,h_400`). Body: `{}` (không có). Response 200 `{ signature, timestamp, apiKey, cloudName, folder: 'avatars', publicId: <userId-{timestamp}>, transformation: 'c_fill,g_face,w_400,h_400' }`. Errors: 401 anon. Throttle: 10/min/user (anti-abuse).                                                                                                                                                                                                                                                                                                                               |
| PATCH  | `/users/me/avatar`             | user              | FR-11.7                          | Save avatar sau Cloudinary upload success. Body: `{ url: string (Cloudinary secure_url), publicId: string }`. BE validate publicId prefix bắt đầu bằng `avatars/<userId>-` để chống cross-user PII injection. Trước khi save: nếu `user.avatarPublicId` cũ tồn tại → `cloudinary.destroy(oldPublicId)` best-effort try-catch (không throw nếu Cloudinary lỗi, chỉ log warn). Sau đó update `User { avatarUrl: url, avatarPublicId: publicId }`. Response 200 `{ avatarUrl, avatarPublicId }`. Errors: 401 anon / 400 publicId không prefix đúng / 400 url không match Cloudinary domain regex                                                                                                                                                         |
| GET    | `/users`                       | admin             | T-014                            | List users (admin). Query `page=1&limit=10` (max 50). Response 200 `{ items: AdminUser[], total, page, limit }` sort `createdAt DESC`. 401 / 403                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| POST   | `/users/:id/ban`               | admin             | T-014                            | Ban user → role `BANNED` + revoke refresh tokens. Response 200 User. 403 self-ban / 404 not found                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| POST   | `/users/:id/unban`             | admin             | T-014                            | Unban user → role `USER`. Response 200 User. 404 not found                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| DELETE | `/users/me/avatar`             | user              | FR-11.7                          | Remove avatar. Nếu `user.avatarPublicId` tồn tại → `cloudinary.destroy(publicId)` best-effort. Set `avatarUrl=null, avatarPublicId=null` cho user. Response 200 `{ avatarUrl: null, avatarPublicId: null }`. 204 No Content option cũng OK. Idempotent — gọi nhiều lần khi đã null trả 200 OK. Errors: 401 anon                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### Posts (`/posts/*`)

| Method | Path              | Auth                   | FR      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ----------------- | ---------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/posts`          | public (optional auth) | FR-04   | Query: `page`, `limit`, `mood`, `tag`, `sort: latest\|oldest\|likes` (default `latest`). Mỗi item Post có `author: { id, username, name: string\|null (FR-11.8 display name), role, avatarUrl }`, `counts: { reactions, comments }`, `topReactions: ReactionType[0..3]` (sort desc by count), `myReaction: ReactionType\|null` (viewer-aware qua JWT cookie hoặc anonymousId). Aggregation: 1 `Reaction.groupBy({by:[postId,type]}) IN postIds` + 1 viewer findMany (no N+1) |
| GET    | `/posts/:id`      | public (optional auth) | FR-04   | Full post same shape as list item (counts/topReactions/myReaction). View tracking via POST /posts/:id/view (T-021)                                                                                                                                                                                                                                                                                                                                                           |
| POST   | `/posts`          | admin                  | FR-02   | Body: `{ content, mood, tags[], images[], files[] }`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| PATCH  | `/posts/:id`      | admin                  | FR-02   | Partial update (UpdatePostDto = PartialType CreatePostDto). Body (mọi field optional): `{ content?, mood?, tags?: string[], images?: ImageInput[], files?: FileInput[] }`. BE **replace** (không merge) mảng images/files/tags + cleanup Cloudinary asset orphan. Response 200 full Post. Dùng bởi FE CreatePostPage edit mode (`/admin/create?edit=<id>`).                                                                                                                  |
| DELETE | `/posts/:id`      | admin                  | FR-02   | Cascade delete                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| POST   | `/posts/:id/view` | public                 | FR-04.5 | Dedup 30min theo userId (auth) / anonymousId (anon). Response 200 `{ viewCount, counted }`                                                                                                                                                                                                                                                                                                                                                                                   |

### Comments (`/comments/*`, `/posts/:id/comments`)

| Method | Path                    | Auth                | FR               | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ----------------------- | ------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/posts/:id/comments`   | public (role-aware) | FR-03.2, FR-03.6 | Public/USER trả APPROVED only. Admin trả tất cả status + field `status`. Sort top-level comments `createdAt ASC`. **Extended response (FR-03.6 reply):** mỗi top-level comment có `replies: Comment[]` (max 3 first, nested by `parentId === topComment.id`). Query `includeReplies` (default true). Top-level filter `parentId IS NULL`. Comment `author: { id, username, name: string\|null (FR-11.8), role, avatarUrl }\|null` (null = anonymous). Response `{ items: [{ ...Comment, replies: [...] (max 3), replyCount: number }] }`. **BE order `createdAt DESC` (mới→cũ — FR-03.7)** cho cả top-level + reply preview (3 reply MỚI nhất). FE render trực tiếp (Feed + Post Detail newest-first; Post Detail thêm collapse 5). 404 post |
| POST   | `/posts/:id/comments`   | optional            | FR-03.2, FR-03.6 | Body `{ content (1-2000), anonymousName? (1-50), parentId?: string (NEW FR-03.6) }`. Auth → userId; anon → anonymousId cookie + optional anonymousName. **Authed user gửi `anonymousName` → comment ẩn danh author=null (BUG-017, design "post as anon" — KHÔNG attribute user, không log activity/notif).** Status default APPROVED. Nếu `parentId` set → VALIDATE parent comment exists + `parent.postId === :id` + `parent.parentId === null` (depth 1 only). Set `replyTo: { username, isAnon }` denorm. 201 Comment with `replyTo`. 400 `VIEWER_ID_REQUIRED` / 400 `INVALID_PARENT_DEPTH` (reply on reply) / 404 post or parent                                                                                                         |
| GET    | `/comments/:id/replies` | public (role-aware) | FR-03.6 (NEW)    | Load all replies of a comment (lazy load nếu `replyCount > 3`). Order `createdAt DESC` (mới→cũ — FR-03.7, khớp preview). Query `page=1&limit=20` per NFR-06. Response 200 `{ items: Comment[], total, page, limit }`. 404                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| DELETE | `/comments/:id`         | admin               | FR-03.4          | Hard delete + cascade CommentLike + **cascade replies (FR-03.6 — Comment.onDelete CASCADE)**. 204. 404                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| PATCH  | `/comments/:id/status`  | admin               | FR-07.4          | Body `{ status: APPROVED \| REJECTED }` (PENDING không cho phép). Response 200 Comment. 404                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Reactions (`/posts/:id/reactions`) (MỚI — FR-16, M11.7 thay binary Like)

| Method | Path                          | Auth     | FR      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | ----------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/posts/:id/reactions`        | optional | FR-16.4 | Body `{ type: ReactionType }`. Identity: userId (auth) hoặc anonymousId (cookie). Upsert reaction của actor (chưa có → insert; khác type → update; cùng type → dùng DELETE endpoint). Response 200 `{ type, totalCounts: { LIKE:N, LOVE:N, HAHA:N, WOW:N, SAD:N, ANGRY:N }, topThree: ReactionType[3] }`. 400 `INVALID_TYPE` / 400 `VIEWER_ID_REQUIRED` / 404 post. Trigger Notification REACTION nếu actor authed + post.authorId != actor (metadata reactionType) |
| DELETE | `/posts/:id/reactions`        | optional | FR-16.4 | Remove reaction của actor (toggle off). Response 204. 404 (post hoặc actor chưa react)                                                                                                                                                                                                                                                                                                                                                                              |
| GET    | `/posts/:id/reactions/counts` | public   | FR-16.4 | Aggregate (no pagination). Response 200 `{ totalCounts: {6 types: N}, topThree, total: N, myReaction: ReactionType\|null }`. 404                                                                                                                                                                                                                                                                                                                                    |
| GET    | `/posts/:id/reactions`        | optional | FR-16.4 | List users đã react. Query `type?: ReactionType` (filter), `page=1&limit=20` max 50 per NFR-06. Response 200 `{ items: [{ actor: { id, username, avatarUrl }\|null (null=anonymous), type, createdAt }], total, page, limit, byType: {6:N} }`. 404                                                                                                                                                                                                                  |

### Comment Likes (`/comments/:id/like`) (giữ binary — FR-03.5)

| Method | Path                 | Auth     | FR      | Notes                                                                                                                        |
| ------ | -------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/comments/:id/like` | optional | FR-03.5 | Toggle CommentLike chỉ trên comment APPROVED. Response 200 `{ liked, count }`. 404 comment không tồn tại hoặc không APPROVED |

> **Deprecation (M11.7):** `POST /posts/:id/like` (binary) thay bằng `/posts/:id/reactions`. Server cũ return 410 Gone với message `"use /posts/:id/reactions"` trong 1 release window, sau đó 404. Migration FE: `useToggleLike` → `useUpsertReaction`.

### Saved (`/saved/*`)

| Method | Path              | Auth | FR      | Notes                                                                                                                                                                                  |
| ------ | ----------------- | ---- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/me/saved`       | user | FR-03.3 | Paginated saved posts (sort savedAt DESC). Query `page` (default 1), `limit` (default 10, max 50). Response 200 `{ items: [{ ...Post, savedAt }], total, page, limit }`. 401 no cookie |
| POST   | `/posts/:id/save` | user | FR-03.3 | Toggle bookmark. Response 200 `{ saved: boolean }`. 401 no cookie. 404 post                                                                                                            |

### Notifications (`/notifications/*`) (MỚI — FR-14)

| Method | Path                           | Auth | FR             | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | ------------------------------ | ---- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/notifications`               | user | FR-14.3/.4     | Query `filter: all\|unread` (default all), `page=1&limit=20` max 50 per NFR-06. Response 200 `{ items: [{ id, type: 'REACTION'\|'COMMENT'\|'REPLY'\|'SHARE', actor: { id, username, avatarUrl }, targetType, targetId, postId?: string, read: boolean, metadata?: { reactionType?, replyTo?: { username }, snippet?: string }, createdAt }], total, page, limit, unreadCount }`. Sort `createdAt DESC`. 401 anonymous. **T-403**: `metadata.snippet` derive khi create (REACTION/SHARE: từ `post.content`; COMMENT/REPLY: từ `comment.content`), strip HTML + truncate 80 chars + `…`. Notif cũ trước T-403 không có field (FE render fallback). |
| GET    | `/notifications/unread-count`  | user | FR-14.3        | Response 200 `{ count: number }`. 401                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| PATCH  | `/notifications/:id/read`      | user | FR-14.5        | Body `{ read: boolean }`. Self-scope (404 nếu notification.userId != current user). Response 200 `{ id, read }`. 401 / 403 / 404                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| PATCH  | `/notifications/mark-all-read` | user | FR-14.4        | Mark all unread của current user → read. Response 200 `{ updated: number }`. 401                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| DELETE | `/notifications/:id`           | user | FR-14.4        | Self-scope. Response 204. 401 / 403 / 404                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| DELETE | `/notifications/bulk`          | user | FR-14.4        | Body `{ ids: string[] }` (max 100). Self-scope (chỉ xoá ids thuộc current user, ids khác → silently skip). Response 200 `{ deleted: number }`. 400 `INVALID_BULK_IDS` (>100 hoặc empty), 401                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| PATCH  | `/notifications/bulk-read`     | user | FR-14.10 (NEW) | Body `{ ids: string[] }` (max 100). Self-scope (chỉ mark ids thuộc current user, ids khác → silently skip). Response 200 `{ updated: number }`. 400 `INVALID_BULK_IDS` (>100 hoặc empty), 401. **NEW M11.8** cho NotificationsPage bulk action bar (FR-14.7-.13)                                                                                                                                                                                                                                                                                                                                                                                 |
| DELETE | `/notifications/all`           | user | FR-14.12 (NEW) | Clear all notifications của current user. Response 200 `{ deleted: number }`. 401. **NEW M11.8** cho SubBar `✕ clear all` action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### AI (`/ai/*`) — ⚠️ PLANNED, CHƯA IMPLEMENT (FR-17, M11.8 — T-346/T-347 TODO)

> Spec dưới là thiết kế dự kiến. **Hiện chưa có `apps/api/src/ai/` module, chưa có env `AI_*`** — endpoint chưa tồn tại. Sẽ build ở T-346 (BE) + T-347 (FE AISuggestModal).

| Method | Path           | Auth  | FR      | Notes (PLANNED)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | -------------- | ----- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/ai/generate` | admin | FR-17.2 | Body `{ prompt: string (5-500 chars) }`. JwtAuthGuard + RolesGuard ADMIN. Rate limit 10 req/min/admin. Call AIProvider (Claude/OpenAI/Gemini per `AI_PROVIDER` env) với prompt template FR-17.4. Response 200 `{ html: string }` clean HTML (strip ```html markers). Error: 400 `INVALID_PROMPT`(length 5-500), 401 anonymous, 403 non-admin, 429`RATE_LIMITED`, 500 `PROVIDER_ERROR` (provider down hoặc rate limit upstream). Log Sentry mỗi request (promptLength, resultLength, model, latencyMs) |

### Files (`/files/*`)

| Method | Path            | Auth            | FR               | Notes                                                                                                                                                                                                                                                                                                                                                               |
| ------ | --------------- | --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/files/sign`   | admin           | FR-02.3, FR-06.1 | Body: `{ resourceType: 'image'\|'raw', folder?, publicId? }`. Response 200 `{ provider: 'cloudinary'\|'local', signature, timestamp, apiKey, cloudName, folder, resourceType, publicId, uploadUrl? }` (ADR-010). **cloudinary**: dùng signature upload thẳng Cloudinary. **local**: field cloud rỗng, kèm `uploadUrl:'/files/upload'` → FE upload multipart lên BE. |
| POST   | `/files/upload` | admin           | FR-02.3, FR-06.1 | **Chỉ STORAGE_DRIVER=local** (ADR-010). multipart/form-data: `file` + `folder` + `resourceType` + `publicId?`. BE ghi vào `STORAGE_LOCAL_PATH`, response 200 `{ url, publicId, width?, height?, size, name, type }` (shape `UploadedAsset`). 401 anon / 403 non-admin.                                                                                              |
| GET    | `/uploads/*`    | public (static) | FR-06.1          | **Chỉ local**: serve file tĩnh từ `STORAGE_LOCAL_PATH` qua `app.useStaticAssets(prefix:'/uploads/')`. URL trả về trong `UploadedAsset.url` = `${STORAGE_PUBLIC_URL}/uploads/<publicId>`.                                                                                                                                                                            |
| DELETE | `/files/:id`    | admin           | FR-06.4          | Hard delete DB + best-effort destroy asset (driver-aware: Cloudinary `destroy` / local `unlink`). Response 204. `PostsService.remove`/`update` cũng auto-cascade.                                                                                                                                                                                                   |

### Tags (`/tags/*`)

| Method | Path        | Auth   | FR               | Notes                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | ----------- | ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/tags`     | public | FR-04.3, FR-10.1 | List tags với meta. Query: `limit` (default 20, max 100), `sort: name\|posts\|recent` (default `posts`), `q` (substring name filter), `withSparkline` (default true). Response 200 `{ items: [{ id, name, color, description, postCount, sparkline7d: number[7], createdAt }] }`. `sparkline7d` last 7 days post-create-with-tag count (oldest→newest). Empty `q` → toàn bộ tags |
| POST   | `/tags`     | admin  | FR-04.3, FR-10.4 | Body: `{ name, color?, description? (max 280) }`. Auto-assign color từ palette (cycle theo Tag count % 7) nếu thiếu. Response 201 `{ id, name, color, description }`. 409 `DUPLICATE_TAG`                                                                                                                                                                                        |
| PATCH  | `/tags/:id` | admin  | FR-04.3, FR-10.4 | Body: `{ name?, color?, description? }`. Rename/đổi color/description. Response 200 `{ id, name, color, description }`. 404, 409 nếu name trùng                                                                                                                                                                                                                                  |
| DELETE | `/tags/:id` | admin  | FR-04.3, FR-10.4 | Hard delete Tag + cascade PostTag rows. Query: `force` (default false). Response 204 nếu force=true HOẶC postCount=0. 409 `TAG_IN_USE` với body `{ code: 'TAG_IN_USE', postCount: N }` nếu force=false + postCount>0. 404                                                                                                                                                        |

### Admin (`/admin/*`)

| Method | Path                      | Auth  | FR      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------ | ------------------------- | ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/admin/stats`            | admin | FR-07.1 | 4 metrics aggregation. Response 200 `{ posts, likes, comments, views }` mỗi field `{ total: number, sparkline: number[12] (daily buckets oldest→newest), deltaToday: number (today vs yesterday) }`. 401 / 403                                                                                                                                                                                                                                                                                                                                                                                     |
| GET    | `/admin/moods`            | admin | FR-07.2 | Mood distribution zero-filled. Response 200 `{ items: [{ mood, count }] }` — 7 entries (theo Mood enum), count=0 nếu không có post. 401 / 403                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| GET    | `/admin/heatmap`          | admin | FR-09.3 | 28-day post creation heatmap. Response 200 `{ days: [{ date: 'YYYY-MM-DD', count }] }` — 28 entries (oldest→newest, zero-fill missing). 401 / 403                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| GET    | `/admin/comments`         | admin | FR-07.4 | Cross-post comment moderation queue. Query: `status: PENDING\|APPROVED\|REJECTED` (default PENDING), `page` (default 1), `limit` (default 20, max 100). Response 200 `{ items: [{ ...Comment, post: { id, content: string (truncate 80) } }], total, page, limit }`. Sort `createdAt DESC`. 401 / 403 / 400 invalid status                                                                                                                                                                                                                                                                         |
| GET    | `/admin/posts`            | admin | FR-15.3 | List posts cho Manage Posts (mọi PostStatus). Query: `status: PUBLISHED\|DRAFT\|ARCHIVED` (default all), `mood?: Mood`, `sort: latest\|oldest\|likes` (default latest), `q?` (substring content), `page=1&limit=20` max 50 per NFR-06. Response 200 `{ items: [{ ...Post (full), status, stats: { reactionsTotal, comments, views } }], total, page, limit }`. 401 / 403                                                                                                                                                                                                                           |
| GET    | `/admin/interaction-logs` | admin | FR-18.4 | Trace log interaction của actor non-admin (anon + USER). Query: `action?: COMMENT\|REPLY\|COMMENT_LIKE\|POST_REACTION`, `actorType?: anon\|user`, `q?` (substring trong ip/fingerprint/anonymousId/userAgent), `from?`/`to?` (ISO date — lọc createdAt), `page=1&limit=20` max 100. Sort `createdAt DESC`. Response 200 `{ items: [{ id, action, targetType, targetId, postId, actor: {id,username}\|null, actorRole: Role\|null, anonymousId, ip, userAgent, browser, os, device, acceptLang, referer, geoCountry, geoCity, fingerprint, metadata, createdAt }], total, page, limit }`. 401 / 403 |
| PATCH  | `/admin/posts/:id`        | admin | FR-15.4 | Body partial `{ content?, mood?, status?: PostStatus, tags?: string[] }`. Replace tags array nếu provide. Response 200 `{ ...Post (full) }` với updated fields. 400 invalid mood/status. 401 / 403 / 404                                                                                                                                                                                                                                                                                                                                                                                           |
| DELETE | `/admin/posts/:id`        | admin | FR-15.5 | Hard delete Post + cascade (Image / File / Comment / Reaction / SavedPost / PostView). Response 204. 401 / 403 / 404                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

> Endpoints khác (defer/overlap): `/admin/visitors` defer T-042 với AnonymousSession activity persist. M11.7 thêm `/admin/posts/*` (FR-15) + `/notifications/*` (FR-14) + `/posts/:id/reactions/*` (FR-16). M11.8 (T-461..467) thêm `/admin/interaction-logs` (FR-18). (`GET /users` + ban/unban giờ đã ở bảng Users.)

### Search (`/search`)

| Method | Path      | Auth                  | FR    | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | --------- | --------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/search` | public (saved=authed) | FR-12 | Full-text search Postgres ILIKE multi-table. Query: `q` (string, empty cho default browse), `type: all\|posts\|files\|tags\|saved` (default `all`), `mood?: Mood`, `page` (default 1), `limit` (default 10, max 30). Response 200 `{ posts: { items: Post[], total, page, limit }, files: [{ id, name, postId, type }], tags: Tag[], stats: { totalPosts, withImages, withFiles, savedCount } }`. ILIKE pattern `%q%` trên `Post.content` + `Tag.name` (strip `#`) + `File.name`. `mood` filter chỉ apply `posts`. Authed user `posts.items[].saved` flag set. Empty `q` → posts/files/tags empty + stats toàn cục. `type=saved` (T-381 2026-05-27): BẮT BUỘC authed (anon → 401), join `SavedPost where userId=req.user.id`, return user's saved posts trong `posts.items`, `files=[]` + `tags=[]`, mood filter applies. Throttle 30 req/min/IP |

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

| Event              | Payload                                            | Sent to                               | Trigger                                                                        |
| ------------------ | -------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| `post:new`         | `{ post: Post }`                                   | room `admin` + global feed (optional) | Admin tạo post mới                                                             |
| `post:updated`     | `{ post: Post }`                                   | room `admin`                          | Admin edit post                                                                |
| `post:deleted`     | `{ postId: string }`                               | room `admin`                          | Admin xóa post                                                                 |
| `comment:new`      | `{ comment: Comment }`                             | room `post:<id>` + room `admin`       | Comment tạo                                                                    |
| `comment:status`   | `{ commentId, status }`                            | room `post:<id>` + room `admin`       | Admin approve/reject                                                           |
| `comment:deleted`  | `{ commentId }`                                    | room `post:<id>` + room `admin`       | Admin xóa                                                                      |
| `reaction:new`     | `{ postId, totalCounts, topThree, byAnon?, type }` | room `post:<id>` + room `admin`       | Reaction tạo/đổi (FR-16) — REPLACE `like:new` cũ                               |
| `commentLike:new`  | `{ commentId, count }`                             | room `post:<id>`                      | Like comment                                                                   |
| `notification:new` | `{ notification: Notification }`                   | room `user:<userId>` (recipient)      | Engagement event tạo notification (FR-14.6) — defer T-315, v1 dùng polling 30s |
| `save:new`         | `{ postId, userId }`                               | room `admin`                          | User save                                                                      |
| `visitor:join`     | `{ session: AnonymousSession }`                    | room `admin`                          | Anonymous mới connect                                                          |
| `visitor:leave`    | `{ sessionId }`                                    | room `admin`                          | Anonymous disconnect                                                           |
| `visitor:update`   | `{ session: AnonymousSession }`                    | room `admin`                          | Anonymous đổi page/action                                                      |
| `online:count`     | `{ count: number }`                                | global broadcast                      | Online count change (debounced)                                                |

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

- `GET /` — root ping (200 OK + `{ message: 'MyBlog API 🚀' }`)
- `GET /health` — readiness probe (200 OK + `{ status: 'ok', uptime, timestamp }`)
- `GET /metrics` — Prometheus format (optional, sau khi setup observability) — ⚠️ chưa implement
- `GET /api/v1/swagger` — ⚠️ thực tế mount tại `/swagger` (dev only)
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
