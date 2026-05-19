import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from 'nestjs-prisma';
import { Mood, Role } from '@prisma/client';
import { createTestApp } from '../_helpers/test-app';
import { resetDb } from '../_helpers/db-reset';
import { loginAs } from '../_helpers/auth';
import { makeUser } from '../_helpers/factory';

describe('Activity (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aliceCookies: string;
  let aliceId: string;
  let bobCookies: string;
  let bobId: string;
  let adminCookies: string;
  let alicePostId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
    const alice = await makeUser(prisma, { username: 'alice', role: Role.USER });
    aliceId = alice.id;
    aliceCookies = await loginAs(app, { username: alice.username, password: alice.rawPassword });

    const bob = await makeUser(prisma, { username: 'bob', role: Role.USER });
    bobId = bob.id;
    bobCookies = await loginAs(app, { username: bob.username, password: bob.rawPassword });

    adminCookies = await loginAs(app, { username: 'test-admin', password: 'test-admin-password' });

    // Alice tạo 1 post + Bob like + Bob comment → 3 activity row
    const post = await prisma.post.create({
      data: { content: 'hello world', mood: Mood.HAPPY, authorId: aliceId },
    });
    alicePostId = post.id;
    // Manual insert ActivityLog entries (vì test bypass hook qua API)
    await prisma.activityLog.create({
      data: {
        actorId: aliceId,
        type: 'POST_CREATED',
        targetType: 'POST',
        targetId: post.id,
        targetOwnerId: aliceId,
      },
    });
    await prisma.activityLog.create({
      data: {
        actorId: bobId,
        type: 'LIKE_CREATED',
        targetType: 'POST',
        targetId: post.id,
        targetOwnerId: aliceId,
      },
    });
    await prisma.activityLog.create({
      data: {
        actorId: bobId,
        type: 'COMMENT_CREATED',
        targetType: 'POST',
        targetId: post.id,
        targetOwnerId: aliceId,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/:id/activity', () => {
    it('401 khi anonymous (no cookie)', async () => {
      await request(app.getHttpServer()).get(`/users/${aliceId}/activity`).expect(401);
    });

    it('403 khi viewer khác user + không phải admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${aliceId}/activity`)
        .set('Cookie', bobCookies)
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('200 self xem activity own — 3 row (1 OUTGOING + 2 INCOMING)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${aliceId}/activity`)
        .set('Cookie', aliceCookies)
        .expect(200);
      expect(res.body.data.total).toBe(3);
      const directions = res.body.data.items.map((i: { direction: string }) => i.direction).sort();
      expect(directions).toEqual(['INCOMING', 'INCOMING', 'OUTGOING']);
      const snippet = res.body.data.items.find(
        (i: { type: string; target: { snippet: string } }) => i.type === 'POST_CREATED',
      )?.target.snippet;
      expect(snippet).toBe('hello world');
    });

    it('200 admin override xem activity của user khác', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${aliceId}/activity`)
        .set('Cookie', adminCookies)
        .expect(200);
      expect(res.body.data.total).toBe(3);
    });

    it('404 khi user id không tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/nonexistent-id/activity`)
        .set('Cookie', adminCookies)
        .expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('pagination — page=2 limit=2 returns 1 row còn lại', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${aliceId}/activity?page=2&limit=2`)
        .set('Cookie', aliceCookies)
        .expect(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.page).toBe(2);
      expect(res.body.data.total).toBe(3);
    });

    it('hook log POST_CREATED khi tạo post qua API', async () => {
      // Admin chỉ làm post (PostsController require ADMIN role)
      const adminMe = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', adminCookies)
        .expect(200);
      const adminId = adminMe.body.data.id;

      const before = await prisma.activityLog.count({ where: { actorId: adminId } });
      await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', adminCookies)
        .send({ content: 'new post', mood: 'EXCITED', tags: [] })
        .expect(201);
      const after = await prisma.activityLog.count({ where: { actorId: adminId } });
      expect(after - before).toBe(1);

      const row = await prisma.activityLog.findFirst({
        where: { actorId: adminId },
        orderBy: { createdAt: 'desc' },
      });
      expect(row?.type).toBe('POST_CREATED');
      expect(row?.targetOwnerId).toBe(adminId);
    });

    it('hook log SAVE_CREATED khi user save post (not on unsave)', async () => {
      const before = await prisma.activityLog.count({
        where: { actorId: bobId, type: 'SAVE_CREATED' },
      });
      // Save
      await request(app.getHttpServer())
        .post(`/posts/${alicePostId}/save`)
        .set('Cookie', bobCookies)
        .expect(200);
      const afterSave = await prisma.activityLog.count({
        where: { actorId: bobId, type: 'SAVE_CREATED' },
      });
      expect(afterSave - before).toBe(1);

      // Unsave — count không tăng
      await request(app.getHttpServer())
        .post(`/posts/${alicePostId}/save`)
        .set('Cookie', bobCookies)
        .expect(200);
      const afterUnsave = await prisma.activityLog.count({
        where: { actorId: bobId, type: 'SAVE_CREATED' },
      });
      expect(afterUnsave).toBe(afterSave);
    });
  });
});
