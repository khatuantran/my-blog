# Data Model

> Entities + relationships + Prisma schema cho MyBlog. Cho per-migration log chi tiết: [`apps/api/docs/MIGRATIONS.md`](../apps/api/docs/MIGRATIONS.md). Cho FR mapping: [REQUIREMENTS.md](./REQUIREMENTS.md).

## ERD (text)

```
User ───< Post ───< Image
  │        ├──< File
  │        ├──< Comment >── User (nullable)
  │        │       └──< CommentLike >── User (nullable)
  │        ├──< Like >── User (nullable)
  │        ├──< SavedPost >── User
  │        ├──< PostView
  │        └──< PostTag >── Tag
  │
  └──< RefreshToken (auth session)

AnonymousSession (standalone — track guest)
```

## Entities

### User

**Mục đích:** Account đăng ký (admin + auth user). Anonymous KHÔNG có record ở đây — track qua `AnonymousSession`.

| Field        | Type          | Constraints      | Notes                 |
| ------------ | ------------- | ---------------- | --------------------- |
| id           | String (cuid) | PK               |                       |
| username     | String        | unique           |                       |
| email        | String?       | unique, optional |                       |
| passwordHash | String        |                  | bcrypt cost ≥ 10      |
| role         | Enum(Role)    | default `USER`   | ADMIN / USER / BANNED |
| avatarUrl    | String?       |                  | Cloudinary URL        |
| createdAt    | DateTime      | default(now())   |                       |
| updatedAt    | DateTime      | @updatedAt       |                       |

**Relations:** `hasMany` Post, Comment, Like, CommentLike, SavedPost, RefreshToken
**Indexes:** username (auto unique), email (auto unique)

### Post

**Mục đích:** Bài viết của admin.

| Field     | Type          | Constraints               | Notes                         |
| --------- | ------------- | ------------------------- | ----------------------------- |
| id        | String (cuid) | PK                        |                               |
| content   | Text          |                           | markdown                      |
| mood      | Enum(Mood)    |                           |                               |
| viewCount | Int           | default 0                 | FR-04.5, tracked qua PostView |
| authorId  | String        | FK User                   |                               |
| createdAt | DateTime      | default(now()), `@@index` | feed sort                     |
| updatedAt | DateTime      | @updatedAt                |                               |

**Relations:** `belongsTo` User (author), `hasMany` Image, File, Comment, Like, PostTag, SavedPost, PostView
**Indexes:** `@@index([createdAt])` cho feed sort DESC; `@@index([authorId])`

### Image

**Mục đích:** Ảnh thuộc bài viết (max 10/post, Cloudinary).

| Field    | Type          | Constraints               | Notes                        |
| -------- | ------------- | ------------------------- | ---------------------------- |
| id       | String (cuid) | PK                        |                              |
| postId   | String        | FK Post, onDelete Cascade |                              |
| url      | String        |                           | Cloudinary secure URL        |
| publicId | String        |                           | Cloudinary publicId (để xóa) |
| width    | Int           |                           |                              |
| height   | Int           |                           |                              |
| order    | Int           | default 0                 | thứ tự hiển thị              |

**Relations:** `belongsTo` Post
**Indexes:** `@@index([postId])`

### File (MỚI — FR-06)

**Mục đích:** File attachment cho bài viết (PDF/DOC/DOCX/XLS/XLSX/TXT/CSV), max 20/post, ≤ 20MB each.

| Field     | Type           | Constraints               | Notes                 |
| --------- | -------------- | ------------------------- | --------------------- |
| id        | String (cuid)  | PK                        |                       |
| postId    | String         | FK Post, onDelete Cascade |                       |
| name      | String         |                           | original filename     |
| type      | Enum(FileType) |                           |                       |
| size      | Int            |                           | bytes                 |
| url       | String         |                           | Cloudinary secure URL |
| publicId  | String         |                           | Cloudinary publicId   |
| createdAt | DateTime       | default(now())            |                       |

**Relations:** `belongsTo` Post
**Indexes:** `@@index([postId])`

### Comment

**Mục đích:** Comment trên bài viết (auth user hoặc anonymous).

| Field         | Type                | Constraints               | Notes                                   |
| ------------- | ------------------- | ------------------------- | --------------------------------------- |
| id            | String (cuid)       | PK                        |                                         |
| postId        | String              | FK Post, onDelete Cascade |                                         |
| userId        | String?             | FK User                   | null = anonymous                        |
| anonymousName | String?             |                           | nếu anonymous, hiển thị tên này         |
| anonymousId   | String?             |                           | cookie UUID nếu anonymous (dedupe like) |
| content       | Text                |                           | sanitized FE+BE                         |
| status        | Enum(CommentStatus) | default `APPROVED`        | PENDING khi moderation queue ON         |
| createdAt     | DateTime            | default(now())            |                                         |

**Relations:** `belongsTo` Post, `belongsTo` User (nullable), `hasMany` CommentLike
**Indexes:** `@@index([postId, createdAt])` cho load comment theo post + sort

### Like

**Mục đích:** Like cho Post (auth user hoặc anonymous).

| Field       | Type          | Constraints               | Notes            |
| ----------- | ------------- | ------------------------- | ---------------- |
| id          | String (cuid) | PK                        |                  |
| postId      | String        | FK Post, onDelete Cascade |                  |
| userId      | String?       | FK User                   | null = anonymous |
| anonymousId | String?       |                           | cookie UUID      |
| createdAt   | DateTime      | default(now())            |                  |

**Relations:** `belongsTo` Post, `belongsTo` User (nullable)
**Indexes:** `@@index([postId])` cho count nhanh
**Unique constraints:**

- `@@unique([postId, userId])` — auth chỉ like 1 lần (when userId NOT NULL)
- `@@unique([postId, anonymousId])` — anonymous chỉ like 1 lần (when anonymousId NOT NULL)

### CommentLike (MỚI — FR-03.5)

**Mục đích:** Like cho Comment (separate từ Like vì target khác).

| Field       | Type          | Constraints                  | Notes            |
| ----------- | ------------- | ---------------------------- | ---------------- |
| id          | String (cuid) | PK                           |                  |
| commentId   | String        | FK Comment, onDelete Cascade |                  |
| userId      | String?       | FK User                      | null = anonymous |
| anonymousId | String?       |                              | cookie UUID      |
| createdAt   | DateTime      | default(now())               |                  |

**Relations:** `belongsTo` Comment, `belongsTo` User (nullable)
**Indexes:** `@@index([commentId])`
**Unique constraints:**

- `@@unique([commentId, userId])`
- `@@unique([commentId, anonymousId])`

> **Implementation note:** Có thể merge `Like` + `CommentLike` thành generic `Reaction` table với polymorphic `targetType` (POST/COMMENT) + `targetId`. Default tách riêng cho clarity + FK constraints. Quyết định lại ở implement phase nếu cần.

### Tag

**Mục đích:** Hashtag (M2M qua PostTag).

| Field | Type          | Constraints | Notes                                                            |
| ----- | ------------- | ----------- | ---------------------------------------------------------------- |
| id    | String (cuid) | PK          |                                                                  |
| name  | String        | unique      | lowercase, có dấu `#` đầu (`#travel`)                            |
| color | String?       |             | hex color (cycle qua palette khi tag mới — xem DESIGN_SYSTEM.md) |

**Relations:** `hasMany` PostTag
**Indexes:** `@@index([name])`

### PostTag (M2M)

**Mục đích:** Bảng nối Post ↔ Tag.

| Field  | Type   | Constraints               | Notes |
| ------ | ------ | ------------------------- | ----- |
| postId | String | FK Post, onDelete Cascade |       |
| tagId  | String | FK Tag, onDelete Cascade  |       |

**Relations:** `belongsTo` Post, `belongsTo` Tag
**Unique constraints:** PK composite `(postId, tagId)`

### SavedPost

**Mục đích:** Bài viết user lưu lại (CHỈ auth user).

| Field   | Type     | Constraints               | Notes |
| ------- | -------- | ------------------------- | ----- |
| userId  | String   | FK User, onDelete Cascade |       |
| postId  | String   | FK Post, onDelete Cascade |       |
| savedAt | DateTime | default(now())            |       |

**Relations:** `belongsTo` User, `belongsTo` Post
**Unique constraints:** PK composite `(userId, postId)`

### PostView (MỚI — FR-04.5)

**Mục đích:** Track view per session để dedupe (1 view / 30min / session).

| Field       | Type          | Constraints               | Notes    |
| ----------- | ------------- | ------------------------- | -------- |
| id          | String (cuid) | PK                        |          |
| postId      | String        | FK Post, onDelete Cascade |          |
| userId      | String?       | FK User                   | nullable |
| anonymousId | String?       |                           | nullable |
| viewedAt    | DateTime      | default(now())            |          |

**Relations:** `belongsTo` Post
**Indexes:** `@@index([postId, viewedAt])`, `@@index([anonymousId, postId, viewedAt])` cho dedup query

### AnonymousSession (MỚI — FR-09.2)

**Mục đích:** Track anonymous session cho live visitors panel + activity log.

| Field      | Type     | Constraints    | Notes                                                           |
| ---------- | -------- | -------------- | --------------------------------------------------------------- |
| id         | String   | PK             | format `0x7F·4A2C` hex hoặc `Anon#7` sequential                 |
| geo        | String?  |                | ISO country code hoặc city (vd: `HN`, `SG`) — từ IP geolocation |
| lastPage   | String?  |                | path `/post/abc123`                                             |
| lastAction | String?  |                | `reading`, `browsing`, `commenting`                             |
| lastActive | DateTime | @updatedAt     |                                                                 |
| createdAt  | DateTime | default(now()) |                                                                 |

**Relations:** standalone (không FK)
**Indexes:** `@@index([lastActive])` cho "active in last X min" query

### RefreshToken (MỚI — FR-01.2)

**Mục đích:** Lưu refresh token để có thể revoke (logout, rotation).

| Field     | Type          | Constraints               | Notes                              |
| --------- | ------------- | ------------------------- | ---------------------------------- |
| id        | String (cuid) | PK                        |                                    |
| userId    | String        | FK User, onDelete Cascade |                                    |
| tokenHash | String        | unique                    | SHA-256 hash của refresh token raw |
| expiresAt | DateTime      |                           | now + 30d                          |
| revokedAt | DateTime?     |                           | nếu null thì còn valid             |
| createdAt | DateTime      | default(now())            |                                    |
| userAgent | String?       |                           | track device                       |
| ipAddress | String?       |                           | track IP issue                     |

**Relations:** `belongsTo` User
**Indexes:** `@@index([userId])`, `@@index([tokenHash])`

## Enums

### Enum Role

Values: `ADMIN`, `USER`, `BANNED`
Dùng cho: `User.role`

### Enum Mood

Values: `HAPPY`, `EXCITED`, `THOUGHTFUL`, `CALM`, `SAD`, `GRATEFUL`, `ANGRY`
Dùng cho: `Post.mood`

> Cross-ref: [DESIGN_SYSTEM.md > Mood Color Map](./DESIGN_SYSTEM.md). Thêm mood enum mới PHẢI update cả 2 doc.

### Enum FileType (MỚI)

Values: `PDF`, `DOC`, `DOCX`, `XLS`, `XLSX`, `TXT`, `CSV`
Dùng cho: `File.type`

### Enum CommentStatus (MỚI)

Values: `PENDING`, `APPROVED`, `REJECTED`
Dùng cho: `Comment.status`

## Prisma snippet (schema)

```prisma
// File: apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role          { ADMIN USER BANNED }
enum Mood          { HAPPY EXCITED THOUGHTFUL CALM SAD GRATEFUL ANGRY }
enum FileType      { PDF DOC DOCX XLS XLSX TXT CSV }
enum CommentStatus { PENDING APPROVED REJECTED }

model User {
  id            String        @id @default(cuid())
  username      String        @unique
  email         String?       @unique
  passwordHash  String
  role          Role          @default(USER)
  avatarUrl     String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  posts         Post[]
  comments      Comment[]
  likes         Like[]
  commentLikes  CommentLike[]
  savedPosts    SavedPost[]
  refreshTokens RefreshToken[]
}

model Post {
  id         String     @id @default(cuid())
  content    String
  mood       Mood
  viewCount  Int        @default(0)
  authorId   String
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  author     User       @relation(fields: [authorId], references: [id])
  images     Image[]
  files      File[]
  comments   Comment[]
  likes      Like[]
  postTags   PostTag[]
  savedBy    SavedPost[]
  views      PostView[]

  @@index([createdAt])
  @@index([authorId])
}

model Image {
  id        String @id @default(cuid())
  postId    String
  url       String
  publicId  String
  width     Int
  height    Int
  order     Int    @default(0)

  post      Post   @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
}

model File {
  id        String   @id @default(cuid())
  postId    String
  name      String
  type      FileType
  size      Int
  url       String
  publicId  String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
}

model Comment {
  id            String        @id @default(cuid())
  postId        String
  userId        String?
  anonymousName String?
  anonymousId   String?
  content       String
  status        CommentStatus @default(APPROVED)
  createdAt     DateTime      @default(now())

  post          Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  user          User?         @relation(fields: [userId], references: [id])
  likes         CommentLike[]

  @@index([postId, createdAt])
}

model Like {
  id          String   @id @default(cuid())
  postId      String
  userId      String?
  anonymousId String?
  createdAt   DateTime @default(now())

  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user        User?    @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
  @@unique([postId, anonymousId])
  @@index([postId])
}

model CommentLike {
  id          String   @id @default(cuid())
  commentId   String
  userId      String?
  anonymousId String?
  createdAt   DateTime @default(now())

  comment     Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user        User?    @relation(fields: [userId], references: [id])

  @@unique([commentId, userId])
  @@unique([commentId, anonymousId])
  @@index([commentId])
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  color String?

  posts PostTag[]

  @@index([name])
}

model PostTag {
  postId String
  tagId  String

  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}

model SavedPost {
  userId  String
  postId  String
  savedAt DateTime @default(now())

  user    User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post    Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([userId, postId])
}

model PostView {
  id          String   @id @default(cuid())
  postId      String
  userId      String?
  anonymousId String?
  viewedAt    DateTime @default(now())

  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId, viewedAt])
  @@index([anonymousId, postId, viewedAt])
}

model AnonymousSession {
  id          String   @id
  geo         String?
  lastPage    String?
  lastAction  String?
  lastActive  DateTime @updatedAt
  createdAt   DateTime @default(now())

  @@index([lastActive])
}

model RefreshToken {
  id         String    @id @default(cuid())
  userId     String
  tokenHash  String    @unique
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
  userAgent  String?
  ipAddress  String?

  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
}
```

## Indexing Strategy (tổng hợp)

| Index                                      | Purpose                                              |
| ------------------------------------------ | ---------------------------------------------------- |
| `Post.createdAt DESC`                      | Feed sort, default page query                        |
| `Post.authorId`                            | List bài theo author (cho admin profile sau)         |
| `Comment.postId + createdAt`               | Load + sort comments theo post                       |
| `Like.postId`                              | Count likes nhanh                                    |
| `CommentLike.commentId`                    | Count likes nhanh per comment                        |
| `Tag.name` (unique auto)                   | Filter feed theo tag, dedup tag mới                  |
| `Image.postId`, `File.postId`              | Load attachments theo post                           |
| `PostView.postId + viewedAt`               | Dedup view trong 30min window                        |
| `PostView.anonymousId + postId + viewedAt` | Dedup theo anonymous session                         |
| `AnonymousSession.lastActive`              | Query "active in last 5 min" cho live visitors panel |
| `RefreshToken.tokenHash`                   | Lookup khi refresh                                   |
| `User.username/email` (unique auto)        | Login lookup                                         |

## Migration Log (summary high-level)

> **Per-migration chi tiết** (auto-gen từ `prisma migrate dev --name <X>`): xem [`apps/api/docs/MIGRATIONS.md`](../apps/api/docs/MIGRATIONS.md).
> File này chỉ giữ **summary entity changes per version** + breaking note + ADR liên quan.

### v0.2.0-alpha (2026-05-17) — initial schema

- **Added:** User, Post, Image, File, Comment, Like, CommentLike, Tag, PostTag, SavedPost, PostView, AnonymousSession, RefreshToken
- **Added enums:** Role (with BANNED), Mood (7 values), FileType (7 values), CommentStatus (3 values)
- **Breaking:** N/A (initial schema, chưa có v1 ship)
- **Related ADRs:** ADR-005 (Prisma)
- **Notes:**
  - `Like` vs `CommentLike` tách riêng (xem note ở `CommentLike` section)
  - `AnonymousSession.id` dùng string format hex hoặc sequential — KHÔNG cuid để có ID format friendly cho UI

---

## Template thêm entity mới

```markdown
### <EntityName>

**Mục đích:** <1 câu>

| Field     | Type          | Constraints    | Notes |
| --------- | ------------- | -------------- | ----- |
| id        | String (cuid) | PK             |       |
| ...       | ...           | ...            | ...   |
| createdAt | DateTime      | default(now()) |       |
| updatedAt | DateTime      | @updatedAt     |       |

**Relations:**

- `belongsTo` <Other>: ...
- `hasMany` <Other>: ...

**Indexes:**

- `@@index([field])` — vì sao cần

**Unique constraints:**

- `@@unique([fieldA, fieldB])` — vì sao
```

## Template thêm enum mới

```markdown
### Enum <Name>

Values: `A`, `B`, `C`
Dùng cho: `<Model>.<field>`
```

## Template migration log summary entry

```markdown
### v<X.Y.Z> (YYYY-MM-DD) — <name>

- **Added:** ...
- **Changed:** ...
- **Removed:** ...
- **Breaking:** yes/no — lý do + migration path
- **Related ADRs:** ADR-XXX
- **Notes:** ...
```
