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

| Field        | Type          | Constraints      | Notes                                                    |
| ------------ | ------------- | ---------------- | -------------------------------------------------------- |
| id           | String (cuid) | PK               |                                                          |
| username     | String        | unique           |                                                          |
| email        | String?       | unique, optional |                                                          |
| passwordHash | String        |                  | bcrypt cost ≥ 10                                         |
| role         | Enum(Role)    | default `USER`   | ADMIN / USER / BANNED                                    |
| avatarUrl    | String?       |                  | Cloudinary URL                                           |
| title        | String?       | max 80           | FR-11.6 profile title (vd "Full-stack Developer")        |
| bio          | Text?         | max 500          | FR-11.6 markdown allowed (@db.Text)                      |
| skills       | Json          | default `[]`     | FR-11.6 array `{ name: string, color: string }[]` max 20 |
| createdAt    | DateTime      | default(now())   |                                                          |
| updatedAt    | DateTime      | @updatedAt       |                                                          |

**Relations:** `hasMany` Post, Comment, Like, CommentLike, SavedPost, RefreshToken
**Indexes:** username (auto unique), email (auto unique)
**Validation (BE class-validator):** `title` max 80 chars, `bio` max 500 chars, `skills` IsArray + ArrayMaxSize(20) + nested DTO { name: string max 32, color: hex regex `/^#[0-9A-Fa-f]{6}$/` }.

### Post

**Mục đích:** Bài viết của admin.

| Field     | Type             | Constraints               | Notes                         |
| --------- | ---------------- | ------------------------- | ----------------------------- |
| id        | String (cuid)    | PK                        |                               |
| content   | Text             |                           | markdown                      |
| mood      | Enum(Mood)       |                           |                               |
| viewCount | Int              | default 0                 | FR-04.5, tracked qua PostView |
| authorId  | String           | FK User                   |                               |
| createdAt | DateTime         | default(now()), `@@index` | feed sort                     |
| updatedAt | DateTime         | @updatedAt                |                               |
| status    | Enum(PostStatus) | default(PUBLISHED)        | FR-15.2 — admin Manage Posts  |

**Relations:** `belongsTo` User (author), `hasMany` Image, File, Comment, Reaction, PostTag, SavedPost, PostView
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

**Mục đích:** Comment trên bài viết (auth user hoặc anonymous). Support 1-level reply MVP (FR-03.6 — amended 2026-05-25).

| Field         | Type                | Constraints                                   | Notes                                                                        |
| ------------- | ------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| id            | String (cuid)       | PK                                            |                                                                              |
| postId        | String              | FK Post, onDelete Cascade                     |                                                                              |
| userId        | String?             | FK User                                       | null = anonymous                                                             |
| anonymousName | String?             |                                               | nếu anonymous, hiển thị tên này                                              |
| anonymousId   | String?             |                                               | cookie UUID nếu anonymous (dedupe like)                                      |
| content       | Text                |                                               | sanitized FE+BE                                                              |
| status        | Enum(CommentStatus) | default `APPROVED`                            | PENDING khi moderation queue ON                                              |
| parentId      | String?             | FK Comment (self-reference), onDelete Cascade | **NEW FR-03.6** — null = top-level; nếu set → reply                          |
| replyTo       | Json?               |                                               | **NEW FR-03.6** — denorm `{username, isAnon}` của parent author (avoid JOIN) |
| createdAt     | DateTime            | default(now())                                |                                                                              |

**Relations:** `belongsTo` Post, `belongsTo` User (nullable), `hasMany` CommentLike, **`belongsTo` Comment (parent — NEW)**, **`hasMany` Comment (replies — NEW)**
**Indexes:**

- `@@index([postId, createdAt])` cho load comment theo post + sort
- **`@@index([parentId])` (NEW FR-03.6)** cho fast lookup replies of a comment

**Depth constraint:** Service layer VALIDATE `parentComment.parentId === null` trước khi insert reply (reject 400 `INVALID_PARENT_DEPTH` nếu reply on a reply). Depth max 1 — không cho nested reply trong reply.

**Cascade:** `onDelete Cascade` từ parent → replies (xoá parent comment → tất cả replies bị xoá).

**Prisma snippet (delta cho M11.8):**

```prisma
model Comment {
  id            String        @id @default(cuid())
  // ... existing fields
  parentId      String?
  replyTo       Json?         // { username: string, isAnon: boolean }
  parent        Comment?      @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies       Comment[]     @relation("CommentReplies")

  @@index([postId, createdAt])
  @@index([parentId])
}
```

### Reaction (RENAMED từ Like — FR-16 M11.7)

**Mục đích:** Multi-type reaction cho Post (LIKE/LOVE/HAHA/WOW/SAD/ANGRY). Thay binary Like cũ.

| Field       | Type               | Constraints               | Notes                            |
| ----------- | ------------------ | ------------------------- | -------------------------------- |
| id          | String (cuid)      | PK                        |                                  |
| postId      | String             | FK Post, onDelete Cascade |                                  |
| userId      | String?            | FK User                   | null = anonymous                 |
| anonymousId | String?            |                           | cookie UUID                      |
| type        | Enum(ReactionType) |                           | LIKE/LOVE/HAHA/WOW/SAD/ANGRY     |
| createdAt   | DateTime           | default(now())            |                                  |
| updatedAt   | DateTime           | @updatedAt                | track khi user đổi reaction type |

**Relations:** `belongsTo` Post, `belongsTo` User (nullable)
**Indexes:** `@@index([postId])` (count), `@@index([postId, type])` (count per type)
**Unique constraints:**

- `@@unique([postId, userId])` — auth 1 reaction/post (đổi type = update row, không insert)
- `@@unique([postId, anonymousId])` — anonymous 1 reaction/post

**Migration:** Rename `Like` → `Reaction` + thêm `type ReactionType @default(LIKE)` (backfill existing = LIKE). Chi tiết v0.4.0-alpha.

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

| Field       | Type          | Constraints    | Notes                                                            |
| ----------- | ------------- | -------------- | ---------------------------------------------------------------- |
| id          | String (cuid) | PK             |                                                                  |
| name        | String        | unique         | lowercase, có dấu `#` đầu (`#travel`)                            |
| color       | String?       |                | hex color (cycle qua palette khi tag mới — xem DESIGN_SYSTEM.md) |
| description | String?       | max 280        | FR-10.3 optional, hiển thị trong TagCard                         |
| createdAt   | DateTime      | default(now()) | FR-10.1 "Recently added" stat                                    |

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

### Entity ActivityLog (FR-13)

| Field         | Type               | Constraints                        | Description                                                        |
| ------------- | ------------------ | ---------------------------------- | ------------------------------------------------------------------ |
| id            | String             | PK, cuid                           |                                                                    |
| actorId       | String             | FK → User.id, ON DELETE CASCADE    | Người thực hiện action                                             |
| type          | ActivityType       |                                    | POST_CREATED / COMMENT_CREATED / LIKE_CREATED / SAVE_CREATED       |
| targetType    | ActivityTargetType |                                    | POST / COMMENT — polymorphic                                       |
| targetId      | String             | (soft FK, không declared relation) | ID của Post/Comment — không cascade vì poly                        |
| targetOwnerId | String?            | FK → User.id, ON DELETE CASCADE    | Denorm owner của target (post.authorId) — index hybrid query nhanh |
| metadata      | Json?              |                                    | Field reserve cho future (vd anonymousSessionId nếu sau extend)    |
| createdAt     | DateTime           | default(now())                     |                                                                    |

**Relations:** `actor` belongsTo User (alias `ActorActivities`); `targetOwner` belongsTo? User (alias `TargetOwnerActivities`)
**Indexes:** `@@index([actorId, createdAt])`, `@@index([targetOwnerId, createdAt])`
**Notes:**

- Append-only log: KHÔNG xoá khi target Post/Comment bị delete. UI degrade hiển thị `[deleted post]` nếu lookup target không có.
- `targetId` không declared relation vì polymorphic (Post hoặc Comment). Hydrate qua manual lookup trong service.
- Hybrid query Profile Activity: `WHERE actorId = :userId OR (targetOwnerId = :userId AND actorId != :userId)`.

### Entity Notification (FR-14)

| Field      | Type             | Constraints                      | Description                                              |
| ---------- | ---------------- | -------------------------------- | -------------------------------------------------------- |
| id         | String           | PK, cuid                         |                                                          |
| userId     | String           | FK → User.id, ON DELETE CASCADE  | Recipient (chỉ authed user)                              |
| actorId    | String           | FK → User.id, ON DELETE CASCADE  | Actor gây event (chỉ authed; anonymous skip per FR-14.2) |
| type       | NotificationType |                                  | REACTION / COMMENT / REPLY / SHARE                       |
| targetType | String           |                                  | POST / COMMENT (polymorphic)                             |
| targetId   | String           | (soft FK, không declared)        | ID Post/Comment, không cascade vì poly                   |
| postId     | String?          | FK → Post.id, ON DELETE SET NULL | Denorm cho fast nav từ notification → post               |
| read       | Boolean          | default(false)                   |                                                          |
| metadata   | Json?            |                                  | vd `{ reactionType: 'LOVE' }` cho REACTION event         |
| createdAt  | DateTime         | default(now())                   |                                                          |

**Relations:** `recipient` belongsTo User (alias `ReceivedNotifications`); `actor` belongsTo User (alias `SentNotifications`); `post` belongsTo? Post.
**Indexes:** `@@index([userId, createdAt])` (list per user DESC), `@@index([userId, read])` (filter unread count fast).
**Notes:**

- Anonymous engagement KHÔNG tạo notification (cần actorId là user thật, FR-14.2).
- Self-action (user react/comment post của chính mình) KHÔNG tạo notification.
- Cascade: nếu actor account bị xoá → notification của recipient cũng xoá (FK Cascade). V1 chọn vậy cho đơn giản; reconsider khi cần "by deleted user".

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

### Enum ActivityType (MỚI — FR-13)

Values: `POST_CREATED`, `COMMENT_CREATED`, `LIKE_CREATED`, `SAVE_CREATED`
Dùng cho: `ActivityLog.type`. KHÔNG log unlike/unsave events (append-only chỉ create).

### Enum ActivityTargetType (MỚI — FR-13)

Values: `POST`, `COMMENT`
Dùng cho: `ActivityLog.targetType`. Polymorphic — `targetId` ref Post hoặc Comment tùy type.

### Enum NotificationType (MỚI — FR-14)

Values: `REACTION`, `COMMENT`, `REPLY`, `SHARE`
Dùng cho: `Notification.type`. KHÔNG log remove events (chỉ create).

### Enum ReactionType (MỚI — FR-16)

Values: `LIKE`, `LOVE`, `HAHA`, `WOW`, `SAD`, `ANGRY`
Dùng cho: `Reaction.type`. Emoji map: LIKE 👍, LOVE ❤️, HAHA 😆, WOW 😮, SAD 😢, ANGRY 😡.

> Cross-ref: [DESIGN_SYSTEM.md > Reaction emoji map](./DESIGN_SYSTEM.md). Thêm reaction type mới PHẢI update cả 2 doc.

### Enum PostStatus (MỚI — FR-15)

Values: `PUBLISHED`, `DRAFT`, `ARCHIVED`
Dùng cho: `Post.status`. Default `PUBLISHED` (backward compat). Feed (`GET /posts`) chỉ trả PUBLISHED; Manage Posts (`/admin/posts`) trả mọi status.

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

enum Role               { ADMIN USER BANNED }
enum Mood               { HAPPY EXCITED THOUGHTFUL CALM SAD GRATEFUL ANGRY }
enum FileType           { PDF DOC DOCX XLS XLSX TXT CSV }
enum CommentStatus      { PENDING APPROVED REJECTED }
enum ActivityType       { POST_CREATED COMMENT_CREATED LIKE_CREATED SAVE_CREATED }
enum ActivityTargetType { POST COMMENT }
enum NotificationType   { REACTION COMMENT REPLY SHARE }
enum ReactionType       { LIKE LOVE HAHA WOW SAD ANGRY }
enum PostStatus         { PUBLISHED DRAFT ARCHIVED }

model User {
  id            String        @id @default(cuid())
  username      String        @unique
  email         String?       @unique
  passwordHash  String
  role          Role          @default(USER)
  avatarUrl     String?
  title         String?       // FR-11.6 max 80 chars
  bio           String?       @db.Text  // FR-11.6 max 500 chars markdown
  skills        Json          @default("[]")  // FR-11.6 array { name, color } max 20
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
  status     PostStatus @default(PUBLISHED)
  viewCount  Int        @default(0)
  authorId   String
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  author     User       @relation(fields: [authorId], references: [id])
  images     Image[]
  files      File[]
  comments   Comment[]
  reactions  Reaction[]
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

model Reaction {
  id          String       @id @default(cuid())
  postId      String
  userId      String?
  anonymousId String?
  type        ReactionType
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  post        Post         @relation(fields: [postId], references: [id], onDelete: Cascade)
  user        User?        @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
  @@unique([postId, anonymousId])
  @@index([postId])
  @@index([postId, type])
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
  id          String    @id @default(cuid())
  name        String    @unique
  color       String?
  description String?   // FR-10.3 max 280 chars
  createdAt   DateTime  @default(now())  // FR-10.1 "Recently added" stat

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

model ActivityLog {
  id             String              @id @default(cuid())
  actorId        String
  type           ActivityType
  targetType     ActivityTargetType
  targetId       String                                 // soft FK polymorphic — không declared relation
  targetOwnerId  String?
  metadata       Json?
  createdAt      DateTime            @default(now())

  actor          User                @relation("ActorActivities", fields: [actorId], references: [id], onDelete: Cascade)
  targetOwner    User?               @relation("TargetOwnerActivities", fields: [targetOwnerId], references: [id], onDelete: Cascade)

  @@index([actorId, createdAt])
  @@index([targetOwnerId, createdAt])
}

model Notification {
  id          String           @id @default(cuid())
  userId      String                                  // recipient
  actorId     String                                  // actor (chỉ authed)
  type        NotificationType
  targetType  String                                  // POST | COMMENT
  targetId    String                                  // soft FK polymorphic
  postId      String?                                 // denorm cho fast nav
  read        Boolean          @default(false)
  metadata    Json?                                   // vd { reactionType: 'LOVE' }
  createdAt   DateTime         @default(now())

  recipient   User             @relation("ReceivedNotifications", fields: [userId], references: [id], onDelete: Cascade)
  actor       User             @relation("SentNotifications", fields: [actorId], references: [id], onDelete: Cascade)
  post        Post?            @relation(fields: [postId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([userId, read])
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

- **Migration:** `20260517165932_init` (T-010) — xem [apps/api/docs/MIGRATIONS.md](../apps/api/docs/MIGRATIONS.md)
- **Added:** User, Post, Image, File, Comment, Like, CommentLike, Tag, PostTag, SavedPost, PostView, AnonymousSession, RefreshToken
- **Added enums:** Role (with BANNED), Mood (7 values), FileType (7 values), CommentStatus (3 values)
- **Breaking:** N/A (initial schema, chưa có v1 ship)
- **Related ADRs:** ADR-005 (Prisma)
- **Notes:**
  - `Like` vs `CommentLike` tách riêng (xem note ở `CommentLike` section)
  - `AnonymousSession.id` dùng string format hex hoặc sequential — KHÔNG cuid để có ID format friendly cho UI
  - Local postgres-main đổi port `:5432` → `:5434` (tránh conflict local postgres). Update `apps/api/.env.example` + `docker-compose.yml`.

### v0.3.0-alpha (planned) — profile + tags expand (M11.5)

- **Planned migration:** `add_user_profile_fields_and_tag_description` (T-220 + T-210)
- **Added:** `User.title String?` (80) + `User.bio String? @db.Text` (500 markdown) + `User.skills Json @default("[]")` (array `{name,color}` max 20) + `Tag.description String?` (280) + `Tag.createdAt DateTime @default(now())`.
- **Backfill:** N/A — all new fields nullable hoặc have defaults; existing rows OK.
- **Breaking:** None — purely additive.
- **Linked:** FR-10 (Tag), FR-11 (User profile).

### v0.3.1-alpha (planned) — Activity Log (M11.6)

- **Planned migration:** `add_activity_log` (T-300)
- **Added:** Model `ActivityLog` (id, actorId, type, targetType, targetId, targetOwnerId?, metadata?, createdAt) + enum `ActivityType` (POST_CREATED / COMMENT_CREATED / LIKE_CREATED / SAVE_CREATED) + enum `ActivityTargetType` (POST / COMMENT). 2 index `[actorId, createdAt]` + `[targetOwnerId, createdAt]`.
- **Backfill:** N/A — empty table, log only from migration time forward (historical activity sẽ KHÔNG visible cho v1).
- **Breaking:** None — purely additive.
- **Linked:** FR-13 (Activity Log user-scope), UC-16.

### v0.4.0-alpha (planned) — Design v2 (Notifications + Manage Posts + Reactions) (M11.7)

- **Planned migrations:**
  - `add_post_status_enum` (T-320): enum `PostStatus` + `Post.status PostStatus @default(PUBLISHED)`. Backfill: existing rows → PUBLISHED.
  - `add_notification_table` (T-310): model `Notification` + enum `NotificationType`. 2 index `[userId, createdAt]` + `[userId, read]`.
  - `rename_like_to_reaction_with_type` (T-316 new): RENAME table `Like` → `Reaction` + thêm column `type ReactionType @default(LIKE)` + enum `ReactionType`. Backfill: ALL existing rows được set `type='LIKE'` (data preserve). Indexes giữ nguyên + thêm `[postId, type]`. Rename relation alias trong Post model (`likes` → `reactions`).
- **Backfill:** Post.status → PUBLISHED; Like → Reaction `type=LIKE` (full data preserve, 0 row mất).
- **Breaking:** **YES** — Like model bị rename → Reaction. BE code phải update Prisma queries (PostsService include, LikesService → ReactionsService). API endpoint `POST /posts/:id/likes` đổi thành `POST /posts/:id/reactions` (xem API_CONTRACT). FE phải update `useToggleLike` → `useUpsertReaction`. Migration order: deploy BE mới + chạy migration trong 1 release window.
- **Linked:** FR-14 (Notification), FR-15 (Manage Posts), FR-16 (Multi-Reaction), UC-17/18/19/20/21.

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
