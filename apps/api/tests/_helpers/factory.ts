import { PrismaService } from 'nestjs-prisma';
import { Mood, Role, type Post, type User } from '@prisma/client';
import bcrypt from 'bcrypt';

const TEST_PASSWORD = 'test-password-123';
const HASH_COST = 4; // fast for tests

export async function makeUser(
  prisma: PrismaService,
  opts: { username: string; role?: Role; email?: string; password?: string } = {
    username: 'user-' + Date.now(),
  },
): Promise<User & { rawPassword: string }> {
  const rawPassword = opts.password ?? TEST_PASSWORD;
  const passwordHash = await bcrypt.hash(rawPassword, HASH_COST);
  const user = await prisma.user.create({
    data: {
      username: opts.username,
      email: opts.email ?? null,
      passwordHash,
      role: opts.role ?? Role.USER,
    },
  });
  return { ...user, rawPassword };
}

export async function makePost(
  prisma: PrismaService,
  opts: {
    authorId: string;
    content?: string;
    mood?: Mood;
    tagNames?: string[];
  },
): Promise<Post> {
  const tagNames = opts.tagNames ?? [];
  const tags = await Promise.all(
    tagNames.map((name) => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })),
  );
  return prisma.post.create({
    data: {
      content: opts.content ?? 'test post content',
      mood: opts.mood ?? Mood.HAPPY,
      authorId: opts.authorId,
      postTags: { create: tags.map((t) => ({ tagId: t.id })) },
    },
  });
}

export { TEST_PASSWORD };
