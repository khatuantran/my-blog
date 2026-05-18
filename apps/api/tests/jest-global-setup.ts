import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

/**
 * Pre-suite: ensure migrations applied + seed admin.
 * Container postgres-test phải up (docker compose up -d) trước khi chạy test.
 */
export default async function globalSetup(): Promise<void> {
  if (!process.env.DATABASE_URL?.includes(':5433')) {
    throw new Error('Test DATABASE_URL phải trỏ postgres-test :5433. Set .env.test.');
  }

  // Migrate idempotent
  execSync('prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });

  // Seed test admin
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash('test-admin-password', 4);
  await prisma.user.upsert({
    where: { username: 'test-admin' },
    update: { passwordHash, role: 'ADMIN' },
    create: { username: 'test-admin', passwordHash, role: 'ADMIN' },
  });
  await prisma.$disconnect();
}
