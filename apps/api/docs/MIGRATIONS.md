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
