import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from 'nestjs-prisma';
import { FileType, Mood, Role } from '@prisma/client';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makePost, makeUser } from './_helpers/factory';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookies: string;
  let userCookies: string;
  let adminId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
    const alice = await makeUser(prisma, { username: 'alice', role: Role.USER });
    userCookies = await loginAs(app, { username: alice.username, password: alice.rawPassword });

    const admin = await prisma.user.findUnique({ where: { username: 'test-admin' } });
    adminId = admin!.id;
    adminCookies = await loginAs(app, { username: 'test-admin', password: 'test-admin-password' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /posts', () => {
    it('200 empty list', async () => {
      const res = await request(app.getHttpServer()).get('/posts').expect(200);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });

    it('200 paginated (page=1 limit=10 over 15 posts)', async () => {
      for (let i = 0; i < 15; i++) {
        await makePost(prisma, { authorId: adminId, content: `post ${i}` });
      }
      const res = await request(app.getHttpServer()).get('/posts?page=1&limit=10').expect(200);
      expect(res.body.data.items).toHaveLength(10);
      expect(res.body.data.total).toBe(15);
    });

    it('200 filter by mood', async () => {
      await makePost(prisma, { authorId: adminId, mood: Mood.HAPPY });
      await makePost(prisma, { authorId: adminId, mood: Mood.SAD });
      const res = await request(app.getHttpServer()).get('/posts?mood=HAPPY').expect(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].mood).toBe('HAPPY');
    });

    it('200 filter by tag (with # prefix normalized)', async () => {
      await makePost(prisma, { authorId: adminId, tagNames: ['dev'] });
      await makePost(prisma, { authorId: adminId, tagNames: ['life'] });
      const res = await request(app.getHttpServer()).get('/posts?tag=%23dev').expect(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].tags[0].name).toBe('dev');
    });
  });

  describe('GET /posts/:id', () => {
    it('200 happy', async () => {
      const post = await makePost(prisma, { authorId: adminId, content: 'detail' });
      const res = await request(app.getHttpServer()).get(`/posts/${post.id}`).expect(200);
      expect(res.body.data.id).toBe(post.id);
      expect(res.body.data.content).toBe('detail');
      expect(res.body.data.author.id).toBe(adminId);
      expect(res.body.data.counts).toEqual({ likes: 0, comments: 0 });
    });

    it('404 not found', async () => {
      const res = await request(app.getHttpServer()).get('/posts/cmp-nonexistent').expect(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });
  });

  describe('POST /posts', () => {
    const validBody = {
      content: 'My new post',
      mood: Mood.EXCITED,
      tags: ['#Code', 'life'],
    };

    it('401 no cookie', async () => {
      await request(app.getHttpServer()).post('/posts').send(validBody).expect(401);
    });

    it('403 USER role', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send(validBody)
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('201 admin happy + tags auto-created', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', adminCookies)
        .send(validBody)
        .expect(201);
      expect(res.body.data.content).toBe('My new post');
      expect(res.body.data.tags).toHaveLength(2);
      const tagNames = res.body.data.tags.map((t: { name: string }) => t.name).sort();
      expect(tagNames).toEqual(['code', 'life']);

      const dbTags = await prisma.tag.findMany({ where: { name: { in: ['code', 'life'] } } });
      expect(dbTags).toHaveLength(2);
    });

    it('201 admin happy with images + files', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', adminCookies)
        .send({
          content: 'with media',
          mood: Mood.HAPPY,
          images: [{ url: 'https://r.com/a.jpg', publicId: 'p1', width: 100, height: 100 }],
          files: [
            {
              name: 'r.pdf',
              type: FileType.PDF,
              size: 1024,
              url: 'https://r.com/r.pdf',
              publicId: 'f1',
            },
          ],
        })
        .expect(201);
      expect(res.body.data.images).toHaveLength(1);
      expect(res.body.data.files).toHaveLength(1);
    });

    it('400 missing mood', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', adminCookies)
        .send({ content: 'no mood' })
        .expect(400);
    });
  });

  describe('PATCH /posts/:id', () => {
    it('401 no cookie', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await request(app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .send({ content: 'x' })
        .expect(401);
    });

    it('403 USER role', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const res = await request(app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .set('Cookie', userCookies)
        .send({ content: 'x' })
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('200 admin update content', async () => {
      const post = await makePost(prisma, { authorId: adminId, content: 'old' });
      const res = await request(app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .set('Cookie', adminCookies)
        .send({ content: 'new' })
        .expect(200);
      expect(res.body.data.content).toBe('new');
    });

    it('200 admin replace tags (old PostTag deleted)', async () => {
      const post = await makePost(prisma, { authorId: adminId, tagNames: ['old1', 'old2'] });
      const res = await request(app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .set('Cookie', adminCookies)
        .send({ tags: ['fresh'] })
        .expect(200);
      expect(res.body.data.tags).toHaveLength(1);
      expect(res.body.data.tags[0].name).toBe('fresh');

      const links = await prisma.postTag.findMany({ where: { postId: post.id } });
      expect(links).toHaveLength(1);
    });

    it('404 unknown id', async () => {
      const res = await request(app.getHttpServer())
        .patch('/posts/cmp-unknown')
        .set('Cookie', adminCookies)
        .send({ content: 'x' })
        .expect(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });
  });

  describe('POST /posts/:id/view', () => {
    it('200 anonymous: counted=true + viewCount +1', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const agent = request.agent(app.getHttpServer());
      // Prime anon_id cookie (set by middleware)
      await agent.get('/posts').expect(200);
      const res = await agent.post(`/posts/${post.id}/view`).expect(200);
      expect(res.body.data.counted).toBe(true);
      expect(res.body.data.viewCount).toBe(1);

      const dbPost = await prisma.post.findUnique({ where: { id: post.id } });
      expect(dbPost!.viewCount).toBe(1);
    });

    it('200 anonymous: dedup trong 30min → counted=false, viewCount giữ nguyên', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      await agent.post(`/posts/${post.id}/view`).expect(200);
      const res = await agent.post(`/posts/${post.id}/view`).expect(200);
      expect(res.body.data.counted).toBe(false);
      expect(res.body.data.viewCount).toBe(1);

      const views = await prisma.postView.count({ where: { postId: post.id } });
      expect(views).toBe(1);
    });

    it('200 hai anonymous khác nhau → cả 2 đều counted=true', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const a1 = request.agent(app.getHttpServer());
      const a2 = request.agent(app.getHttpServer());
      await a1.get('/posts').expect(200);
      await a2.get('/posts').expect(200);
      await a1.post(`/posts/${post.id}/view`).expect(200);
      const res = await a2.post(`/posts/${post.id}/view`).expect(200);
      expect(res.body.data.counted).toBe(true);
      expect(res.body.data.viewCount).toBe(2);
    });

    it('200 auth user: track theo userId, KHÔNG store anonymousId', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const res = await request(app.getHttpServer())
        .post(`/posts/${post.id}/view`)
        .set('Cookie', userCookies)
        .expect(200);
      expect(res.body.data.counted).toBe(true);

      const view = await prisma.postView.findFirst({ where: { postId: post.id } });
      expect(view!.userId).not.toBeNull();
      expect(view!.anonymousId).toBeNull();
    });

    it('404 post không tồn tại', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.get('/posts').expect(200);
      const res = await agent.post('/posts/cmp-unknown/view').expect(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });
  });

  describe('DELETE /posts/:id', () => {
    it('401 no cookie', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await request(app.getHttpServer()).delete(`/posts/${post.id}`).expect(401);
    });

    it('403 USER role', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const res = await request(app.getHttpServer())
        .delete(`/posts/${post.id}`)
        .set('Cookie', userCookies)
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('204 admin delete with cascade', async () => {
      const post = await makePost(prisma, { authorId: adminId, tagNames: ['casc'] });
      await prisma.image.create({
        data: {
          postId: post.id,
          url: 'https://r.com/i.jpg',
          publicId: 'pi',
          width: 10,
          height: 10,
        },
      });
      await request(app.getHttpServer())
        .delete(`/posts/${post.id}`)
        .set('Cookie', adminCookies)
        .expect(204);

      expect(await prisma.post.findUnique({ where: { id: post.id } })).toBeNull();
      expect(await prisma.image.findFirst({ where: { postId: post.id } })).toBeNull();
      expect(await prisma.postTag.findFirst({ where: { postId: post.id } })).toBeNull();
      // Tag itself NOT deleted (only PostTag link)
      expect(await prisma.tag.findUnique({ where: { name: 'casc' } })).not.toBeNull();
    });

    it('404 unknown id', async () => {
      const res = await request(app.getHttpServer())
        .delete('/posts/cmp-unknown')
        .set('Cookie', adminCookies)
        .expect(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });
  });
});
