import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { CommentStatus, Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makeComment, makePost, makeUser } from './_helpers/factory';

describe('Comments replies (e2e) — FR-03.6', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userCookies: string;
  let adminCookies: string;
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

  describe('GET /comments/:id/replies', () => {
    it('regression FR-03.6: 200 list replies happy + paginated', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const parent = await makeComment(prisma, {
        postId: post.id,
        userId: adminId,
        content: 'parent',
      });
      // Create 3 replies (delay để createdAt phân biệt cho assert order)
      for (let i = 0; i < 3; i++) {
        await prisma.comment.create({
          data: {
            postId: post.id,
            userId: userId,
            content: `reply ${i}`,
            parentId: parent.id,
            status: CommentStatus.APPROVED,
          },
        });
        await new Promise((r) => setTimeout(r, 2));
      }
      const res = await request(app.getHttpServer())
        .get(`/comments/${parent.id}/replies`)
        .expect(200);
      expect(res.body.data.items).toHaveLength(3);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(20);
      // FR-03.7: replies mới→cũ → 'reply 2' (mới nhất) ở đầu.
      expect(res.body.data.items[0].content).toBe('reply 2');
    });

    it('regression FR-03.6: pagination respects limit + page params', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const parent = await makeComment(prisma, { postId: post.id, userId: adminId });
      for (let i = 0; i < 5; i++) {
        await prisma.comment.create({
          data: {
            postId: post.id,
            userId: userId,
            content: `r${i}`,
            parentId: parent.id,
            status: CommentStatus.APPROVED,
          },
        });
        await new Promise((r) => setTimeout(r, 2));
      }
      const res = await request(app.getHttpServer())
        .get(`/comments/${parent.id}/replies?page=2&limit=2`)
        .expect(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.total).toBe(5);
      expect(res.body.data.page).toBe(2);
      expect(res.body.data.limit).toBe(2);
      expect(res.body.data.items[0].content).toBe('r2');
    });

    it('regression FR-03.6: 404 nếu parent comment không tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .get('/comments/nope-id-xxx/replies')
        .expect(404);
      expect(res.body.error.code).toBe('COMMENT_NOT_FOUND');
    });

    it('regression FR-03.6: role-aware status filter — USER chỉ APPROVED, admin tất cả', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const parent = await makeComment(prisma, { postId: post.id, userId: adminId });
      await prisma.comment.create({
        data: {
          postId: post.id,
          userId: userId,
          content: 'approved',
          parentId: parent.id,
          status: CommentStatus.APPROVED,
        },
      });
      await prisma.comment.create({
        data: {
          postId: post.id,
          userId: userId,
          content: 'pending',
          parentId: parent.id,
          status: CommentStatus.PENDING,
        },
      });

      // Anonymous + USER chỉ thấy APPROVED
      const resAnon = await request(app.getHttpServer())
        .get(`/comments/${parent.id}/replies`)
        .expect(200);
      expect(resAnon.body.data.items).toHaveLength(1);
      expect(resAnon.body.data.items[0].content).toBe('approved');

      // Admin thấy cả 2
      const resAdmin = await request(app.getHttpServer())
        .get(`/comments/${parent.id}/replies`)
        .set('Cookie', adminCookies)
        .expect(200);
      expect(resAdmin.body.data.items).toHaveLength(2);
    });
  });

  describe('GET /posts/:id/comments — top-level only + replies preview', () => {
    it('regression FR-03.6: filter parentId IS NULL + include replies (max 3) + replyCount', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const parent = await makeComment(prisma, {
        postId: post.id,
        userId: adminId,
        content: 'top-level',
      });
      // 5 replies — only 3 preview included
      for (let i = 0; i < 5; i++) {
        await prisma.comment.create({
          data: {
            postId: post.id,
            userId: userId,
            content: `reply ${i}`,
            parentId: parent.id,
            status: CommentStatus.APPROVED,
          },
        });
      }
      const res = await request(app.getHttpServer())
        .get(`/posts/${post.id}/comments`)
        .set('Cookie', userCookies)
        .expect(200);
      expect(res.body.data.items).toHaveLength(1); // top-level only
      expect(res.body.data.items[0].content).toBe('top-level');
      expect(res.body.data.items[0].replies).toHaveLength(3); // max 3 preview
      expect(res.body.data.items[0].replyCount).toBe(5); // total count
    });
  });
});
