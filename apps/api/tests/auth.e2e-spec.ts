import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { extractCookies, loginAs } from './_helpers/auth';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('201 + sets 2 cookies + returns user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'newuser', password: 'newpassword123' })
        .expect(201);

      expect(res.body.data.username).toBe('newuser');
      expect(res.body.data.role).toBe('USER');
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('409 USERNAME_TAKEN nếu duplicate', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'dup', password: 'password123' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'dup', password: 'password123' })
        .expect(409);
      expect(res.body.error.code).toBe('USERNAME_TAKEN');
    });

    it('400 nếu password ngắn', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'shortpw', password: 'short' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('200 + cookies với admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test-admin', password: 'test-admin-password' })
        .expect(200);
      expect(res.body.data.role).toBe('ADMIN');
      expect((res.headers['set-cookie'] as unknown as string[]).length).toBeGreaterThanOrEqual(2);
    });

    it('401 INVALID_CREDENTIALS với password sai', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test-admin', password: 'wrong' })
        .expect(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /auth/me', () => {
    it('200 với valid cookie', async () => {
      const cookies = await loginAs(app, {
        username: 'test-admin',
        password: 'test-admin-password',
      });
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies)
        .expect(200);
      expect(res.body.data.username).toBe('test-admin');
    });

    it('401 không có cookie', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('POST /auth/refresh + logout', () => {
    it('refresh rotate trả cookies mới, sau logout thì 401 REFRESH_REVOKED', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test-admin', password: 'test-admin-password' })
        .expect(200);
      const cookies = extractCookies(loginRes.headers['set-cookie'] as unknown as string[]);

      // Refresh → new cookies
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);
      const newCookies = extractCookies(refreshRes.headers['set-cookie'] as unknown as string[]);
      expect(newCookies).not.toBe(cookies);

      // Logout với cookies mới
      await request(app.getHttpServer()).post('/auth/logout').set('Cookie', newCookies).expect(204);

      // Retry refresh → 401 REFRESH_REVOKED
      const reuseRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', newCookies)
        .expect(401);
      expect(reuseRes.body.error.code).toBe('REFRESH_REVOKED');
    });
  });
});
