import { Test } from '@nestjs/testing';
import { PrismaService } from 'nestjs-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FileType, Mood, Role } from '@prisma/client';
import { ActivityService } from '@/activity/activity.service';
import { CloudinaryService } from '@/files/cloudinary.service';
import { TagsService } from '@/tags/tags.service';
import { PostsService, normalizeTagName } from '@/posts/posts.service';

type MockPrisma = {
  post: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
  };
  postView: {
    findFirst: jest.Mock;
  };
  $transaction: jest.Mock;
};

const basePost = {
  id: 'p1',
  content: 'hello',
  mood: Mood.HAPPY,
  viewCount: 0,
  authorId: 'admin-id',
  createdAt: new Date('2026-05-17T00:00:00Z'),
  updatedAt: new Date('2026-05-17T00:00:00Z'),
  author: { id: 'admin-id', username: 'admin', role: Role.ADMIN, avatarUrl: null },
  postTags: [{ postId: 'p1', tagId: 't1', tag: { id: 't1', name: 'dev', color: '#7AF7FF' } }],
  images: [],
  files: [],
  _count: { likes: 3, comments: 2 },
};

describe('PostsService', () => {
  let service: PostsService;
  let prisma: MockPrisma;
  let cloudinary: { signUpload: jest.Mock; destroyMany: jest.Mock };
  let tags: { upsertMany: jest.Mock };
  let tx: {
    tag: { upsert: jest.Mock };
    post: { create: jest.Mock; update: jest.Mock };
    postTag: { deleteMany: jest.Mock; createMany: jest.Mock };
    image: { deleteMany: jest.Mock; createMany: jest.Mock };
    file: { deleteMany: jest.Mock; createMany: jest.Mock };
    postView: { create: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      tag: { upsert: jest.fn() },
      post: { create: jest.fn(), update: jest.fn() },
      postTag: { deleteMany: jest.fn(), createMany: jest.fn() },
      image: { deleteMany: jest.fn(), createMany: jest.fn() },
      file: { deleteMany: jest.fn(), createMany: jest.fn() },
      postView: { create: jest.fn() },
    };
    prisma = {
      post: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      postView: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
    };

    cloudinary = {
      signUpload: jest.fn(),
      destroyMany: jest.fn().mockResolvedValue(undefined),
    };
    tags = {
      upsertMany: jest.fn().mockResolvedValue([]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: TagsService, useValue: tags },
        { provide: ActivityService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(PostsService);
  });

  describe('normalizeTagName', () => {
    it('strips # and lowercases', () => {
      expect(normalizeTagName('#Foo')).toBe('foo');
      expect(normalizeTagName('  BAR ')).toBe('bar');
      expect(normalizeTagName('##dev')).toBe('dev');
    });
  });

  describe('list', () => {
    it('returns mapped items + total với pagination + mood filter', async () => {
      prisma.post.findMany.mockResolvedValue([basePost]);
      prisma.post.count.mockResolvedValue(42);

      const res = await service.list({ page: 2, limit: 10, mood: Mood.HAPPY, sort: 'latest' });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mood: Mood.HAPPY },
          skip: 10,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(res.total).toBe(42);
      expect(res.page).toBe(2);
      expect(res.items[0].tags[0]).toEqual({ id: 't1', name: 'dev', color: '#7AF7FF' });
      expect(res.items[0].counts).toEqual({ likes: 3, comments: 2 });
    });

    it('normalizes tag filter (#dev → dev)', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);
      await service.list({ page: 1, limit: 10, tag: '#Dev', sort: 'latest' });
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { postTags: { some: { tag: { name: 'dev' } } } },
        }),
      );
    });

    it('no where filter if neither mood nor tag', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);
      await service.list({ page: 1, limit: 10, sort: 'latest' });
      expect(prisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('sort=likes → orderBy likes _count desc', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);
      await service.list({ page: 1, limit: 10, sort: 'likes' });
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { likes: { _count: 'desc' } } }),
      );
    });

    it('sort=oldest → orderBy createdAt asc', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);
      await service.list({ page: 1, limit: 10, sort: 'oldest' });
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
      );
    });
  });

  describe('findById', () => {
    it('returns post', async () => {
      prisma.post.findUnique.mockResolvedValue(basePost);
      const res = await service.findById('p1');
      expect(res.id).toBe('p1');
      expect(res.tags).toHaveLength(1);
    });

    it('throws NotFoundException', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('happy: delegate tags upsert sang TagsService + image order fallback', async () => {
      tags.upsertMany.mockResolvedValue([
        { id: 'tag-dev', name: 'dev', color: '#00FFE5' },
        { id: 'tag-life', name: 'life', color: '#FF6E96' },
      ]);
      tx.post.create.mockResolvedValue(basePost);

      await service.create('admin-id', {
        content: 'hi',
        mood: Mood.HAPPY,
        tags: ['#Dev', 'life', '#dev'],
        images: [{ url: 'https://a.com/x.jpg', publicId: 'p', width: 10, height: 10 }],
        files: [
          {
            name: 'r.pdf',
            type: FileType.PDF,
            size: 100,
            url: 'https://a.com/r.pdf',
            publicId: 'pf',
          },
        ],
      });

      expect(tags.upsertMany).toHaveBeenCalledWith(['#Dev', 'life', '#dev'], tx);
      const created = tx.post.create.mock.calls[0][0];
      expect(created.data.authorId).toBe('admin-id');
      expect(created.data.postTags.create).toEqual([{ tagId: 'tag-dev' }, { tagId: 'tag-life' }]);
      expect(created.data.images.create[0].order).toBe(0);
      expect(created.data.files.create[0].name).toBe('r.pdf');
    });

    it('happy không tags/images/files: TagsService upsertMany vẫn được gọi với []', async () => {
      tags.upsertMany.mockResolvedValue([]);
      tx.post.create.mockResolvedValue(basePost);
      await service.create('admin-id', { content: 'hi', mood: Mood.HAPPY });
      expect(tags.upsertMany).toHaveBeenCalledWith([], tx);
      const created = tx.post.create.mock.calls[0][0];
      expect(created.data.postTags.create).toEqual([]);
      expect(created.data.images).toBeUndefined();
      expect(created.data.files).toBeUndefined();
    });
  });

  describe('update', () => {
    it('throws NotFoundException nếu post không tồn tại', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.update('nope', { content: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('partial content update không touch tags/images/files', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', images: [], files: [] });
      tx.post.update.mockResolvedValue(basePost);
      await service.update('p1', { content: 'new content' });
      expect(tx.postTag.deleteMany).not.toHaveBeenCalled();
      expect(tx.image.deleteMany).not.toHaveBeenCalled();
      expect(tx.file.deleteMany).not.toHaveBeenCalled();
      expect(tx.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: { content: 'new content' },
        }),
      );
    });

    it('tags replace: delete old + delegate upsert sang TagsService', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', images: [], files: [] });
      tags.upsertMany.mockResolvedValue([{ id: 'tag-new', name: 'new', color: '#00FFE5' }]);
      tx.post.update.mockResolvedValue(basePost);
      await service.update('p1', { tags: ['new'] });
      expect(tags.upsertMany).toHaveBeenCalledWith(['new'], tx);
      expect(tx.postTag.deleteMany).toHaveBeenCalledWith({ where: { postId: 'p1' } });
      expect(tx.postTag.createMany).toHaveBeenCalledWith({
        data: [{ postId: 'p1', tagId: 'tag-new' }],
      });
    });

    it('tags empty array clears all tags (no createMany)', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', images: [], files: [] });
      tags.upsertMany.mockResolvedValue([]);
      tx.post.update.mockResolvedValue(basePost);
      await service.update('p1', { tags: [] });
      expect(tx.postTag.deleteMany).toHaveBeenCalledWith({ where: { postId: 'p1' } });
      expect(tx.postTag.createMany).not.toHaveBeenCalled();
    });
  });

  describe('trackView', () => {
    it('throws BadRequestException nếu không có userId lẫn anonymousId', async () => {
      await expect(service.trackView('p1', {})).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException nếu post không tồn tại', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.trackView('nope', { anonymousId: '0x123' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('counted=false khi recent view < 30min (anonymous)', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', viewCount: 5 });
      prisma.postView.findFirst.mockResolvedValue({ id: 'pv1' });
      const res = await service.trackView('p1', { anonymousId: '0x123' });
      expect(res).toEqual({ viewCount: 5, counted: false });
      expect(tx.postView.create).not.toHaveBeenCalled();
    });

    it('counted=true khi không có recent view (anonymous) — increment viewCount', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', viewCount: 5 });
      prisma.postView.findFirst.mockResolvedValue(null);
      tx.post.update.mockResolvedValue({ viewCount: 6 });
      const res = await service.trackView('p1', { anonymousId: '0x123' });
      expect(res).toEqual({ viewCount: 6, counted: true });
      expect(tx.postView.create).toHaveBeenCalledWith({
        data: { postId: 'p1', userId: null, anonymousId: '0x123' },
      });
      expect(tx.post.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
    });

    it('auth user: dedup theo userId, KHÔNG store anonymousId vào PostView', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', viewCount: 10 });
      prisma.postView.findFirst.mockResolvedValue(null);
      tx.post.update.mockResolvedValue({ viewCount: 11 });
      await service.trackView('p1', { userId: 'u1', anonymousId: '0x123' });
      // dedup query phải dùng userId
      expect(prisma.postView.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ postId: 'p1', userId: 'u1' }),
        }),
      );
      // store: userId set, anonymousId null
      expect(tx.postView.create).toHaveBeenCalledWith({
        data: { postId: 'p1', userId: 'u1', anonymousId: null },
      });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });

    it('success: calls delete + Cloudinary destroyMany với image + file publicIds', async () => {
      prisma.post.findUnique.mockResolvedValue({
        id: 'p1',
        images: [{ publicId: 'img-1' }, { publicId: 'img-2' }],
        files: [{ publicId: 'file-1' }],
      });
      prisma.post.delete.mockResolvedValue(basePost);
      await service.remove('p1');
      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(cloudinary.destroyMany).toHaveBeenCalledWith([
        { publicId: 'img-1', resourceType: 'image' },
        { publicId: 'img-2', resourceType: 'image' },
        { publicId: 'file-1', resourceType: 'raw' },
      ]);
    });

    it('success: empty images/files → destroyMany với []', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', images: [], files: [] });
      prisma.post.delete.mockResolvedValue(basePost);
      await service.remove('p1');
      expect(cloudinary.destroyMany).toHaveBeenCalledWith([]);
    });
  });
});
