import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { CommentStatus, Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makeComment, makePost, makeUser } from './_helpers/factory';

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// FR-18 — trace log của interaction non-admin (anon + USER). Admin KHÔNG bị log.
describe('Interaction trace log (e2e) — FR-18', () => {
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

  it('anonymous comment → log COMMENT (actor null, ip/browser/fingerprint set)', async () => {
    const post = await makePost(prisma, { authorId: adminId });
    await request(app.getHttpServer())
      .post(`/posts/${post.id}/comments`)
      .set('User-Agent', CHROME_UA)
      .send({ content: 'anon hello' })
      .expect(201);

    const logs = await prisma.interactionLog.findMany();
    expect(logs).toHaveLength(1);
    const log = logs[0];
    expect(log.action).toBe('COMMENT');
    expect(log.targetType).toBe('POST');
    expect(log.postId).toBe(post.id);
    expect(log.actorUserId).toBeNull();
    expect(log.actorRole).toBeNull();
    expect(log.anonymousId).toBeTruthy();
    expect(log.ip).toBeTruthy();
    expect(log.browser).toContain('Chrome');
    expect(log.fingerprint).toMatch(/^[a-f0-9]{16}$/);
  });

  it('anonymous reply → log REPLY với metadata.parentId', async () => {
    const post = await makePost(prisma, { authorId: adminId });
    const parent = await makeComment(prisma, {
      postId: post.id,
      content: 'parent',
      status: CommentStatus.APPROVED,
    });
    await request(app.getHttpServer())
      .post(`/posts/${post.id}/comments`)
      .send({ content: 'a reply', parentId: parent.id })
      .expect(201);

    const logs = await prisma.interactionLog.findMany({ where: { action: 'REPLY' } });
    expect(logs).toHaveLength(1);
    expect((logs[0].metadata as { parentId?: string }).parentId).toBe(parent.id);
  });

  it('USER reaction → log POST_REACTION (actorUserId + actorRole=USER + reactionType)', async () => {
    const post = await makePost(prisma, { authorId: adminId });
    await request(app.getHttpServer())
      .post(`/posts/${post.id}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'LOVE' })
      .expect(200);

    const logs = await prisma.interactionLog.findMany({ where: { action: 'POST_REACTION' } });
    expect(logs).toHaveLength(1);
    expect(logs[0].actorUserId).toBe(userId);
    expect(logs[0].actorRole).toBe(Role.USER);
    expect((logs[0].metadata as { reactionType?: string }).reactionType).toBe('LOVE');
  });

  it('USER comment-like → log COMMENT_LIKE (targetType COMMENT + postId)', async () => {
    const post = await makePost(prisma, { authorId: adminId });
    const comment = await makeComment(prisma, {
      postId: post.id,
      content: 'likeable',
      status: CommentStatus.APPROVED,
    });
    await request(app.getHttpServer())
      .post(`/comments/${comment.id}/like`)
      .set('Cookie', userCookies)
      .expect(200);

    const logs = await prisma.interactionLog.findMany({ where: { action: 'COMMENT_LIKE' } });
    expect(logs).toHaveLength(1);
    expect(logs[0].targetType).toBe('COMMENT');
    expect(logs[0].targetId).toBe(comment.id);
    expect(logs[0].postId).toBe(post.id);
  });

  it('ADMIN comment + reaction → KHÔNG log (FR-18.1)', async () => {
    const post = await makePost(prisma, { authorId: adminId });
    await request(app.getHttpServer())
      .post(`/posts/${post.id}/comments`)
      .set('Cookie', adminCookies)
      .send({ content: 'admin comment' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/posts/${post.id}/reactions`)
      .set('Cookie', adminCookies)
      .send({ type: 'LIKE' })
      .expect(200);

    expect(await prisma.interactionLog.count()).toBe(0);
  });

  it('đổi reaction type → log POST_REACTION mới với previousType (review fix)', async () => {
    const post = await makePost(prisma, { authorId: adminId });
    await request(app.getHttpServer())
      .post(`/posts/${post.id}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'LIKE' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/posts/${post.id}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'LOVE' })
      .expect(200);
    const logs = await prisma.interactionLog.findMany({
      where: { action: 'POST_REACTION' },
      orderBy: { createdAt: 'asc' },
    });
    expect(logs).toHaveLength(2);
    expect(
      (logs[1].metadata as { reactionType?: string; previousType?: string }).reactionType,
    ).toBe('LOVE');
    expect((logs[1].metadata as { previousType?: string }).previousType).toBe('LIKE');
  });

  it('remove reaction KHÔNG tạo log mới (chỉ log hành động create)', async () => {
    const post = await makePost(prisma, { authorId: adminId });
    await request(app.getHttpServer())
      .post(`/posts/${post.id}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'LIKE' })
      .expect(200);
    const afterCreate = await prisma.interactionLog.count();
    await request(app.getHttpServer())
      .delete(`/posts/${post.id}/reactions`)
      .set('Cookie', userCookies)
      .expect(204);
    expect(await prisma.interactionLog.count()).toBe(afterCreate);
  });
});
