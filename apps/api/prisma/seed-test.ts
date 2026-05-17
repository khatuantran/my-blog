// Test seed — admin only, KHÔNG có sample data (test setup tự tạo fixture).
// Run: `pnpm --filter api db:seed:test`
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('test-admin-password', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log('✓ Test admin seeded');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
