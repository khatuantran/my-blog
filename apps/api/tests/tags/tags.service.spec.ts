import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { TAG_COLORS, TagsService, normalizeTagName } from '@/tags/tags.service';

type MockPrisma = {
  tag: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    upsert: jest.Mock;
  };
  postTag: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

describe('TagsService', () => {
  let service: TagsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      tag: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
      postTag: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [TagsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(TagsService);
  });

  describe('normalizeTagName', () => {
    it('strips # and lowercases', () => {
      expect(normalizeTagName('#Foo')).toBe('foo');
      expect(normalizeTagName('  BAR ')).toBe('bar');
      expect(normalizeTagName('##dev')).toBe('dev');
    });
  });

  describe('pickColor', () => {
    it('cycle qua palette theo index modulo 7', () => {
      expect(service.pickColor(0)).toBe(TAG_COLORS[0]);
      expect(service.pickColor(6)).toBe(TAG_COLORS[6]);
      expect(service.pickColor(7)).toBe(TAG_COLORS[0]);
      expect(service.pickColor(8)).toBe(TAG_COLORS[1]);
    });
  });

  describe('listPopular', () => {
    it('default sort posts → orderBy posts _count DESC + sparkline7d shape', async () => {
      const now = new Date();
      prisma.tag.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'dev',
          color: '#00FFE5',
          description: null,
          createdAt: now,
          _count: { posts: 5 },
        },
      ]);
      const res = await service.listPopular({ limit: 20, sort: 'posts' });
      expect(prisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          orderBy: [{ posts: { _count: 'desc' } }, { name: 'asc' }],
        }),
      );
      expect(res.items[0]).toMatchObject({
        id: 't1',
        name: 'dev',
        color: '#00FFE5',
        postCount: 5,
      });
      expect(res.items[0].sparkline7d).toHaveLength(7);
      expect(res.items[0].sparkline7d.every((n) => n === 0)).toBe(true);
    });

    it('sort=name → orderBy name asc', async () => {
      prisma.tag.findMany.mockResolvedValue([]);
      await service.listPopular({ limit: 20, sort: 'name' });
      expect(prisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: 'asc' }] }),
      );
    });

    it('sort=recent → orderBy createdAt desc', async () => {
      prisma.tag.findMany.mockResolvedValue([]);
      await service.listPopular({ limit: 20, sort: 'recent' });
      expect(prisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        }),
      );
    });

    it('q query → name contains insensitive', async () => {
      prisma.tag.findMany.mockResolvedValue([]);
      await service.listPopular({ limit: 20, sort: 'posts', q: 'COD' });
      expect(prisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'cod', mode: 'insensitive' } },
        }),
      );
    });
  });

  describe('remove force', () => {
    it('throws ConflictException khi postCount > 0 + force=false', async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 't1', name: 'used', color: '#x' });
      prisma.postTag.count.mockResolvedValue(3);
      await expect(service.remove('t1', false)).rejects.toThrow(ConflictException);
      expect(prisma.tag.delete).not.toHaveBeenCalled();
    });

    it('force=true → delete bypass postCount check', async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 't1', name: 'used', color: '#x' });
      prisma.postTag.count.mockResolvedValue(3);
      prisma.tag.delete.mockResolvedValue({});
      await service.remove('t1', true);
      expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });
  });

  describe('create', () => {
    it('auto-assign color theo count khi không truyền color', async () => {
      prisma.tag.findUnique.mockResolvedValue(null);
      prisma.tag.count.mockResolvedValue(8); // → palette[8 % 7] = palette[1] = magenta
      prisma.tag.create.mockResolvedValue({ id: 't1', name: 'new', color: TAG_COLORS[1] });
      const res = await service.create({ name: '#NEW' });
      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: { name: 'new', color: TAG_COLORS[1], description: null },
      });
      expect(res.color).toBe(TAG_COLORS[1]);
    });

    it('use color khi truyền explicit', async () => {
      prisma.tag.findUnique.mockResolvedValue(null);
      prisma.tag.create.mockResolvedValue({ id: 't1', name: 'custom', color: '#ABCDEF' });
      await service.create({ name: 'custom', color: '#ABCDEF' });
      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: { name: 'custom', color: '#ABCDEF', description: null },
      });
      expect(prisma.tag.count).not.toHaveBeenCalled();
    });

    it('409 DUPLICATE_TAG khi name trùng', async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 't0', name: 'dev', color: null });
      await expect(service.create({ name: '#dev' })).rejects.toThrow(ConflictException);
    });

    it('409 INVALID_TAG_NAME khi name rỗng sau normalize', async () => {
      await expect(service.create({ name: '###' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('404 nếu tag không tồn tại', async () => {
      prisma.tag.findUnique.mockResolvedValue(null);
      await expect(service.update('nope', { name: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('rename happy + normalize', async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 't1', name: 'old', color: null });
      prisma.tag.findFirst.mockResolvedValue(null);
      prisma.tag.update.mockResolvedValue({ id: 't1', name: 'newname', color: null });
      await service.update('t1', { name: '#NewName' });
      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { name: 'newname' },
      });
    });

    it('409 nếu name trùng tag khác', async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 't1', name: 'old', color: null });
      prisma.tag.findFirst.mockResolvedValue({ id: 't2', name: 'taken', color: null });
      await expect(service.update('t1', { name: 'taken' })).rejects.toThrow(ConflictException);
    });

    it('chỉ đổi color giữ name', async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 't1', name: 'dev', color: '#000000' });
      prisma.tag.update.mockResolvedValue({ id: 't1', name: 'dev', color: '#FF0000' });
      await service.update('t1', { color: '#FF0000' });
      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { color: '#FF0000' },
      });
    });
  });

  describe('remove', () => {
    it('404 nếu tag không tồn tại', async () => {
      prisma.tag.findUnique.mockResolvedValue(null);
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });

    it('success: delete', async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 't1', name: 'dev', color: null });
      prisma.tag.delete.mockResolvedValue({ id: 't1' });
      await service.remove('t1');
      expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });
  });

  describe('upsertMany', () => {
    it('dedupe + normalize + cycle color theo count', async () => {
      prisma.tag.count.mockResolvedValue(5); // baseIndex = 5
      prisma.tag.upsert.mockImplementation((args: { create: { name: string; color: string } }) =>
        Promise.resolve({ id: 'tag-' + args.create.name, ...args.create }),
      );
      const res = await service.upsertMany(['#Dev', 'life', '#dev', '   ']);
      // dedupe → ['dev', 'life']. colors palette[5], palette[6]
      expect(prisma.tag.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.tag.upsert).toHaveBeenNthCalledWith(1, {
        where: { name: 'dev' },
        update: {},
        create: { name: 'dev', color: TAG_COLORS[5] },
      });
      expect(prisma.tag.upsert).toHaveBeenNthCalledWith(2, {
        where: { name: 'life' },
        update: {},
        create: { name: 'life', color: TAG_COLORS[6] },
      });
      expect(res).toHaveLength(2);
    });

    it('empty input → return [] không gọi Prisma', async () => {
      const res = await service.upsertMany([]);
      expect(res).toEqual([]);
      expect(prisma.tag.upsert).not.toHaveBeenCalled();
      expect(prisma.tag.count).not.toHaveBeenCalled();
    });

    it('dùng tx khi pass tham số (cho $transaction)', async () => {
      const tx = {
        tag: {
          upsert: jest.fn().mockResolvedValue({ id: 't1', name: 'x', color: TAG_COLORS[0] }),
          count: jest.fn().mockResolvedValue(0),
        },
      };
      await service.upsertMany(['x'], tx);
      expect(tx.tag.upsert).toHaveBeenCalled();
      expect(prisma.tag.upsert).not.toHaveBeenCalled();
    });
  });
});
