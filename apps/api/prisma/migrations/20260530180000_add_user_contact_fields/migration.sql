-- T-421 FR-11.8 — Contact + identity fields. EditProfileDrawer FE đã render
-- contact.links section sẵn (T-376) nhưng BE chưa accept → PATCH bị 400.
-- 5 ADD COLUMN nullable additive non-breaking.

ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "location" TEXT;
ALTER TABLE "User" ADD COLUMN "bornYear" INTEGER;
ALTER TABLE "User" ADD COLUMN "github" TEXT;
ALTER TABLE "User" ADD COLUMN "website" TEXT;
