import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Mood } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { makePost } from './_helpers/factory';

describe('Search (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
    const admin = await prisma.user.findUnique({ where: { username: 'test-admin' } });
    adminId = admin!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /search', () => {
    it('200 empty q → empty result + global stats', async () => {
      await makePost(prisma, { authorId: adminId, content: 'one' });
      await makePost(prisma, { authorId: adminId, content: 'two' });
      const res = await request(app.getHttpServer()).get('/search').expect(200);
      expect(res.body.data.posts.items).toEqual([]);
      expect(res.body.data.files).toEqual([]);
      expect(res.body.data.tags).toEqual([]);
      expect(res.body.data.stats.totalPosts).toBe(2);
    });

    it('200 q="hello" → posts ILIKE match Post.content', async () => {
      await makePost(prisma, { authorId: adminId, content: 'Hello cyberpunk world' });
      await makePost(prisma, { authorId: adminId, content: 'Other text' });
      const res = await request(app.getHttpServer()).get('/search?q=hello').expect(200);
      expect(res.body.data.posts.items).toHaveLength(1);
      expect(res.body.data.posts.items[0].content).toMatch(/hello/i);
      expect(res.body.data.posts.total).toBe(1);
    });

    it('200 q="HELLO" case-insensitive', async () => {
      await makePost(prisma, { authorId: adminId, content: 'hello there' });
      const res = await request(app.getHttpServer()).get('/search?q=HELLO').expect(200);
      expect(res.body.data.posts.items).toHaveLength(1);
    });

    it('200 q với mood filter → narrow posts', async () => {
      await makePost(prisma, { authorId: adminId, content: 'sample HAPPY', mood: Mood.HAPPY });
      await makePost(prisma, { authorId: adminId, content: 'sample SAD', mood: Mood.SAD });
      const res = await request(app.getHttpServer()).get('/search?q=sample&mood=SAD').expect(200);
      expect(res.body.data.posts.items).toHaveLength(1);
      expect(res.body.data.posts.items[0].mood).toBe('SAD');
    });

    it('200 q tag substring (strip #)', async () => {
      const tag = await prisma.tag.create({ data: { name: 'cyberpunk', color: '#00FFE5' } });
      void tag;
      const res = await request(app.getHttpServer()).get('/search?q=%23cyber').expect(200);
      expect(res.body.data.tags.length).toBeGreaterThan(0);
      expect(res.body.data.tags[0].name).toBe('cyberpunk');
    });

    it('200 type=posts → only posts populated', async () => {
      await makePost(prisma, { authorId: adminId, content: 'matchterm' });
      await prisma.tag.create({ data: { name: 'matchterm-tag', color: '#x' } });
      const res = await request(app.getHttpServer())
        .get('/search?q=matchterm&type=posts')
        .expect(200);
      expect(res.body.data.posts.items.length).toBeGreaterThan(0);
      expect(res.body.data.tags).toEqual([]);
      expect(res.body.data.files).toEqual([]);
    });

    it('400 type invalid value rejected', async () => {
      await request(app.getHttpServer()).get('/search?type=bogus').expect(400);
    });

    it('400 mood invalid value rejected', async () => {
      await request(app.getHttpServer()).get('/search?q=x&mood=NOPE').expect(400);
    });

    it('stats.withImages + stats.withFiles accurate', async () => {
      const p1 = await makePost(prisma, { authorId: adminId });
      await prisma.image.create({
        data: {
          postId: p1.id,
          url: 'https://e/x.jpg',
          publicId: 'p',
          width: 1,
          height: 1,
          order: 0,
        },
      });
      const p2 = await makePost(prisma, { authorId: adminId });
      await prisma.file.create({
        data: {
          postId: p2.id,
          name: 'doc.pdf',
          type: 'PDF',
          size: 100,
          url: 'https://e/d',
          publicId: 'pf',
        },
      });
      const res = await request(app.getHttpServer()).get('/search').expect(200);
      expect(res.body.data.stats.withImages).toBe(1);
      expect(res.body.data.stats.withFiles).toBe(1);
    });
  });
});
