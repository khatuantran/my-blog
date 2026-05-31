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
  let cloudinaryMock: { signUpload: jest.Mock; destroyMany: jest.Mock };
  let adminCookies: string;
  let userCookies: string;
  let userId: string;
  let adminId: string;

  beforeAll(async () => {
    ({ app, prisma, cloudinaryMock } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
    cloudinaryMock.signUpload.mockClear();
    cloudinaryMock.destroyMany.mockClear();
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

    it('FR-11.9: 200 self đổi username (handle)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ username: 'alice-new-handle' })
        .expect(200);
      expect(res.body.data.username).toBe('alice-new-handle');
    });

    it('FR-11.9: 409 username trùng người khác', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ username: 'test-admin' })
        .expect(409);
      expect(res.body.error.code).toBe('DUPLICATE_USERNAME');
    });

    it('FR-11.9: 400 username sai format', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ username: 'a b!' })
        .expect(400);
    });

    it('200 admin update other', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', adminCookies)
        .send({ email: 'alice-admin-set@e.com' })
        .expect(200);
      expect(res.body.data.email).toBe('alice-admin-set@e.com');
    });

    it('200 self update title + bio + skills', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({
          title: 'Full-stack Dev',
          bio: 'Curious about everything',
          skills: [
            { name: 'TypeScript', color: '#7DCFFF' },
            { name: 'React', color: '#00FFE5' },
          ],
        })
        .expect(200);
      expect(res.body.data.title).toBe('Full-stack Dev');
      expect(res.body.data.bio).toBe('Curious about everything');
      expect(res.body.data.skills).toHaveLength(2);
    });

    it('400 skills > 20 items rejected', async () => {
      const skills = Array.from({ length: 21 }, (_, i) => ({
        name: `s${i}`,
        color: '#00FFE5',
      }));
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ skills })
        .expect(400);
    });

    it('400 skill color invalid hex rejected', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ skills: [{ name: 'TS', color: 'not-a-hex' }] })
        .expect(400);
    });

    it('400 bio > 500 chars rejected', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ bio: 'x'.repeat(501) })
        .expect(400);
    });

    // FR-11.8 — Contact + identity fields propagate
    it('FR-11.8: 200 self update 5 contact fields (name/location/bornYear/github/website)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({
          name: 'Kha Tran',
          location: 'Ho Chi Minh City',
          bornYear: 1995,
          github: 'khatran',
          website: 'https://kha.dev',
        })
        .expect(200);
      expect(res.body.data.name).toBe('Kha Tran');
      expect(res.body.data.location).toBe('Ho Chi Minh City');
      expect(res.body.data.bornYear).toBe(1995);
      expect(res.body.data.github).toBe('khatran');
      expect(res.body.data.website).toBe('https://kha.dev');
    });

    it('FR-11.8: 400 bornYear non-int', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ bornYear: 'abc' })
        .expect(400);
    });

    it('FR-11.8: 400 bornYear < 1900', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ bornYear: 1899 })
        .expect(400);
    });

    it('FR-11.8: 400 github > 120 chars', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Cookie', userCookies)
        .send({ github: 'x'.repeat(121) })
        .expect(400);
    });
  });

  describe('GET /users/by-username/:username', () => {
    it('404 không tồn tại', async () => {
      await request(app.getHttpServer()).get('/users/by-username/nope-user-xyz').expect(404);
    });

    it('200 public — email hidden', async () => {
      await prisma.user.update({
        where: { id: userId },
        data: { title: 'Dev', bio: 'hello', email: 'alice@e.com' },
      });
      const res = await request(app.getHttpServer()).get('/users/by-username/alice').expect(200);
      expect(res.body.data.title).toBe('Dev');
      expect(res.body.data.bio).toBe('hello');
      expect(res.body.data.email).toBeNull();
    });
  });

  describe('GET /users/:id/stats', () => {
    it('404 user không tồn tại', async () => {
      await request(app.getHttpServer()).get('/users/non-existent/stats').expect(404);
    });

    it('200 zero stats cho user không có post', async () => {
      const res = await request(app.getHttpServer()).get(`/users/${userId}/stats`).expect(200);
      expect(res.body.data.postsCount).toBe(0);
      expect(res.body.data.likesReceived).toBe(0);
      expect(res.body.data.commentsReceived).toBe(0);
      expect(res.body.data.streak).toBe(0);
      expect(res.body.data.heatmap28d).toHaveLength(28);
      expect(res.body.data.moodBreakdown).toEqual({
        HAPPY: 0,
        EXCITED: 0,
        THOUGHTFUL: 0,
        CALM: 0,
        SAD: 0,
        GRATEFUL: 0,
        ANGRY: 0,
      });
      expect(res.body.data.tagsUsed).toEqual([]);
    });

    it('200 stats aggregate posts + likes + mood + tags', async () => {
      const post1 = await prisma.post.create({
        data: { authorId: adminId, content: 'P1', mood: 'HAPPY', viewCount: 10 },
      });
      const post2 = await prisma.post.create({
        data: { authorId: adminId, content: 'P2', mood: 'SAD', viewCount: 5 },
      });
      const tag = await prisma.tag.create({ data: { name: 'dev', color: '#00FFE5' } });
      await prisma.postTag.create({ data: { postId: post1.id, tagId: tag.id } });
      await prisma.reaction.create({ data: { postId: post1.id, anonymousId: 'a1' } });
      await prisma.comment.create({
        data: { postId: post1.id, anonymousId: 'a2', content: 'nice' },
      });

      const res = await request(app.getHttpServer()).get(`/users/${adminId}/stats`).expect(200);
      expect(res.body.data.postsCount).toBe(2);
      expect(res.body.data.likesReceived).toBe(1);
      expect(res.body.data.commentsReceived).toBe(1);
      expect(res.body.data.viewsTotal).toBe(15);
      expect(res.body.data.moodBreakdown.HAPPY).toBe(1);
      expect(res.body.data.moodBreakdown.SAD).toBe(1);
      expect(res.body.data.streak).toBe(1);
      expect(res.body.data.tagsUsed).toEqual([{ name: 'dev', color: '#00FFE5', count: 1 }]);
      // Last bucket = today
      expect(res.body.data.heatmap28d[27].count).toBe(2);
      // Drop post-test data to avoid pollution
      void post2;
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

  describe('FR-11.7 Avatar (POST /users/me/avatar/sign + PATCH/DELETE /users/me/avatar)', () => {
    it('POST sign 401 anon (no cookie)', async () => {
      await request(app.getHttpServer()).post('/users/me/avatar/sign').expect(401);
    });

    it('POST sign 200 user → CloudinaryService.signUpload called với folder=avatars + publicId=<userId>-<ts>', async () => {
      cloudinaryMock.signUpload.mockReturnValue({
        signature: 'sig123',
        timestamp: 1700000000,
        apiKey: 'apikey',
        cloudName: 'demo',
        folder: 'avatars',
        resourceType: 'image',
        publicId: `${userId}-1700000000`,
      });
      const res = await request(app.getHttpServer())
        .post('/users/me/avatar/sign')
        .set('Cookie', userCookies)
        .expect(200);
      expect(res.body.data.folder).toBe('avatars');
      expect(res.body.data.publicId).toMatch(new RegExp(`^${userId}-\\d+$`));
      expect(cloudinaryMock.signUpload).toHaveBeenCalledWith({
        folder: 'avatars',
        publicId: expect.stringMatching(new RegExp(`^${userId}-\\d+$`)),
        resourceType: 'image',
      });
    });

    it('PATCH 400 INVALID_AVATAR_PUBLIC_ID nếu publicId không prefix avatars/<userId>-', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me/avatar')
        .set('Cookie', userCookies)
        .send({
          url: 'https://res.cloudinary.com/demo/image/upload/v1/avatars/other-1.jpg',
          publicId: 'avatars/other-user-1', // wrong userId
        })
        .expect(400);
      expect(res.body.error.code).toBe('INVALID_AVATAR_PUBLIC_ID');
    });

    it('PATCH 400 nếu url không phải Cloudinary domain', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/avatar')
        .set('Cookie', userCookies)
        .send({
          url: 'https://evil.com/fake.jpg',
          publicId: `avatars/${userId}-1`,
        })
        .expect(400);
    });

    it('PATCH 200 save avatar + cleanup avatar cũ qua Cloudinary destroy', async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: 'https://res.cloudinary.com/demo/v1/old.jpg',
          avatarPublicId: `avatars/${userId}-old`,
        },
      });
      const newPublicId = `avatars/${userId}-new`;
      const newUrl = `https://res.cloudinary.com/demo/image/upload/v2/${newPublicId}.jpg`;
      const res = await request(app.getHttpServer())
        .patch('/users/me/avatar')
        .set('Cookie', userCookies)
        .send({ url: newUrl, publicId: newPublicId })
        .expect(200);
      expect(res.body.data.avatarUrl).toBe(newUrl);
      expect(res.body.data.avatarPublicId).toBe(newPublicId);
      expect(cloudinaryMock.destroyMany).toHaveBeenCalledWith([
        { publicId: `avatars/${userId}-old`, resourceType: 'image' },
      ]);
      const updated = await prisma.user.findUnique({ where: { id: userId } });
      expect(updated?.avatarPublicId).toBe(newPublicId);
    });

    it('PATCH 200 first upload — không destroy cũ (avatarPublicId NULL)', async () => {
      const newPublicId = `avatars/${userId}-first`;
      const newUrl = `https://res.cloudinary.com/demo/image/upload/v1/${newPublicId}.jpg`;
      await request(app.getHttpServer())
        .patch('/users/me/avatar')
        .set('Cookie', userCookies)
        .send({ url: newUrl, publicId: newPublicId })
        .expect(200);
      expect(cloudinaryMock.destroyMany).not.toHaveBeenCalled();
    });

    it('DELETE 200 — destroy Cloudinary + null 2 field', async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: 'https://res.cloudinary.com/demo/v1/x.jpg',
          avatarPublicId: `avatars/${userId}-x`,
        },
      });
      const res = await request(app.getHttpServer())
        .delete('/users/me/avatar')
        .set('Cookie', userCookies)
        .expect(200);
      expect(res.body.data.avatarUrl).toBeNull();
      expect(res.body.data.avatarPublicId).toBeNull();
      expect(cloudinaryMock.destroyMany).toHaveBeenCalledWith([
        { publicId: `avatars/${userId}-x`, resourceType: 'image' },
      ]);
    });

    it('DELETE 200 idempotent — call khi đã null không error + no Cloudinary call', async () => {
      const res = await request(app.getHttpServer())
        .delete('/users/me/avatar')
        .set('Cookie', userCookies)
        .expect(200);
      expect(res.body.data.avatarUrl).toBeNull();
      expect(cloudinaryMock.destroyMany).not.toHaveBeenCalled();
    });
  });
});
