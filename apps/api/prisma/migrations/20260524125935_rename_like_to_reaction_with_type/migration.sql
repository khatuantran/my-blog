-- Data-preserving migration: rename Like → Reaction + add type field + enum ReactionType
-- Existing rows backfilled to LIKE via DEFAULT clause (data preserve).
-- T-316, FR-16 Multi-Reaction System.

-- 1. Create ReactionType enum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY');

-- 2. Rename table (preserves all rows + FK constraints cascade)
ALTER TABLE "Like" RENAME TO "Reaction";

-- 3. Add new columns (type defaults to LIKE for existing rows, updatedAt to now)
ALTER TABLE "Reaction" ADD COLUMN "type" "ReactionType" NOT NULL DEFAULT 'LIKE';
ALTER TABLE "Reaction" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 4. Rename indexes (postgres auto-renames table refs but index names don't change on table rename)
ALTER INDEX IF EXISTS "Like_postId_userId_key" RENAME TO "Reaction_postId_userId_key";
ALTER INDEX IF EXISTS "Like_postId_anonymousId_key" RENAME TO "Reaction_postId_anonymousId_key";
ALTER INDEX IF EXISTS "Like_postId_idx" RENAME TO "Reaction_postId_idx";

-- 5. Add new index on (postId, type)
CREATE INDEX "Reaction_postId_type_idx" ON "Reaction"("postId", "type");
