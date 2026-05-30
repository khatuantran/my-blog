-- T-410 FR-11.7 — Avatar upload: track Cloudinary publicId để cleanup khi replace/remove

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarPublicId" TEXT;
