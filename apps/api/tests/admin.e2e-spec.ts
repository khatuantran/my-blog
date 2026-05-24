import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Mood, Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makeComment, makePost, makeUser } from './_helpers/factory';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookies: string;
  let userCookies: string;
  let adminId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
    const alice = await makeUser(prisma, { username: 'alice', role: Role.USER });
    userCookies = await loginAs(app, { username: alice.username, password: alice.rawPassword });
    const admin = await prisma.user.findUnique({ where: { username: 'test-admin' } });
    adminId = admin!.id;
    adminCookies = await loginAs(app, { username: 'test-admin', password: 'test-admin-password' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/stats', () => {
    it('401 no cookie', async () => {
      await request(app.getHttpServer()).get('/admin/stats').expect(401);
    });

    it('403 USER role', async () => {
      await request(app.getHttpServer()).get('/admin/stats').set('Cookie', userCookies).expect(403);
    });

    it('200 admin: response shape có 4 metrics với sparkline length 12', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await prisma.reaction.create({ data: { postId: post.id, anonymousId: '0x1' } });
      await makeComment(prisma, { postId: post.id });
      await prisma.postView.create({ data: { postId: post.id, anonymousId: '0x1' } });

      const res = await request(app.getHttpServer())
        .get('/admin/stats')
        .set('Cookie', adminCookies)
        .expect(200);

      for (const metric of ['posts', 'reactions', 'comments', 'views']) {
        expect(res.body.data[metric]).toBeDefined();
        expect(res.body.data[metric].total).toBeGreaterThanOrEqual(1);
        expect(res.body.data[metric].sparkline).toHaveLength(12);
        expect(typeof res.body.data[metric].deltaToday).toBe('number');
      }
    });
  });

  describe('GET /admin/moods', () => {
    it('401 no cookie', async () => {
      await request(app.getHttpServer()).get('/admin/moods').expect(401);
    });

    it('403 USER role', async () => {
      await request(app.getHttpServer()).get('/admin/moods').set('Cookie', userCookies).expect(403);
    });

    it('200 admin: 7 moods zero-filled, 2 HAPPY + 1 SAD count đúng', async () => {
      await makePost(prisma, { authorId: adminId, mood: Mood.HAPPY });
      await makePost(prisma, { authorId: adminId, mood: Mood.HAPPY });
      await makePost(prisma, { authorId: adminId, mood: Mood.SAD });

      const res = await request(app.getHttpServer())
        .get('/admin/moods')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(res.body.data.items).toHaveLength(7);
      const byMood = Object.fromEntries(
        res.body.data.items.map((i: { mood: string; count: number }) => [i.mood, i.count]),
      );
      expect(byMood.HAPPY).toBe(2);
      expect(byMood.SAD).toBe(1);
      expect(byMood.EXCITED).toBe(0);
      expect(byMood.CALM).toBe(0);
      expect(byMood.THOUGHTFUL).toBe(0);
      expect(byMood.GRATEFUL).toBe(0);
      expect(byMood.ANGRY).toBe(0);
    });
  });

  describe('GET /admin/heatmap', () => {
    it('401 no cookie', async () => {
      await request(app.getHttpServer()).get('/admin/heatmap').expect(401);
    });

    it('403 USER role', async () => {
      await request(app.getHttpServer())
        .get('/admin/heatmap')
        .set('Cookie', userCookies)
        .expect(403);
    });

    it('200 admin: 28 entries, today count phản ánh số post mới', async () => {
      await makePost(prisma, { authorId: adminId });
      await makePost(prisma, { authorId: adminId });

      const res = await request(app.getHttpServer())
        .get('/admin/heatmap')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(res.body.data.days).toHaveLength(28);
      const last = res.body.data.days[27];
      expect(last.count).toBe(2);
      expect(last.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('GET /admin/comments', () => {
    it('401 no cookie', async () => {
      await request(app.getHttpServer()).get('/admin/comments').expect(401);
    });

    it('403 USER role', async () => {
      await request(app.getHttpServer())
        .get('/admin/comments')
        .set('Cookie', userCookies)
        .expect(403);
    });

    it('200 admin default status=PENDING + truncate post.content 80 chars', async () => {
      const post = await makePost(prisma, {
        authorId: adminId,
        content: 'P'.repeat(120),
      });
      await makeComment(prisma, {
        postId: post.id,
        anonymousId: 'a1',
        content: 'pending one',
        status: 'PENDING',
      });
      await makeComment(prisma, {
        postId: post.id,
        anonymousId: 'a2',
        content: 'approved one',
        status: 'APPROVED',
      });

      const res = await request(app.getHttpServer())
        .get('/admin/comments')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].content).toBe('pending one');
      expect(res.body.data.items[0].post.content).toHaveLength(80);
      expect(res.body.data.total).toBe(1);
    });

    it('200 admin filter status=APPROVED', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await makeComment(prisma, {
        postId: post.id,
        anonymousId: 'a1',
        content: 'pending',
        status: 'PENDING',
      });
      await makeComment(prisma, {
        postId: post.id,
        anonymousId: 'a2',
        content: 'approved',
        status: 'APPROVED',
      });

      const res = await request(app.getHttpServer())
        .get('/admin/comments?status=APPROVED')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].status).toBe('APPROVED');
    });

    it('400 status invalid value', async () => {
      await request(app.getHttpServer())
        .get('/admin/comments?status=BOGUS')
        .set('Cookie', adminCookies)
        .expect(400);
    });
  });
});
