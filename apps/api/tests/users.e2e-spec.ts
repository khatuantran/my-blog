import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from 'nestjs-prisma';
import { Role } from '@prisma/client';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makeUser } from './_helpers/factory';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookies: string;
  let userCookies: string;
  let userId: string;
  let adminId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
    const alice = await makeUser(prisma, { username: 'alice', role: Role.USER });
    userId = alice.id;
    userCookies = await loginAs(app, { username: alice.username, password: alice.rawPassword });

    const admin = await prisma.user.findUnique({ where: { username: 'test-admin' } });
    adminId = admin!.id;
    adminCookies = await loginAs(app, { username: 'test-admin', password: 'test-admin-password' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('403 FORBIDDEN_ROLE khi USER call', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Cookie', userCookies)
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('200 admin pagination + role filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Cookie', adminCookies)
        .expect(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /users/:id', () => {
    it('200 admin xem detail (kèm email)', async () => {
      await prisma.user.update({ where: { id: userId }, data: { email: 'alice@e.com' } });
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Cookie', adminCookies)
        .expect(200);
      expect(res.body.data.email).toBe('alice@e.com');
    });

    it('200 self xem detail (kèm email)', async () => {
      await prisma.user.update({ where: { id: userId }, data: { email: 'alice@e.com' } });
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Cookie', userCookies)
        .expect(200);
      expect(res.body.data.email).toBe('alice@e.com');
    });

    it('200 other user nhưng email ẩn', async () => {
      const bob = await makeUser(prisma, { username: 'bob', email: 'bob@e.com' });
      const bobCookies = await loginAs(app, { username: bob.username, password: bob.rawPassword });
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Cookie', bobCookies)
        .expect(200);
      expect(res.body.data.email).toBeNull();
    });
  });

  describe('PATCH /users/:id', () => {
    it('200 self update email', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ email: 'alice-new@e.com' })
        .expect(200);
      expect(res.body.data.email).toBe('alice-new@e.com');
    });

    it('403 user update other', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${adminId}`)
        .set('Cookie', userCookies)
        .send({ email: 'hack@e.com' })
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('200 admin update other', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', adminCookies)
        .send({ email: 'alice-admin-set@e.com' })
        .expect(200);
      expect(res.body.data.email).toBe('alice-admin-set@e.com');
    });
  });

  describe('POST /users/:id/ban + unban', () => {
    it('403 BAN_SELF khi admin tự ban', async () => {
      const res = await request(app.getHttpServer())
        .post(`/users/${adminId}/ban`)
        .set('Cookie', adminCookies)
        .expect(403);
      expect(res.body.error.code).toBe('BAN_SELF');
    });

    it('200 ban user → role BANNED + refresh tokens revoked', async () => {
      const res = await request(app.getHttpServer())
        .post(`/users/${userId}/ban`)
        .set('Cookie', adminCookies)
        .expect(200);
      expect(res.body.data.role).toBe('BANNED');

      const tokens = await prisma.refreshToken.findMany({ where: { userId, revokedAt: null } });
      expect(tokens.length).toBe(0);
    });

    it('200 unban → role USER', async () => {
      await request(app.getHttpServer())
        .post(`/users/${userId}/ban`)
        .set('Cookie', adminCookies)
        .expect(200);
      const res = await request(app.getHttpServer())
        .post(`/users/${userId}/unban`)
        .set('Cookie', adminCookies)
        .expect(200);
      expect(res.body.data.role).toBe('USER');
    });

    it('403 USER call ban', async () => {
      const bob = await makeUser(prisma, { username: 'bob' });
      const res = await request(app.getHttpServer())
        .post(`/users/${bob.id}/ban`)
        .set('Cookie', userCookies)
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });
  });
});
