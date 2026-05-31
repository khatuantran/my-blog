import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { CommentStatus, Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makeComment, makePost, makeUser } from './_helpers/factory';

describe('Comments (e2e)', () => {
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

  describe('GET /posts/:id/comments', () => {
    it('404 post không tồn tại', async () => {
      const res = await request(app.getHttpServer()).get('/posts/cmp-unknown/comments').expect(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });

    it('200 public/USER chỉ thấy APPROVED', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await makeComment(prisma, {
        postId: post.id,
        content: 'ok',
        status: CommentStatus.APPROVED,
      });
      await makeComment(prisma, {
        postId: post.id,
        content: 'pending',
        status: CommentStatus.PENDING,
      });
      await makeComment(prisma, {
        postId: post.id,
        content: 'rejected',
        status: CommentStatus.REJECTED,
      });

      const resAnon = await request(app.getHttpServer())
        .get(`/posts/${post.id}/comments`)
        .expect(200);
      expect(resAnon.body.data.items).toHaveLength(1);
      expect(resAnon.body.data.items[0].content).toBe('ok');

      const resUser = await request(app.getHttpServer())
        .get(`/posts/${post.id}/comments`)
        .set('Cookie', userCookies)
        .expect(200);
      expect(resUser.body.data.items).toHaveLength(1);
    });

    it('200 admin thấy tất cả status', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await makeComment(prisma, { postId: post.id, status: CommentStatus.APPROVED });
      await makeComment(prisma, { postId: post.id, status: CommentStatus.PENDING });
      await makeComment(prisma, { postId: post.id, status: CommentStatus.REJECTED });
      const res = await request(app.getHttpServer())
        .get(`/posts/${post.id}/comments`)
        .set('Cookie', adminCookies)
        .expect(200);
      expect(res.body.data.items).toHaveLength(3);
      const statuses = res.body.data.items.map((c: { status: string }) => c.status).sort();
      expect(statuses).toEqual(['APPROVED', 'PENDING', 'REJECTED']);
    });

    it('order by createdAt DESC (mới→cũ — FR-03.7)', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await makeComment(prisma, { postId: post.id, content: 'first' });
      await new Promise((r) => setTimeout(r, 5));
      await makeComment(prisma, { postId: post.id, content: 'second' });
      const res = await request(app.getHttpServer()).get(`/posts/${post.id}/comments`).expect(200);
      // Mới nhất ('second') ở đầu, cũ nhất ('first') ở cuối.
      expect(res.body.data.items[0].content).toBe('second');
      expect(res.body.data.items[1].content).toBe('first');
    });
  });

  describe('POST /posts/:id/comments', () => {
    it('404 post không tồn tại', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      await agent.post('/posts/cmp-unknown/comments').send({ content: 'x' }).expect(404);
    });

    it('400 content rỗng', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      await agent.post(`/posts/${post.id}/comments`).send({ content: '' }).expect(400);
    });

    it('201 anon: anonymousId set + anonymousName, author=null', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200); // prime anon_id
      const res = await agent
        .post(`/posts/${post.id}/comments`)
        .send({ content: 'Hay quá', anonymousName: 'Khách' })
        .expect(201);
      expect(res.body.data.author).toBeNull();
      expect(res.body.data.anonymousName).toBe('Khách');
      expect(res.body.data.status).toBe('APPROVED');
      const db = await prisma.comment.findUnique({ where: { id: res.body.data.id } });
      expect(db!.anonymousId).not.toBeNull();
      expect(db!.userId).toBeNull();
    });

    it('201 auth user (no anon): author set, userId tracked', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const res = await request(app.getHttpServer())
        .post(`/posts/${post.id}/comments`)
        .set('Cookie', userCookies)
        .send({ content: 'auth comment' })
        .expect(201);
      expect(res.body.data.author?.id).toBe(userId);
      expect(res.body.data.anonymousName).toBeNull();
      const db = await prisma.comment.findUnique({ where: { id: res.body.data.id } });
      expect(db!.userId).toBe(userId);
      expect(db!.anonymousId).toBeNull();
    });

    it('regression BUG-017: auth user + anonymousName → comment ẩn danh (author=null, userId null)', async () => {
      // Design "post as anon" toggle: authed user vẫn comment ẩn danh được khi gửi anonymousName.
      const post = await makePost(prisma, { authorId: adminId });
      const res = await request(app.getHttpServer())
        .post(`/posts/${post.id}/comments`)
        .set('Cookie', userCookies)
        .send({ content: 'as anon by authed user', anonymousName: 'GhostUser' })
        .expect(201);
      expect(res.body.data.author).toBeNull();
      expect(res.body.data.anonymousName).toBe('GhostUser');
      const db = await prisma.comment.findUnique({ where: { id: res.body.data.id } });
      expect(db!.userId).toBeNull();
    });

    it('regression FR-03.6: 201 reply with parentId → replyTo denormalized', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const parent = await makeComment(prisma, {
        postId: post.id,
        userId: adminId,
        content: 'parent',
      });
      const res = await request(app.getHttpServer())
        .post(`/posts/${post.id}/comments`)
        .set('Cookie', userCookies)
        .send({ content: 'reply', parentId: parent.id })
        .expect(201);
      expect(res.body.data.parentId).toBe(parent.id);
      expect(res.body.data.replyTo).toEqual({ username: 'test-admin', isAnon: false });
    });

    it('regression FR-03.6: 400 nested reply (depth 2) → INVALID_PARENT_DEPTH', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const parent = await makeComment(prisma, {
        postId: post.id,
        userId: adminId,
        content: 'parent',
      });
      const reply1 = await prisma.comment.create({
        data: {
          postId: post.id,
          userId: userId,
          content: 'reply1',
          parentId: parent.id,
          status: CommentStatus.APPROVED,
        },
      });
      const res = await request(app.getHttpServer())
        .post(`/posts/${post.id}/comments`)
        .set('Cookie', userCookies)
        .send({ content: 'nested', parentId: reply1.id })
        .expect(400);
      expect(res.body.error.code).toBe('INVALID_PARENT_DEPTH');
    });

    it('regression FR-03.6: DELETE parent → cascade replies', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const parent = await makeComment(prisma, {
        postId: post.id,
        userId: adminId,
        content: 'parent',
      });
      await prisma.comment.create({
        data: {
          postId: post.id,
          userId: userId,
          content: 'reply',
          parentId: parent.id,
          status: CommentStatus.APPROVED,
        },
      });
      await request(app.getHttpServer())
        .delete(`/comments/${parent.id}`)
        .set('Cookie', adminCookies)
        .expect(204);
      const remaining = await prisma.comment.findMany({ where: { postId: post.id } });
      expect(remaining).toHaveLength(0);
    });
  });

  describe('DELETE /comments/:id', () => {
    it('401 no cookie', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const c = await makeComment(prisma, { postId: post.id });
      await request(app.getHttpServer()).delete(`/comments/${c.id}`).expect(401);
    });

    it('403 USER role', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const c = await makeComment(prisma, { postId: post.id });
      await request(app.getHttpServer())
        .delete(`/comments/${c.id}`)
        .set('Cookie', userCookies)
        .expect(403);
    });

    it('204 admin + cascade CommentLike', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const c = await makeComment(prisma, { postId: post.id });
      await prisma.commentLike.create({
        data: { commentId: c.id, anonymousId: '0x1' },
      });
      await request(app.getHttpServer())
        .delete(`/comments/${c.id}`)
        .set('Cookie', adminCookies)
        .expect(204);
      expect(await prisma.comment.findUnique({ where: { id: c.id } })).toBeNull();
      expect(await prisma.commentLike.findFirst({ where: { commentId: c.id } })).toBeNull();
    });

    it('404 unknown', async () => {
      const res = await request(app.getHttpServer())
        .delete('/comments/cmp-unknown')
        .set('Cookie', adminCookies)
        .expect(404);
      expect(res.body.error.code).toBe('COMMENT_NOT_FOUND');
    });
  });

  describe('PATCH /comments/:id/status', () => {
    it('401 no cookie', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const c = await makeComment(prisma, { postId: post.id });
      await request(app.getHttpServer())
        .patch(`/comments/${c.id}/status`)
        .send({ status: 'REJECTED' })
        .expect(401);
    });

    it('403 USER role', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const c = await makeComment(prisma, { postId: post.id });
      await request(app.getHttpServer())
        .patch(`/comments/${c.id}/status`)
        .set('Cookie', userCookies)
        .send({ status: 'REJECTED' })
        .expect(403);
    });

    it('200 admin APPROVED → REJECTED', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const c = await makeComment(prisma, { postId: post.id, status: CommentStatus.APPROVED });
      const res = await request(app.getHttpServer())
        .patch(`/comments/${c.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: 'REJECTED' })
        .expect(200);
      expect(res.body.data.status).toBe('REJECTED');
    });

    it('200 admin REJECTED → APPROVED', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const c = await makeComment(prisma, { postId: post.id, status: CommentStatus.REJECTED });
      const res = await request(app.getHttpServer())
        .patch(`/comments/${c.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: 'APPROVED' })
        .expect(200);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('400 PENDING không cho phép', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const c = await makeComment(prisma, { postId: post.id });
      await request(app.getHttpServer())
        .patch(`/comments/${c.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: 'PENDING' })
        .expect(400);
    });

    it('400 status không hợp lệ', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const c = await makeComment(prisma, { postId: post.id });
      await request(app.getHttpServer())
        .patch(`/comments/${c.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: 'INVALID' })
        .expect(400);
    });

    it('404 comment không tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .patch('/comments/cmp-unknown/status')
        .set('Cookie', adminCookies)
        .send({ status: 'REJECTED' })
        .expect(404);
      expect(res.body.error.code).toBe('COMMENT_NOT_FOUND');
    });
  });
});
