-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('POST_CREATED', 'COMMENT_CREATED', 'LIKE_CREATED', 'SAVE_CREATED');

-- CreateEnum
CREATE TYPE "ActivityTargetType" AS ENUM ('POST', 'COMMENT');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "targetType" "ActivityTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetOwnerId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_createdAt_idx" ON "ActivityLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_targetOwnerId_createdAt_idx" ON "ActivityLog"("targetOwnerId", "createdAt");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_targetOwnerId_fkey" FOREIGN KEY ("targetOwnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
