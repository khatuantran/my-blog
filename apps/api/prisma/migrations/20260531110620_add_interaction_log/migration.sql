-- CreateEnum
CREATE TYPE "InteractionAction" AS ENUM ('COMMENT', 'REPLY', 'COMMENT_LIKE', 'POST_REACTION');

-- CreateEnum
CREATE TYPE "InteractionTargetType" AS ENUM ('POST', 'COMMENT');

-- CreateTable
CREATE TABLE "InteractionLog" (
    "id" TEXT NOT NULL,
    "action" "InteractionAction" NOT NULL,
    "targetType" "InteractionTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "postId" TEXT,
    "actorUserId" TEXT,
    "actorRole" "Role",
    "anonymousId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device" TEXT,
    "acceptLang" TEXT,
    "referer" TEXT,
    "fingerprint" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InteractionLog_createdAt_idx" ON "InteractionLog"("createdAt");

-- CreateIndex
CREATE INDEX "InteractionLog_actorUserId_createdAt_idx" ON "InteractionLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionLog_anonymousId_createdAt_idx" ON "InteractionLog"("anonymousId", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionLog_fingerprint_createdAt_idx" ON "InteractionLog"("fingerprint", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionLog_postId_idx" ON "InteractionLog"("postId");

-- AddForeignKey
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
