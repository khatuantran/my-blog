import { Test } from '@nestjs/testing';
import { PrismaService } from 'nestjs-prisma';
import { NotFoundException } from '@nestjs/common';
import { FileType, Mood, Role } from '@prisma/client';
import { PostsService, normalizeTagName } from '@/posts/posts.service';

type MockPrisma = {
  post: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
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
  let tx: {
    tag: { upsert: jest.Mock };
    post: { create: jest.Mock; update: jest.Mock };
    postTag: { deleteMany: jest.Mock; createMany: jest.Mock };
    image: { deleteMany: jest.Mock; createMany: jest.Mock };
    file: { deleteMany: jest.Mock; createMany: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      tag: { upsert: jest.fn() },
      post: { create: jest.fn(), update: jest.fn() },
      postTag: { deleteMany: jest.fn(), createMany: jest.fn() },
      image: { deleteMany: jest.fn(), createMany: jest.fn() },
      file: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    prisma = {
      post: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [PostsService, { provide: PrismaService, useValue: prisma }],
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

      const res = await service.list({ page: 2, limit: 10, mood: Mood.HAPPY });

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
      await service.list({ page: 1, limit: 10, tag: '#Dev' });
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { postTags: { some: { tag: { name: 'dev' } } } },
        }),
      );
    });

    it('no where filter if neither mood nor tag', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);
      await service.list({ page: 1, limit: 10 });
      expect(prisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
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
    it('happy with tags auto-upsert + image order fallback', async () => {
      tx.tag.upsert.mockImplementation(({ create }: { create: { name: string } }) =>
        Promise.resolve({ id: 'tag-' + create.name, name: create.name, color: null }),
      );
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

      // dedupe + normalize → 'dev' + 'life'
      expect(tx.tag.upsert).toHaveBeenCalledTimes(2);
      const created = tx.post.create.mock.calls[0][0];
      expect(created.data.authorId).toBe('admin-id');
      expect(created.data.postTags.create).toHaveLength(2);
      expect(created.data.images.create[0].order).toBe(0);
      expect(created.data.files.create[0].name).toBe('r.pdf');
    });

    it('happy không tags/images/files', async () => {
      tx.post.create.mockResolvedValue(basePost);
      await service.create('admin-id', { content: 'hi', mood: Mood.HAPPY });
      const created = tx.post.create.mock.calls[0][0];
      expect(created.data.postTags.create).toEqual([]);
      expect(created.data.images).toBeUndefined();
      expect(created.data.files).toBeUndefined();
      expect(tx.tag.upsert).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException nếu post không tồn tại', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.update('nope', { content: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('partial content update không touch tags/images/files', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
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

    it('tags replace: delete old + upsert new', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      tx.tag.upsert.mockResolvedValue({ id: 'tag-new', name: 'new', color: null });
      tx.post.update.mockResolvedValue(basePost);
      await service.update('p1', { tags: ['new'] });
      expect(tx.postTag.deleteMany).toHaveBeenCalledWith({ where: { postId: 'p1' } });
      expect(tx.postTag.createMany).toHaveBeenCalledWith({
        data: [{ postId: 'p1', tagId: 'tag-new' }],
      });
    });

    it('tags empty array clears all tags', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      tx.post.update.mockResolvedValue(basePost);
      await service.update('p1', { tags: [] });
      expect(tx.postTag.deleteMany).toHaveBeenCalledWith({ where: { postId: 'p1' } });
      expect(tx.postTag.createMany).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });

    it('success: calls delete', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.post.delete.mockResolvedValue(basePost);
      await service.remove('p1');
      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });
});
