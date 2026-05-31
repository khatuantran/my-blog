import { PrismaService } from 'nestjs-prisma';

/**
 * Truncate volatile tables + delete non-admin users.
 * Giữ test-admin row để các test khỏi re-seed.
 */
export async function resetDb(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.refreshToken.deleteMany({}),
    prisma.postView.deleteMany({}),
    prisma.commentLike.deleteMany({}),
    prisma.reaction.deleteMany({}),
    prisma.notification.deleteMany({}),
    prisma.comment.deleteMany({}),
    prisma.file.deleteMany({}),
    prisma.image.deleteMany({}),
    prisma.postTag.deleteMany({}),
    prisma.savedPost.deleteMany({}),
    prisma.activityLog.deleteMany({}),
    prisma.interactionLog.deleteMany({}),
    prisma.post.deleteMany({}),
    prisma.tag.deleteMany({}),
    prisma.anonymousSession.deleteMany({}),
    prisma.user.deleteMany({ where: { username: { not: 'test-admin' } } }),
  ]);
}
