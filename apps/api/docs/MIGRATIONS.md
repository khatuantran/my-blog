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
