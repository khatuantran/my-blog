// Dev seed — admin user + minimal sample data (3 posts, 2 tags, 1 comment).
// Run: `pnpm --filter api db:seed`
import { PrismaClient, Mood } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_COST = 10;

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD env required for seed');
  }

  // ── Admin user (idempotent) ────────────────────────────────
  const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_COST);
  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      username: adminUsername,
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin user upsert: ${admin.username} (id=${admin.id})`);

  // ── Tags (2) ────────────────────────────────────────────────
  const [tagDev, tagLife] = await Promise.all([
    prisma.tag.upsert({
      where: { name: '#dev' },
      update: {},
      create: { name: '#dev', color: '#00FFE5' },
    }),
    prisma.tag.upsert({
      where: { name: '#life' },
      update: {},
      create: { name: '#life', color: '#FF6E96' },
    }),
  ]);
  console.log(`✓ Tags: ${tagDev.name}, ${tagLife.name}`);

  // ── Sample posts (3 với 3 mood khác) ────────────────────────
  // Skip nếu đã có sample (idempotent by content match — simple)
  const existing = await prisma.post.count({ where: { authorId: admin.id } });
  if (existing > 0) {
    console.log(`✓ Posts already exist (${existing}), skip sample creation`);
  } else {
    const samples = [
      {
        content: '# Hello cyberpunk\n\nFirst post on `kha.blog`. Welcome.',
        mood: Mood.EXCITED,
        tags: [tagDev.id],
      },
      {
        content: 'Quiet morning, coffee, code.',
        mood: Mood.CALM,
        tags: [tagLife.id],
      },
      {
        content: 'Reflecting on the week — building things is rewarding.',
        mood: Mood.GRATEFUL,
        tags: [tagDev.id, tagLife.id],
      },
    ];

    for (const sample of samples) {
      const post = await prisma.post.create({
        data: {
          content: sample.content,
          mood: sample.mood,
          authorId: admin.id,
          postTags: {
            create: sample.tags.map((tagId) => ({ tagId })),
          },
        },
      });
      console.log(`✓ Post created: "${post.content.slice(0, 30)}…"`);
    }

    // 1 sample comment trên post đầu tiên
    const firstPost = await prisma.post.findFirst({
      where: { authorId: admin.id },
      orderBy: { createdAt: 'asc' },
    });
    if (firstPost) {
      await prisma.comment.create({
        data: {
          postId: firstPost.id,
          anonymousName: 'Anon#42',
          anonymousId: 'seed-anon-42',
          content: 'Looks slick! ⚡',
        },
      });
      console.log(`✓ Sample comment on first post`);
    }
  }
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
