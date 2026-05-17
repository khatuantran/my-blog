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

### 20260517165932_init

- **Created:** 2026-05-17
- **Type:** schema
- **Entities affected:** all 14 — `User`, `Post`, `Image`, `File`, `Comment`, `Like`, `CommentLike`, `Tag`, `PostTag`, `SavedPost`, `PostView`, `AnonymousSession`, `RefreshToken` + 4 enums (`Role`, `Mood`, `FileType`, `CommentStatus`)
- **Breaking:** no (first migration)
- **Notes:** Replaces `Placeholder` model (scaffold T-004). Full schema theo `docs/DATA_MODEL.md`. Includes FK cascade rules, composite unique constraints (Like/CommentLike per user+post), composite PK (PostTag, SavedPost), indexes cho feed sort + post views dedup query.
- **Task:** T-010
- **Rollback:** `prisma migrate resolve --rolled-back 20260517165932_init` + manual SQL drop (no down migration auto-gen)
