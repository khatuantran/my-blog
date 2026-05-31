# Prisma Migrations Log

> Chi tiết per-migration. Summary cấp cao + entity changes: [docs/DATA_MODEL.md](../../../docs/DATA_MODEL.md).

## Format

```markdown
### YYYYMMDDhhmmss\_<migration_name>

- **Created:** YYYY-MM-DD
- **Type:** schema | data | refactor
- **Entities affected:** User, Post, ...
- **Breaking:** yes | no
- **Notes:** ...
- **Rollback:** `prisma migrate resolve --rolled-back <name>` + revert migration file
```

## Migrations

### 20260531114351_add_interaction_log_geo

- **Created:** 2026-05-31
- **Type:** schema (additive — non-breaking)
- **Entities affected:** `InteractionLog` (+2 nullable: `geoCountry TEXT`, `geoCity TEXT`)
- **Breaking:** no — cột mới nullable.
- **Notes:** FR-18 geo-locate IP qua `geoip-lite` (offline). Populate khi log (IP public); private/local → null. Applied main + test.
- **Task:** T-467
- **Rollback:** `prisma migrate resolve --rolled-back 20260531114351_add_interaction_log_geo` + `ALTER TABLE "InteractionLog" DROP COLUMN "geoCountry", DROP COLUMN "geoCity";`

### 20260531110620_add_interaction_log

- **Created:** 2026-05-31
- **Type:** schema (additive — non-breaking)
- **Entities affected:** new model `InteractionLog` + 2 enums (`InteractionAction` COMMENT/REPLY/COMMENT_LIKE/POST_REACTION, `InteractionTargetType` POST/COMMENT). FK `InteractionLog.actorUserId → User.id` ON DELETE SET NULL.
- **Breaking:** no — new table only, không đụng table cũ.
- **Notes:** FR-18 trace log interaction của actor non-admin (anon + USER). Append-only (chỉ `createdAt`), polymorphic soft-FK (`targetType`+`targetId`, không cascade) mirror `ActivityLog`. Indexes: `[createdAt]`, `[actorUserId, createdAt]`, `[anonymousId, createdAt]`, `[fingerprint, createdAt]`, `[postId]`. **Migration SQL được dọn tay** — `migrate diff` từ live DB kéo theo drift cũ (rename constraint `Like_*`→`Reaction_*` + `updatedAt` DROP DEFAULT) KHÔNG liên quan → đã loại, chỉ giữ thay đổi InteractionLog. Applied cả main DB :5434 + test DB :5433.
- **Task:** T-461
- **Rollback:** `prisma migrate resolve --rolled-back 20260531110620_add_interaction_log` + `DROP TABLE "InteractionLog"; DROP TYPE "InteractionAction"; DROP TYPE "InteractionTargetType";`

### 20260530180000_add_user_contact_fields

- **Created:** 2026-05-30
- **Type:** schema (additive — non-breaking)
- **Entities affected:** `User` (+5 nullable columns: `name TEXT`, `location TEXT`, `bornYear INTEGER`, `github TEXT`, `website TEXT`)
- **Breaking:** no — existing rows giữ NULL all 5 fields.
- **Notes:** FR-11.8 amend — EditProfileDrawer FE đã render contact section sẵn (T-376) nhưng BE chưa accept → PATCH fail 400 forbidNonWhitelisted. Migration align FE-BE end-to-end. Non-breaking, no backfill. Applied cả main DB :5434 + test DB :5433.
- **Task:** T-421
- **Rollback:** `prisma migrate resolve --rolled-back 20260530180000_add_user_contact_fields` + `ALTER TABLE "User" DROP COLUMN "name", DROP COLUMN "location", DROP COLUMN "bornYear", DROP COLUMN "github", DROP COLUMN "website";`

### 20260530155000_add_user_avatar_public_id

- **Created:** 2026-05-30
- **Type:** schema (additive — non-breaking)
- **Entities affected:** `User` (+1 column `avatarPublicId String?` nullable)
- **Breaking:** no — existing rows giữ `avatarPublicId=NULL`. Field này chỉ populate khi user upload avatar lần đầu (FR-11.7).
- **Notes:** FR-11.7 avatar upload. Cloudinary publicId track cho cleanup khi user replace/remove avatar (folder `avatars/`). `avatarUrl` đã có sẵn (v0.2.0) chỉ store URL display; cần thêm publicId vì Cloudinary `destroy()` API yêu cầu publicId, không phải URL. Migration tạo manual (không qua `prisma migrate dev` non-interactive) — chỉ 1 ADD COLUMN clean, không drift Reaction legacy như migration trước.
- **Task:** T-410
- **Rollback:** `prisma migrate resolve --rolled-back 20260530155000_add_user_avatar_public_id` + `ALTER TABLE "User" DROP COLUMN "avatarPublicId";`

### 20260526000000_add_post_status_enum

- **Created:** 2026-05-26
- **Type:** schema
- **Entities affected:** `Post` (new `status PostStatus @default(PUBLISHED)` field + `@@index([status])`); new enum `PostStatus (PUBLISHED/DRAFT/ARCHIVED)`
- **Breaking:** no — default `PUBLISHED` preserves all existing rows behavior in public feed
- **Notes:** Enables admin draft/archive workflows (T-372 ManagePostsPage). `PostsService.list()` now explicitly filters `status=PUBLISHED` (was implicit — all posts). `adminList()` new method returns all statuses. PATCH `/admin/posts/:id` accepts `status` field.
- **Task:** T-320
- **Rollback:** `prisma migrate resolve --rolled-back 20260526000000_add_post_status_enum` + `ALTER TABLE "Post" DROP COLUMN status; DROP TYPE "PostStatus";`

### 20260525033356_add_comment_parent_id_for_reply

- **Created:** 2026-05-25
- **Type:** schema (additive — non-breaking)
- **Entities affected:** `Comment` (+2 columns `parentId String?`, `replyTo Json?`, +1 self-FK CASCADE, +1 index `[parentId]`)
- **Breaking:** no — existing rows giữ `parentId=NULL, replyTo=NULL`.
- **Notes:** FR-03.6 reply-to-comment MVP. Self-relation `Comment.parentId → Comment.id` ON DELETE CASCADE. `replyTo` JSONB denormalized với shape `{ username, isAnon }` để FE render `@parentuser` không cần JOIN. Depth-1 only validation enforced ở service layer (`INVALID_PARENT_DEPTH` 400 nếu `parent.parentId !== null`). Cross-post validation (`INVALID_PARENT_POST`). Auto-gen migration SQL bị stale Reaction constraint rename (legacy artifact từ migration trước) — manually cleaned, chỉ giữ Comment changes.
- **Task:** T-343
- **Rollback:** `prisma migrate resolve --rolled-back 20260525033356_add_comment_parent_id_for_reply` + manual SQL `ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey"; DROP INDEX "Comment_parentId_idx"; ALTER TABLE "Comment" DROP COLUMN "parentId", DROP COLUMN "replyTo";`

### 20260524140000_add_notification_table

- **Created:** 2026-05-24
- **Type:** schema
- **Entities affected:** `Notification` (new), `User.receivedNotifications/sentNotifications`, `Post.notifications`; new enum `NotificationType (REACTION/COMMENT/REPLY/SHARE)`
- **Breaking:** no (additive only)
- **Notes:** `targetType` and `targetId` are soft-polymorphic (no declared FK) to support both POST and COMMENT targets. `postId` FK uses `SET NULL` so notification survives post deletion (postId becomes null). FK Cascade on `userId` and `actorId` (deleted user removes their notifications). 2 indexes: `[userId, createdAt]` for list query, `[userId, read]` for unread count.
- **Task:** T-310
- **Rollback:** `DROP TABLE "Notification"; DROP TYPE "NotificationType";`

### 20260524125935_rename_like_to_reaction_with_type

- **Created:** 2026-05-24
- **Type:** refactor + schema
- **Entities affected:** `Reaction` (renamed from `Like`), `User.reactions`, `Post.reactions`; new enum `ReactionType (LIKE/LOVE/HAHA/WOW/SAD/ANGRY)`
- **Breaking:** yes — table `"Like"` renamed to `"Reaction"`; column `"Reaction"."type" ReactionType DEFAULT LIKE` added; new index `[postId, type]`. All existing rows backfilled to type=LIKE (zero data loss).
- **Notes:** Data-preserving via `ALTER TABLE "Like" RENAME TO "Reaction"` (not DROP+CREATE). `updatedAt` column added (previously only `createdAt`). Old `LikesModule` deleted; `ReactionsModule` replaces with upsert/remove/counts/list endpoints + 410 legacy for `/posts/:id/like`.
- **Task:** T-316
- **Rollback:** `prisma migrate resolve --rolled-back 20260524125935_rename_like_to_reaction_with_type` + manual SQL `ALTER TABLE "Reaction" RENAME TO "Like"; DROP TYPE "ReactionType"; ALTER TABLE "Like" DROP COLUMN type, DROP COLUMN "updatedAt";`

### 20260517165932_init

- **Created:** 2026-05-17
- **Type:** schema
- **Entities affected:** all 14 — `User`, `Post`, `Image`, `File`, `Comment`, `Like`, `CommentLike`, `Tag`, `PostTag`, `SavedPost`, `PostView`, `AnonymousSession`, `RefreshToken` + 4 enums (`Role`, `Mood`, `FileType`, `CommentStatus`)
- **Breaking:** no (first migration)
- **Notes:** Replaces `Placeholder` model (scaffold T-004). Full schema theo `docs/DATA_MODEL.md`. Includes FK cascade rules, composite unique constraints (Like/CommentLike per user+post), composite PK (PostTag, SavedPost), indexes cho feed sort + post views dedup query.
- **Task:** T-010
- **Rollback:** `prisma migrate resolve --rolled-back 20260517165932_init` + manual SQL drop (no down migration auto-gen)
