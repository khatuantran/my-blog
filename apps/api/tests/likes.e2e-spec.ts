import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { CommentStatus, Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makeComment, makePost, makeUser } from './_helpers/factory';

describe('Likes (e2e)', () => {
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

  describe('POST /posts/:id/like', () => {
    it('200 anon: liked=true count=1 → toggle off liked=false count=0', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200); // prime anon_id cookie
      const res1 = await agent.post(`/posts/${post.id}/like`).expect(200);
      expect(res1.body.data).toEqual({ liked: true, count: 1 });
      const res2 = await agent.post(`/posts/${post.id}/like`).expect(200);
      expect(res2.body.data).toEqual({ liked: false, count: 0 });
    });

    it('200 auth user: track theo userId (Like.userId set, anonymousId null)', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const res = await request(app.getHttpServer())
        .post(`/posts/${post.id}/like`)
        .set('Cookie', userCookies)
        .expect(200);
      expect(res.body.data.liked).toBe(true);
      const like = await prisma.like.findFirst({ where: { postId: post.id } });
      expect(like!.userId).toBe(userId);
      expect(like!.anonymousId).toBeNull();
    });

    it('200 hai anon khác nhau → count=2', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const a1 = request.agent(app.getHttpServer());
      const a2 = request.agent(app.getHttpServer());
      await a1.get('/posts').expect(200);
      await a2.get('/posts').expect(200);
      await a1.post(`/posts/${post.id}/like`).expect(200);
      const res = await a2.post(`/posts/${post.id}/like`).expect(200);
      expect(res.body.data.count).toBe(2);
    });

    it('404 post không tồn tại', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      const res = await agent.post('/posts/cmp-unknown/like').expect(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });

    it('cascade: delete Post → Like rows xóa theo', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      await agent.post(`/posts/${post.id}/like`).expect(200);
      await prisma.post.delete({ where: { id: post.id } });
      expect(await prisma.like.findFirst({ where: { postId: post.id } })).toBeNull();
    });
  });

  describe('POST /comments/:id/like', () => {
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
      const comment = await makeComment(prisma, {
        postId: post.id,
        status: CommentStatus.PENDING,
      });
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

    it('200 auth user: track theo userId, anonymousId null', async () => {
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
