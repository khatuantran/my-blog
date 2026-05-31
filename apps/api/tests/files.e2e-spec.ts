import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { FileType, Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makePost, makeUser } from './_helpers/factory';

describe('Files (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cloudinaryMock: { signUpload: jest.Mock; destroyMany: jest.Mock };
  let adminCookies: string;
  let userCookies: string;
  let adminId: string;

  beforeAll(async () => {
    ({ app, prisma, cloudinaryMock } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
    cloudinaryMock.signUpload.mockClear();
    cloudinaryMock.destroyMany.mockClear();
    const alice = await makeUser(prisma, { username: 'alice', role: Role.USER });
    userCookies = await loginAs(app, { username: alice.username, password: alice.rawPassword });
    const admin = await prisma.user.findUnique({ where: { username: 'test-admin' } });
    adminId = admin!.id;
    adminCookies = await loginAs(app, { username: 'test-admin', password: 'test-admin-password' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /files/sign', () => {
    it('401 no cookie', async () => {
      await request(app.getHttpServer())
        .post('/files/sign')
        .send({ resourceType: 'image' })
        .expect(401);
    });

    it('403 USER role', async () => {
      const res = await request(app.getHttpServer())
        .post('/files/sign')
        .set('Cookie', userCookies)
        .send({ resourceType: 'image' })
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('200 admin happy + delegate CloudinaryService.signUpload', async () => {
      const res = await request(app.getHttpServer())
        .post('/files/sign')
        .set('Cookie', adminCookies)
        .send({ resourceType: 'image', folder: 'myblog/posts' })
        .expect(200);
      expect(res.body.data.provider).toBe('cloudinary');
      expect(res.body.data.signature).toBe('stub-signature');
      expect(res.body.data.apiKey).toBe('test-key');
      expect(cloudinaryMock.signUpload).toHaveBeenCalledWith({
        folder: 'myblog/posts',
        publicId: undefined,
        resourceType: 'image',
      });
    });

    it('400 missing resourceType', async () => {
      await request(app.getHttpServer())
        .post('/files/sign')
        .set('Cookie', adminCookies)
        .send({})
        .expect(400);
    });

    it('400 resourceType ngoài enum image|raw', async () => {
      await request(app.getHttpServer())
        .post('/files/sign')
        .set('Cookie', adminCookies)
        .send({ resourceType: 'video' })
        .expect(400);
    });
  });

  describe('POST /files/upload (local storage, ADR-010)', () => {
    // Endpoint guard wiring (admin-only). Logic ghi file cover ở local-storage.service.spec
    // (test-app dùng driver cloudinary mock nên không test ghi disk ở đây).
    it('401 no cookie', async () => {
      await request(app.getHttpServer())
        .post('/files/upload')
        .attach('file', Buffer.from('x'), 'x.png')
        .field('folder', 'myblog/posts')
        .field('resourceType', 'image')
        .expect(401);
    });

    it('403 USER role', async () => {
      await request(app.getHttpServer())
        .post('/files/upload')
        .set('Cookie', userCookies)
        .attach('file', Buffer.from('x'), 'x.png')
        .field('folder', 'myblog/posts')
        .field('resourceType', 'image')
        .expect(403);
    });

    it('400 admin thiếu file', async () => {
      const res = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Cookie', adminCookies)
        .field('folder', 'myblog/posts')
        .field('resourceType', 'image')
        .expect(400);
      expect(res.body.error.code).toBe('FILE_REQUIRED');
    });
  });

  describe('DELETE /files/:id', () => {
    async function makeFile(postId: string, publicId = 'doc-xyz') {
      return prisma.file.create({
        data: {
          postId,
          name: 'report.pdf',
          type: FileType.PDF,
          size: 1024,
          url: 'https://r.com/r.pdf',
          publicId,
        },
      });
    }

    it('401 no cookie', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const file = await makeFile(post.id);
      await request(app.getHttpServer()).delete(`/files/${file.id}`).expect(401);
    });

    it('403 USER role', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const file = await makeFile(post.id);
      await request(app.getHttpServer())
        .delete(`/files/${file.id}`)
        .set('Cookie', userCookies)
        .expect(403);
    });

    it('204 admin: DB row deleted + Cloudinary destroyMany called với raw', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      const file = await makeFile(post.id, 'doc-abc');
      await request(app.getHttpServer())
        .delete(`/files/${file.id}`)
        .set('Cookie', adminCookies)
        .expect(204);
      expect(await prisma.file.findUnique({ where: { id: file.id } })).toBeNull();
      expect(cloudinaryMock.destroyMany).toHaveBeenCalledWith([
        { publicId: 'doc-abc', resourceType: 'raw' },
      ]);
    });

    it('404 file không tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .delete('/files/cmp-unknown')
        .set('Cookie', adminCookies)
        .expect(404);
      expect(res.body.error.code).toBe('FILE_NOT_FOUND');
    });
  });

  describe('Cascade Cloudinary cleanup (PostsService hook)', () => {
    it('DELETE /posts/:id → destroyMany với cả image + file publicIds', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await prisma.image.create({
        data: { postId: post.id, url: 'u1', publicId: 'img-pid', width: 10, height: 10 },
      });
      await prisma.file.create({
        data: {
          postId: post.id,
          name: 'r.pdf',
          type: FileType.PDF,
          size: 1,
          url: 'u2',
          publicId: 'file-pid',
        },
      });
      await request(app.getHttpServer())
        .delete(`/posts/${post.id}`)
        .set('Cookie', adminCookies)
        .expect(204);
      expect(cloudinaryMock.destroyMany).toHaveBeenCalledWith([
        { publicId: 'img-pid', resourceType: 'image' },
        { publicId: 'file-pid', resourceType: 'raw' },
      ]);
    });

    it('PATCH /posts/:id replace images → destroyMany với image cũ', async () => {
      const post = await makePost(prisma, { authorId: adminId });
      await prisma.image.create({
        data: { postId: post.id, url: 'u-old', publicId: 'old-img', width: 10, height: 10 },
      });
      await request(app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .set('Cookie', adminCookies)
        .send({
          images: [{ url: 'https://r.com/new.jpg', publicId: 'new-img', width: 20, height: 20 }],
        })
        .expect(200);
      expect(cloudinaryMock.destroyMany).toHaveBeenCalledWith([
        { publicId: 'old-img', resourceType: 'image' },
      ]);
    });
  });
});
