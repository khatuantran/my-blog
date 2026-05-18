import { PrismaService } from 'nestjs-prisma';
import { Role, type User } from '@prisma/client';
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

export { TEST_PASSWORD };
