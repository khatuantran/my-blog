import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makePost, makeUser } from './_helpers/factory';

describe('Saved (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aliceCookies: string;
  let aliceId: string;
  let adminId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
    const alice = await makeUser(prisma, { username: 'alice', role: Role.USER });
    aliceId = alice.id;
    aliceCookies = await loginAs(app, { username: alice.username, password: alice.rawPassword });
    const admin = await prisma.user.findUnique({ where: { username: 'test-admin' } });
    adminId = admin!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /posts/:id/save', () => {
    it('401 no cookie', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await request(app.getHttpServer()).post(`/posts/${post.id}/save`).expect(401);
    });

    it('200 toggle on → off → on', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const r1 = await request(app.getHttpServer())
        .post(`/posts/${post.id}/save`)
        .set('Cookie', aliceCookies)
        .expect(200);
      expect(r1.body.data).toEqual({ saved: true });

      const r2 = await request(app.getHttpServer())
        .post(`/posts/${post.id}/save`)
        .set('Cookie', aliceCookies)
        .expect(200);
      expect(r2.body.data).toEqual({ saved: false });

      const r3 = await request(app.getHttpServer())
        .post(`/posts/${post.id}/save`)
        .set('Cookie', aliceCookies)
        .expect(200);
      expect(r3.body.data).toEqual({ saved: true });
    });

    it('404 unknown post', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts/cmp-unknown/save')
        .set('Cookie', aliceCookies)
        .expect(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });

    it('cascade: delete Post → SavedPost row xóa theo', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await request(app.getHttpServer())
        .post(`/posts/${post.id}/save`)
        .set('Cookie', aliceCookies)
        .expect(200);
      await prisma.post.delete({ where: { id: post.id } });
      expect(await prisma.savedPost.findFirst({ where: { postId: post.id } })).toBeNull();
    });
  });

  describe('GET /me/saved', () => {
    it('401 no cookie', async () => {
      await request(app.getHttpServer()).get('/me/saved').expect(401);
    });

    it('200 empty', async () => {
      const res = await request(app.getHttpServer())
        .get('/me/saved')
        .set('Cookie', aliceCookies)
        .expect(200);
      expect(res.body.data).toEqual({ items: [], total: 0, page: 1, limit: 10 });
    });

    it('200 paginated (12 posts, page=1 limit=10 → 10 items + total=12)', async () => {
      for (let i = 0; i < 12; i++) {
        const post = await makePost(prisma, { authorId: adminId, content: `post ${i}` });
        await prisma.savedPost.create({
          data: { userId: aliceId, postId: post.id, savedAt: new Date(Date.now() + i * 1000) },
        });
      }
      const res = await request(app.getHttpServer())
        .get('/me/saved?page=1&limit=10')
        .set('Cookie', aliceCookies)
        .expect(200);
      expect(res.body.data.items).toHaveLength(10);
      expect(res.body.data.total).toBe(12);
      // Order DESC: post 11 (latest savedAt) đầu tiên
      expect(res.body.data.items[0].content).toBe('post 11');
    });

    it('isolation: alice không thấy saved của user khác', async () => {
      const bob = await makeUser(prisma, { username: 'bob' });
      const post = await makePost(prisma, { authorId: adminId });
      await prisma.savedPost.create({ data: { userId: bob.id, postId: post.id } });

      const res = await request(app.getHttpServer())
        .get('/me/saved')
        .set('Cookie', aliceCookies)
        .expect(200);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });

    it('response include PostView fields + savedAt', async () => {
      const post = await makePost(prisma, { authorId: adminId, tagNames: ['dev'] });
      await prisma.savedPost.create({ data: { userId: aliceId, postId: post.id } });
      const res = await request(app.getHttpServer())
        .get('/me/saved')
        .set('Cookie', aliceCookies)
        .expect(200);
      const item = res.body.data.items[0];
      expect(item.id).toBe(post.id);
      expect(item.author.id).toBe(adminId);
      expect(item.tags[0].name).toBe('dev');
      expect(item.counts).toEqual({ reactions: 0, comments: 0 });
      expect(item.savedAt).toBeDefined();
    });
  });
});
