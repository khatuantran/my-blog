import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { NotificationType, Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makePost, makeUser } from './_helpers/factory';

async function makeNotification(
  prisma: PrismaService,
  opts: {
    userId: string;
    actorId: string;
    postId?: string;
    type?: NotificationType;
    read?: boolean;
  },
) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      actorId: opts.actorId,
      type: opts.type ?? NotificationType.REACTION,
      targetType: 'POST',
      targetId: opts.postId ?? 'test-target-id',
      postId: opts.postId ?? null,
      read: opts.read ?? false,
    },
  });
}

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aliceCookies: string;
  let aliceId: string;
  let bobId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /notifications', () => {
    it('401 anonymous', async () => {
      await request(app.getHttpServer()).get('/notifications').expect(401);
    });

    it('200 returns items + total + unreadCount', async () => {
      const post = await makePost(prisma, { authorId: aliceId });
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, postId: post.id });
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: true });

      const res = await request(app.getHttpServer())
        .get('/notifications')
        .set('Cookie', aliceCookies)
        .expect(200);

      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.unreadCount).toBe(1);
      expect(res.body.data.items[0]).toMatchObject({
        type: 'REACTION',
        read: expect.any(Boolean),
        actor: expect.objectContaining({ username: 'bob' }),
      });
    });

    it('200 filter=unread returns only unread', async () => {
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: false });
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: true });

      const res = await request(app.getHttpServer())
        .get('/notifications?filter=unread')
        .set('Cookie', aliceCookies)
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].read).toBe(false);
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('200 returns count of unread', async () => {
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: false });
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: false });
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: true });

      const res = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Cookie', aliceCookies)
        .expect(200);

      expect(res.body.data.count).toBe(2);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('200 marks notification as read', async () => {
      const n = await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: false });

      const res = await request(app.getHttpServer())
        .patch(`/notifications/${n.id}/read`)
        .set('Cookie', aliceCookies)
        .send({ read: true })
        .expect(200);

      expect(res.body.data).toMatchObject({ id: n.id, read: true });
    });

    it('403 when accessing another user notification', async () => {
      const n = await makeNotification(prisma, { userId: bobId, actorId: aliceId });
      await request(app.getHttpServer())
        .patch(`/notifications/${n.id}/read`)
        .set('Cookie', aliceCookies)
        .send({ read: true })
        .expect(403);
    });
  });

  describe('PATCH /notifications/mark-all-read', () => {
    it('200 marks all unread as read, returns updated count', async () => {
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: false });
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: false });
      await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: true });

      const res = await request(app.getHttpServer())
        .patch('/notifications/mark-all-read')
        .set('Cookie', aliceCookies)
        .expect(200);

      expect(res.body.data.updated).toBe(2);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('204 deletes own notification', async () => {
      const n = await makeNotification(prisma, { userId: aliceId, actorId: bobId });
      await request(app.getHttpServer())
        .delete(`/notifications/${n.id}`)
        .set('Cookie', aliceCookies)
        .expect(204);

      const gone = await prisma.notification.findUnique({ where: { id: n.id } });
      expect(gone).toBeNull();
    });

    it('403 when deleting another user notification', async () => {
      const n = await makeNotification(prisma, { userId: bobId, actorId: aliceId });
      await request(app.getHttpServer())
        .delete(`/notifications/${n.id}`)
        .set('Cookie', aliceCookies)
        .expect(403);
    });
  });

  describe('DELETE /notifications/bulk', () => {
    it('200 deletes own notifications, returns deleted count', async () => {
      const n1 = await makeNotification(prisma, { userId: aliceId, actorId: bobId });
      const n2 = await makeNotification(prisma, { userId: aliceId, actorId: bobId });
      // bob's notification — should be silently skipped
      const bobNotif = await makeNotification(prisma, { userId: bobId, actorId: aliceId });

      const res = await request(app.getHttpServer())
        .delete('/notifications/bulk')
        .set('Cookie', aliceCookies)
        .send({ ids: [n1.id, n2.id, bobNotif.id] })
        .expect(200);

      expect(res.body.data.deleted).toBe(2);
    });

    it('400 when ids is empty', async () => {
      await request(app.getHttpServer())
        .delete('/notifications/bulk')
        .set('Cookie', aliceCookies)
        .send({ ids: [] })
        .expect(400);
    });
  });

  describe('PATCH /notifications/bulk-read', () => {
    it('200 marks own notifications as read, silently skips other user ids', async () => {
      const n1 = await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: false });
      const n2 = await makeNotification(prisma, { userId: aliceId, actorId: bobId, read: false });
      const bobNotif = await makeNotification(prisma, {
        userId: bobId,
        actorId: aliceId,
        read: false,
      });

      const res = await request(app.getHttpServer())
        .patch('/notifications/bulk-read')
        .set('Cookie', aliceCookies)
        .send({ ids: [n1.id, n2.id, bobNotif.id] })
        .expect(200);

      expect(res.body.data.updated).toBe(2);
      const n1Updated = await prisma.notification.findUnique({ where: { id: n1.id } });
      expect(n1Updated?.read).toBe(true);
    });

    it('400 when ids array exceeds 100', async () => {
      const ids = Array.from({ length: 101 }, () => 'fake-id');
      await request(app.getHttpServer())
        .patch('/notifications/bulk-read')
        .set('Cookie', aliceCookies)
        .send({ ids })
        .expect(400);
    });

    it('401 when anonymous', async () => {
      await request(app.getHttpServer())
        .patch('/notifications/bulk-read')
        .send({ ids: ['fake-id'] })
        .expect(401);
    });
  });

  describe('DELETE /notifications/all', () => {
    it('200 deletes all notifications of current user', async () => {
      await makeNotification(prisma, { userId: aliceId, actorId: bobId });
      await makeNotification(prisma, { userId: aliceId, actorId: bobId });
      const bobNotif = await makeNotification(prisma, { userId: bobId, actorId: aliceId });

      const res = await request(app.getHttpServer())
        .delete('/notifications/all')
        .set('Cookie', aliceCookies)
        .expect(200);

      expect(res.body.data.deleted).toBe(2);
      // bob's notification untouched
      const still = await prisma.notification.findUnique({ where: { id: bobNotif.id } });
      expect(still).not.toBeNull();
    });

    it('401 when anonymous', async () => {
      await request(app.getHttpServer()).delete('/notifications/all').expect(401);
    });
  });
});
