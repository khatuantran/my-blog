import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { CommentStatus, ReactionType, Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makeComment, makePost, makeUser } from './_helpers/factory';

describe('Reactions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /posts/:id/reactions', () => {
    it('200 auth user: upsert LIKE → returns type + totalCounts + topThree', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const res = await request(app.getHttpServer())
        .post(`/posts/${post.id}/reactions`)
        .set('Cookie', userCookies)
        .send({ type: 'LIKE' })
        .expect(200);
      expect(res.body.data.type).toBe('LIKE');
      expect(res.body.data.totalCounts).toHaveProperty('LIKE', 1);
      expect(Array.isArray(res.body.data.topThree)).toBe(true);
      const reaction = await prisma.reaction.findFirst({ where: { postId: post.id } });
      expect(reaction!.userId).toBe(userId);
      expect(reaction!.type).toBe(ReactionType.LIKE);
    });

    it('200 anon user: primes session + reacts', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200); // prime anon_id cookie
      const res = await agent
        .post(`/posts/${post.id}/reactions`)
        .send({ type: 'LOVE' })
        .expect(200);
      expect(res.body.data.type).toBe('LOVE');
      expect(res.body.data.totalCounts.LOVE).toBe(1);
    });

    it('200 change-type LIKE → HAHA: reaction updated in DB', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await request(app.getHttpServer())
        .post(`/posts/${post.id}/reactions`)
        .set('Cookie', userCookies)
        .send({ type: 'LIKE' })
        .expect(200);
      const res = await request(app.getHttpServer())
        .post(`/posts/${post.id}/reactions`)
        .set('Cookie', userCookies)
        .send({ type: 'HAHA' })
        .expect(200);
      expect(res.body.data.type).toBe('HAHA');
      const reaction = await prisma.reaction.findFirst({ where: { postId: post.id, userId } });
      expect(reaction!.type).toBe(ReactionType.HAHA);
      // only 1 row per user (upsert, not duplicate)
      const count = await prisma.reaction.count({ where: { postId: post.id } });
      expect(count).toBe(1);
    });

    it('404 post không tồn tại', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      const res = await agent
        .post('/posts/cmp-unknown/reactions')
        .send({ type: 'LIKE' })
        .expect(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });

    it('400 invalid reaction type', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      await agent.post(`/posts/${post.id}/reactions`).send({ type: 'INVALID' }).expect(400);
    });
  });

  describe('DELETE /posts/:id/reactions', () => {
    it('204 removes existing reaction', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await request(app.getHttpServer())
        .post(`/posts/${post.id}/reactions`)
        .set('Cookie', userCookies)
        .send({ type: 'LIKE' })
        .expect(200);
      await request(app.getHttpServer())
        .delete(`/posts/${post.id}/reactions`)
        .set('Cookie', userCookies)
        .expect(204);
      const reaction = await prisma.reaction.findFirst({ where: { postId: post.id, userId } });
      expect(reaction).toBeNull();
    });

    it('404 chưa react thì không thể delete', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await request(app.getHttpServer())
        .delete(`/posts/${post.id}/reactions`)
        .set('Cookie', userCookies)
        .expect(404);
    });
  });

  describe('GET /posts/:id/reactions/counts', () => {
    it('200 returns 6-type totalCounts + topThree + total + myReaction', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await request(app.getHttpServer())
        .post(`/posts/${post.id}/reactions`)
        .set('Cookie', userCookies)
        .send({ type: 'LOVE' })
        .expect(200);
      const res = await request(app.getHttpServer())
        .get(`/posts/${post.id}/reactions/counts`)
        .set('Cookie', userCookies)
        .expect(200);
      const { data } = res.body;
      expect(data.total).toBe(1);
      expect(data.totalCounts).toHaveProperty('LOVE', 1);
      expect(data.totalCounts).toHaveProperty('LIKE', 0);
      expect(data.topThree).toContain('LOVE');
      expect(data.myReaction).toBe('LOVE');
    });

    it('404 post không tồn tại', async () => {
      await request(app.getHttpServer()).get('/posts/cmp-unknown/reactions/counts').expect(404);
    });
  });

  describe('GET /posts/:id/reactions', () => {
    it('200 paginated list với type filter', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await request(app.getHttpServer())
        .post(`/posts/${post.id}/reactions`)
        .set('Cookie', userCookies)
        .send({ type: 'LIKE' })
        .expect(200);
      const res = await request(app.getHttpServer())
        .get(`/posts/${post.id}/reactions?type=LIKE`)
        .expect(200);
      const { data } = res.body;
      expect(data.total).toBe(1);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].type).toBe('LIKE');
      expect(data.page).toBe(1);
    });
  });

  describe('POST /posts/:id/like (legacy → 410)', () => {
    it('410 Gone với message', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      const res = await agent.post(`/posts/${post.id}/like`).expect(410);
      expect(res.body.data.message).toMatch(/reactions/);
    });
  });

  describe('POST /comments/:id/like (binary, unchanged)', () => {
    it('200 APPROVED comment: toggle on/off', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const comment = await makeComment(prisma, { postId: post.id });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      const res1 = await agent.post(`/comments/${comment.id}/like`).expect(200);
      expect(res1.body.data).toEqual({ liked: true, count: 1 });
      const res2 = await agent.post(`/comments/${comment.id}/like`).expect(200);
      expect(res2.body.data).toEqual({ liked: false, count: 0 });
    });

    it('404 comment PENDING (ẩn)', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const comment = await makeComment(prisma, { postId: post.id, status: CommentStatus.PENDING });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      const res = await agent.post(`/comments/${comment.id}/like`).expect(404);
      expect(res.body.error.code).toBe('COMMENT_NOT_FOUND');
    });

    it('404 comment REJECTED (ẩn)', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const comment = await makeComment(prisma, {
        postId: post.id,
        status: CommentStatus.REJECTED,
      });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      await agent.post(`/comments/${comment.id}/like`).expect(404);
    });

    it('404 comment không tồn tại', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      await agent.post('/comments/cmp-unknown/like').expect(404);
    });

    it('200 auth user: track theo userId', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const comment = await makeComment(prisma, { postId: post.id });
      await request(app.getHttpServer())
        .post(`/comments/${comment.id}/like`)
        .set('Cookie', userCookies)
        .expect(200);
      const cl = await prisma.commentLike.findFirst({ where: { commentId: comment.id } });
      expect(cl!.userId).toBe(userId);
      expect(cl!.anonymousId).toBeNull();
    });
  });
});
