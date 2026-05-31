// Dev seed — admin user + sample data.
// - 3 bài mẫu (HTML, theo engine TipTap) chỉ tạo khi DB chưa có post nào.
// - 1 bài INTRO chi tiết giới thiệu app cho bạn bè: LUÔN được đảm bảo tồn tại
//   (idempotent qua marker ở đầu content) + tương tác mẫu (comment/reply/reaction).
// Run: `pnpm --filter api db:seed`
import { PrismaClient, Mood, ReactionType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_COST = 10;

// Nhận diện bài intro qua chuỗi tiêu đề (idempotent). KHÔNG đặt HTML comment ở ĐẦU
// content: PostContent dùng heuristic /^\s*<(p|h1..)/ để quyết định render HTML —
// comment ở đầu khiến content bị coi là plaintext → render ra raw HTML.
// => content PHẢI bắt đầu bằng tag thật (<h1>).
const INTRO_TITLE = '<h1>Chào mừng đến kha.blog';

// Bài intro chi tiết — content là HTML (render qua PostContent/dangerouslySetInnerHTML).
const INTRO_CONTENT = `<h1>Chào mừng đến kha.blog 👋</h1>
<p>Đây là <strong>blog cá nhân</strong> mình tự tay code từ đầu — giao diện kiểu <mark>terminal / cyberpunk</mark>, nơi mình chia sẻ chuyện code, cuộc sống và mấy thứ linh tinh. Cảm ơn bạn đã ghé qua! Bài này giải thích <strong>tất cả những gì bạn có thể làm ở đây</strong> để tương tác với mình.</p>

<h2>📖 Đọc bài viết</h2>
<p>Trang chủ là <strong>feed</strong>, bài mới nhất nằm trên cùng. Bấm vào một bài để mở <strong>trang chi tiết</strong>. Trong bài có thể có:</p>
<ul>
<li><strong>Ảnh</strong> — bấm vào để phóng to (lightbox), bấm vùng tối hoặc nút × để đóng.</li>
<li><strong>File đính kèm</strong> (PDF, ảnh, tài liệu...) — bấm để tải về.</li>
<li>Bài dài sẽ tự thu gọn, bấm <code>show more</code> để xem đầy đủ.</li>
</ul>

<h2>🔥 Thả cảm xúc (reaction)</h2>
<p>Mỗi bài có nút reaction với <strong>6 loại cảm xúc</strong>: 👍 like, ❤️ love, 😂 haha, 😮 wow, 😢 sad, 😠 angry. Cứ thả thoải mái — <mark>không cần đăng nhập</mark>. Bấm lại để gỡ.</p>

<h2>💬 Bình luận &amp; trả lời</h2>
<p>Đây là cách nhanh nhất để "nói chuyện" với mình:</p>
<ul>
<li>Viết bình luận <strong>không cần tài khoản</strong> — chỉ cần nhập một cái tên (hoặc để ẩn danh).</li>
<li><strong>Trả lời</strong> (reply) vào bình luận của người khác — các reply lồng theo luồng.</li>
<li>Thả ❤️ cho bình luận bạn thấy hay.</li>
<li>Bình luận hiển thị <strong>mới nhất lên đầu</strong>; nhiều quá thì bấm <code>show more</code> để xem thêm.</li>
<li>Đã có tài khoản nhưng muốn giấu tên? Vẫn <strong>bình luận ẩn danh</strong> được (bật "post as anon").</li>
</ul>

<h2>↗️ Chia sẻ</h2>
<p>Thích bài nào thì bấm <strong>Share</strong> để đẩy thẳng lên <strong>Facebook</strong>, <strong>X (Twitter)</strong>, <strong>Telegram</strong>, hoặc <strong>copy link</strong> gửi cho người khác.</p>

<h2>🔎 Tìm &amp; lọc theo chủ đề</h2>
<ul>
<li><strong>Tìm kiếm</strong>: gõ từ khoá để tìm nhanh bài viết.</li>
<li><strong>Tag</strong>: mỗi bài gắn các thẻ như <code>#dev</code>, <code>#life</code> — bấm vào thẻ để xem mọi bài cùng chủ đề.</li>
</ul>

<h2>🔖 Nếu bạn tạo tài khoản</h2>
<p>Không bắt buộc, nhưng nếu đăng ký bạn sẽ có thêm:</p>
<ul>
<li><strong>Lưu bài</strong> (bookmark) để đọc lại sau.</li>
<li><strong>Trang cá nhân</strong> riêng + tên hiển thị, có thể đổi tên/handle.</li>
<li><strong>Activity heatmap</strong> ghi lại hoạt động của bạn theo ngày (kiểu GitHub).</li>
</ul>

<h2>⌨️ Mẹo nhỏ</h2>
<ul>
<li>Bấm <code>Ctrl / Cmd + K</code> để mở <strong>Command Palette</strong> — nhảy tới đâu cũng nhanh.</li>
<li>Mỗi bài tự đếm <strong>lượt xem</strong>.</li>
<li>Giao diện tối tông neon, xem trên điện thoại hay máy tính đều ổn.</li>
</ul>

<p>Vậy thôi! Cứ <strong>thả reaction</strong>, <strong>để lại bình luận</strong> hoặc <strong>reply</strong> — mình sẽ thấy hết. Chúc bạn vui khi khám phá 🚀</p>
<p><em>— kha</em></p>`;

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

  // ── Tags (idempotent by name) ───────────────────────────────
  const [tagDev, tagLife, tagWelcome] = await Promise.all([
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
    prisma.tag.upsert({
      where: { name: '#welcome' },
      update: {},
      create: { name: '#welcome', color: '#BB9AF7' },
    }),
  ]);
  console.log(`✓ Tags: ${tagDev.name}, ${tagLife.name}, ${tagWelcome.name}`);

  // ── Sample posts (HTML, chỉ tạo khi DB chưa có post nào) ─────
  const existing = await prisma.post.count({ where: { authorId: admin.id } });
  if (existing > 0) {
    console.log(`✓ Posts already exist (${existing}), skip sample creation`);
  } else {
    const samples = [
      {
        content:
          '<h1>Hello cyberpunk</h1><p>Bài đầu tiên trên <code>kha.blog</code>. Welcome! ⚡</p>',
        mood: Mood.EXCITED,
        tags: [tagDev.id],
      },
      {
        content: '<p>Sáng yên tĩnh, cà phê, và code. ☕</p>',
        mood: Mood.CALM,
        tags: [tagLife.id],
      },
      {
        content: '<p>Nhìn lại cả tuần — làm ra được thứ gì đó thật sự đã. 🙏</p>',
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
          postTags: { create: sample.tags.map((tagId) => ({ tagId })) },
        },
      });
      console.log(`✓ Post created: "${post.content.slice(0, 30)}…"`);
    }
  }

  // ── Bài INTRO (luôn đảm bảo tồn tại, idempotent qua marker) ──
  const existingIntro = await prisma.post.findFirst({
    where: { authorId: admin.id, content: { contains: INTRO_TITLE } },
  });

  if (existingIntro) {
    await prisma.post.update({
      where: { id: existingIntro.id },
      data: { content: INTRO_CONTENT, mood: Mood.EXCITED },
    });
    console.log(`✓ Intro post updated (id=${existingIntro.id})`);
  } else {
    const intro = await prisma.post.create({
      data: {
        content: INTRO_CONTENT,
        mood: Mood.EXCITED,
        viewCount: 137,
        authorId: admin.id,
        postTags: { create: [{ tagId: tagWelcome.id }, { tagId: tagDev.id }] },
      },
    });
    console.log(`✓ Intro post created (id=${intro.id})`);

    // Tương tác mẫu (chỉ khi tạo mới) — comment + reply của tác giả + reactions.
    const huy = await prisma.comment.create({
      data: {
        postId: intro.id,
        anonymousName: 'Huy',
        anonymousId: 'seed-anon-huy',
        content: 'Đỉnh thật sự, code một mình hết luôn hả? 🔥',
      },
    });
    await prisma.comment.create({
      data: {
        postId: intro.id,
        parentId: huy.id,
        userId: admin.id, // tác giả reply lại (đăng nhập)
        content: 'Cảm ơn nha! Ừ mình làm full-stack solo đó 😄',
      },
    });
    await prisma.comment.createMany({
      data: [
        {
          postId: intro.id,
          anonymousName: 'Lan',
          anonymousId: 'seed-anon-lan',
          content: 'Để lại comment thử xem sao 😎 Chúc mừng ra mắt nha!',
        },
        {
          postId: intro.id,
          anonymousName: 'Minh',
          anonymousId: 'seed-anon-minh',
          content: 'Giao diện cyber chất quá, lưu lại đọc dần 👀',
        },
      ],
    });

    // Reaction mẫu — chỉ dùng type hợp lệ trong enum (LIKE/LOVE/HAHA/WOW/SAD/ANGRY).
    const reactions: { type: ReactionType; anonymousId: string }[] = [
      { type: ReactionType.LOVE, anonymousId: 'seed-rx-love' },
      { type: ReactionType.LIKE, anonymousId: 'seed-rx-like' },
      { type: ReactionType.HAHA, anonymousId: 'seed-rx-haha' },
      { type: ReactionType.WOW, anonymousId: 'seed-rx-wow' },
    ];
    await prisma.reaction.createMany({
      data: reactions.map((r) => ({
        type: r.type,
        anonymousId: r.anonymousId,
        postId: intro.id,
      })),
    });
    console.log(`✓ Intro interactions: 3 comments + 1 reply + ${reactions.length} reactions`);
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
