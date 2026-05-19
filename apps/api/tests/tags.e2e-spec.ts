import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from 'nestjs-prisma';
import { Role } from '@prisma/client';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makePost, makeUser } from './_helpers/factory';
import { TAG_COLORS } from '@/tags/tags.service';

describe('Tags (e2e)', () => {
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

  describe('GET /tags', () => {
    it('200 empty', async () => {
      const res = await request(app.getHttpServer()).get('/tags').expect(200);
      expect(res.body.data.items).toEqual([]);
    });

    it('200 order by postCount DESC', async () => {
      const popular = await prisma.tag.create({ data: { name: 'popular', color: '#00FFE5' } });
      const niche = await prisma.tag.create({ data: { name: 'niche', color: '#FF6E96' } });
      const p1 = await makePost(prisma, { authorId: adminId });
      const p2 = await makePost(prisma, { authorId: adminId });
      const p3 = await makePost(prisma, { authorId: adminId });
      await prisma.postTag.createMany({
        data: [
          { postId: p1.id, tagId: popular.id },
          { postId: p2.id, tagId: popular.id },
          { postId: p3.id, tagId: popular.id },
          { postId: p1.id, tagId: niche.id },
        ],
      });
      const res = await request(app.getHttpServer()).get('/tags').expect(200);
      expect(res.body.data.items[0].name).toBe('popular');
      expect(res.body.data.items[0].postCount).toBe(3);
      expect(res.body.data.items[1].name).toBe('niche');
      expect(res.body.data.items[1].postCount).toBe(1);
    });

    it('200 respect limit param', async () => {
      for (let i = 0; i < 5; i++) {
        await prisma.tag.create({ data: { name: `tag${i}`, color: TAG_COLORS[i] } });
      }
      const res = await request(app.getHttpServer()).get('/tags?limit=3').expect(200);
      expect(res.body.data.items).toHaveLength(3);
    });

    it('200 sort=name → alphabetical asc + sparkline7d array', async () => {
      await prisma.tag.create({ data: { name: 'zeta', color: TAG_COLORS[0] } });
      await prisma.tag.create({ data: { name: 'alpha', color: TAG_COLORS[1] } });
      const res = await request(app.getHttpServer()).get('/tags?sort=name').expect(200);
      expect(res.body.data.items[0].name).toBe('alpha');
      expect(res.body.data.items[1].name).toBe('zeta');
      expect(res.body.data.items[0].sparkline7d).toHaveLength(7);
      expect(res.body.data.items[0].description).toBeNull();
    });

    it('200 sort=recent → newest first', async () => {
      await prisma.tag.create({ data: { name: 'old' } });
      await new Promise((r) => setTimeout(r, 20));
      await prisma.tag.create({ data: { name: 'new' } });
      const res = await request(app.getHttpServer()).get('/tags?sort=recent').expect(200);
      expect(res.body.data.items[0].name).toBe('new');
    });

    it('200 q query → substring filter case-insensitive', async () => {
      await prisma.tag.create({ data: { name: 'devops' } });
      await prisma.tag.create({ data: { name: 'design' } });
      await prisma.tag.create({ data: { name: 'life' } });
      const res = await request(app.getHttpServer()).get('/tags?q=DE').expect(200);
      expect(res.body.data.items.map((t: { name: string }) => t.name).sort()).toEqual([
        'design',
        'devops',
      ]);
    });

    it('200 sparkline7d phản ánh post-with-tag mỗi ngày', async () => {
      const tag = await prisma.tag.create({ data: { name: 'spark' } });
      const post = await makePost(prisma, { authorId: adminId });
      await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
      const res = await request(app.getHttpServer()).get('/tags?sort=posts').expect(200);
      const sp = res.body.data.items[0].sparkline7d as number[];
      expect(sp).toHaveLength(7);
      expect(sp[6]).toBe(1); // today (last bucket)
    });
  });

  describe('POST /tags', () => {
    it('401 no cookie', async () => {
      await request(app.getHttpServer()).post('/tags').send({ name: 'x' }).expect(401);
    });

    it('403 USER role', async () => {
      const res = await request(app.getHttpServer())
        .post('/tags')
        .set('Cookie', userCookies)
        .send({ name: 'x' })
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('201 admin: normalize name + auto-assign color theo count', async () => {
      const res = await request(app.getHttpServer())
        .post('/tags')
        .set('Cookie', adminCookies)
        .send({ name: '#DevTag' })
        .expect(201);
      expect(res.body.data.name).toBe('devtag');
      expect(res.body.data.color).toBe(TAG_COLORS[0]); // count=0 trước create
      expect(res.body.data.description).toBeNull();
    });

    it('201 admin: accept description (max 280)', async () => {
      const desc = 'Lập trình, debugging, code snippets';
      const res = await request(app.getHttpServer())
        .post('/tags')
        .set('Cookie', adminCookies)
        .send({ name: 'code', description: desc })
        .expect(201);
      expect(res.body.data.description).toBe(desc);
    });

    it('400 description > 280 chars rejected', async () => {
      await request(app.getHttpServer())
        .post('/tags')
        .set('Cookie', adminCookies)
        .send({ name: 'longdesc', description: 'x'.repeat(281) })
        .expect(400);
    });

    it('201 admin: color cycle qua palette (7 tags → tag thứ 8 wrap về palette[0])', async () => {
      for (let i = 0; i < 7; i++) {
        await request(app.getHttpServer())
          .post('/tags')
          .set('Cookie', adminCookies)
          .send({ name: `tag${i}` })
          .expect(201);
      }
      const res = await request(app.getHttpServer())
        .post('/tags')
        .set('Cookie', adminCookies)
        .send({ name: 'tag7' })
        .expect(201);
      expect(res.body.data.color).toBe(TAG_COLORS[0]);
    });

    it('201 admin: explicit color giữ nguyên không từ palette', async () => {
      const res = await request(app.getHttpServer())
        .post('/tags')
        .set('Cookie', adminCookies)
        .send({ name: 'custom', color: '#ABCDEF' })
        .expect(201);
      expect(res.body.data.color).toBe('#ABCDEF');
    });

    it('409 DUPLICATE_TAG', async () => {
      await prisma.tag.create({ data: { name: 'dev', color: TAG_COLORS[0] } });
      const res = await request(app.getHttpServer())
        .post('/tags')
        .set('Cookie', adminCookies)
        .send({ name: '#DEV' })
        .expect(409);
      expect(res.body.error.code).toBe('DUPLICATE_TAG');
    });
  });

  describe('PATCH /tags/:id', () => {
    it('200 admin: rename', async () => {
      const tag = await prisma.tag.create({ data: { name: 'old', color: TAG_COLORS[0] } });
      const res = await request(app.getHttpServer())
        .patch(`/tags/${tag.id}`)
        .set('Cookie', adminCookies)
        .send({ name: 'NewName' })
        .expect(200);
      expect(res.body.data.name).toBe('newname');
    });

    it('200 admin: change color', async () => {
      const tag = await prisma.tag.create({ data: { name: 'dev', color: TAG_COLORS[0] } });
      const res = await request(app.getHttpServer())
        .patch(`/tags/${tag.id}`)
        .set('Cookie', adminCookies)
        .send({ color: '#FF00FF' })
        .expect(200);
      expect(res.body.data.color).toBe('#FF00FF');
    });

    it('403 USER role', async () => {
      const tag = await prisma.tag.create({ data: { name: 'dev', color: TAG_COLORS[0] } });
      await request(app.getHttpServer())
        .patch(`/tags/${tag.id}`)
        .set('Cookie', userCookies)
        .send({ name: 'x' })
        .expect(403);
    });

    it('404 tag không tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .patch('/tags/cmp-unknown')
        .set('Cookie', adminCookies)
        .send({ name: 'x' })
        .expect(404);
      expect(res.body.error.code).toBe('TAG_NOT_FOUND');
    });

    it('409 rename duplicate', async () => {
      const t1 = await prisma.tag.create({ data: { name: 'dev', color: TAG_COLORS[0] } });
      await prisma.tag.create({ data: { name: 'life', color: TAG_COLORS[1] } });
      const res = await request(app.getHttpServer())
        .patch(`/tags/${t1.id}`)
        .set('Cookie', adminCookies)
        .send({ name: 'life' })
        .expect(409);
      expect(res.body.error.code).toBe('DUPLICATE_TAG');
    });
  });

  describe('DELETE /tags/:id', () => {
    it('204 admin: cascade PostTag với ?force=true', async () => {
      const tag = await prisma.tag.create({ data: { name: 'dev', color: TAG_COLORS[0] } });
      const post = await makePost(prisma, { authorId: adminId });
      await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
      await request(app.getHttpServer())
        .delete(`/tags/${tag.id}?force=true`)
        .set('Cookie', adminCookies)
        .expect(204);
      expect(await prisma.tag.findUnique({ where: { id: tag.id } })).toBeNull();
      expect(await prisma.postTag.findFirst({ where: { tagId: tag.id } })).toBeNull();
      // Post itself remains
      expect(await prisma.post.findUnique({ where: { id: post.id } })).not.toBeNull();
    });

    it('409 TAG_IN_USE khi tag có postCount > 0 + không force', async () => {
      const tag = await prisma.tag.create({ data: { name: 'used', color: TAG_COLORS[0] } });
      const post = await makePost(prisma, { authorId: adminId });
      await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
      const res = await request(app.getHttpServer())
        .delete(`/tags/${tag.id}`)
        .set('Cookie', adminCookies)
        .expect(409);
      expect(res.body.error?.code ?? res.body.code).toBe('TAG_IN_USE');
    });

    it('204 admin: orphan tag (postCount = 0) without force', async () => {
      const tag = await prisma.tag.create({ data: { name: 'orphan', color: TAG_COLORS[1] } });
      await request(app.getHttpServer())
        .delete(`/tags/${tag.id}`)
        .set('Cookie', adminCookies)
        .expect(204);
    });

    it('403 USER role', async () => {
      const tag = await prisma.tag.create({ data: { name: 'dev', color: TAG_COLORS[0] } });
      await request(app.getHttpServer())
        .delete(`/tags/${tag.id}`)
        .set('Cookie', userCookies)
        .expect(403);
    });

    it('404 unknown', async () => {
      const res = await request(app.getHttpServer())
        .delete('/tags/cmp-unknown')
        .set('Cookie', adminCookies)
        .expect(404);
      expect(res.body.error.code).toBe('TAG_NOT_FOUND');
    });
  });

  describe('Color rotation via PostsService auto-create', () => {
    it('POST /posts với tag mới → tag được auto-assign color theo cycle', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', adminCookies)
        .send({ content: 'first', mood: 'HAPPY', tags: ['firsttag'] })
        .expect(201);
      const tag = await prisma.tag.findUnique({ where: { name: 'firsttag' } });
      expect(tag!.color).toBe(TAG_COLORS[0]);
      expect(res.body.data.tags[0].color).toBe(TAG_COLORS[0]);
    });
  });
});
