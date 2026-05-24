import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Mood, Role } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { ActivityService } from '@/activity/activity.service';
import { SavedService } from '@/saved/saved.service';

type MockPrisma = {
  post: { findUnique: jest.Mock };
  savedPost: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
};

const basePost = {
  id: 'p1',
  content: 'hello',
  mood: Mood.HAPPY,
  viewCount: 0,
  authorId: 'admin-id',
  createdAt: new Date('2026-05-18T00:00:00Z'),
  updatedAt: new Date('2026-05-18T00:00:00Z'),
  author: { id: 'admin-id', username: 'admin', role: Role.ADMIN, avatarUrl: null },
  postTags: [],
  images: [],
  files: [],
  _count: { reactions: 0, comments: 0 },
};

describe('SavedService', () => {
  let service: SavedService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn() },
      savedPost: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        SavedService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(SavedService);
  });

  describe('toggleSave', () => {
    it('404 nếu post không tồn tại', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.toggleSave('u1', 'nope')).rejects.toThrow(NotFoundException);
    });

    it('saved=true khi chưa có (create)', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.savedPost.findUnique.mockResolvedValue(null);
      const res = await service.toggleSave('u1', 'p1');
      expect(res).toEqual({ saved: true });
      expect(prisma.savedPost.create).toHaveBeenCalledWith({
        data: { userId: 'u1', postId: 'p1' },
      });
      expect(prisma.savedPost.delete).not.toHaveBeenCalled();
    });

    it('saved=false khi đã có (delete)', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.savedPost.findUnique.mockResolvedValue({ userId: 'u1' });
      const res = await service.toggleSave('u1', 'p1');
      expect(res).toEqual({ saved: false });
      expect(prisma.savedPost.delete).toHaveBeenCalledWith({
        where: { userId_postId: { userId: 'u1', postId: 'p1' } },
      });
      expect(prisma.savedPost.create).not.toHaveBeenCalled();
    });
  });

  describe('listSaved', () => {
    it('empty list', async () => {
      prisma.savedPost.findMany.mockResolvedValue([]);
      prisma.savedPost.count.mockResolvedValue(0);
      const res = await service.listSaved('u1', { page: 1, limit: 10 });
      expect(res).toEqual({ items: [], total: 0, page: 1, limit: 10 });
    });

    it('paginated query: where userId + skip/take + orderBy savedAt DESC', async () => {
      const savedAt = new Date('2026-05-18T10:00:00Z');
      prisma.savedPost.findMany.mockResolvedValue([{ post: basePost, savedAt }]);
      prisma.savedPost.count.mockResolvedValue(12);

      const res = await service.listSaved('u1', { page: 2, limit: 10 });

      expect(prisma.savedPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          orderBy: { savedAt: 'desc' },
          skip: 10,
          take: 10,
        }),
      );
      expect(prisma.savedPost.count).toHaveBeenCalledWith({ where: { userId: 'u1' } });
      expect(res.total).toBe(12);
      expect(res.page).toBe(2);
      expect(res.items[0].id).toBe('p1');
      expect(res.items[0].savedAt).toBe(savedAt);
    });

    it('mỗi item map sang PostView + savedAt field', async () => {
      const savedAt = new Date();
      prisma.savedPost.findMany.mockResolvedValue([{ post: basePost, savedAt }]);
      prisma.savedPost.count.mockResolvedValue(1);
      const res = await service.listSaved('u1', { page: 1, limit: 10 });
      expect(res.items[0].counts).toEqual({ reactions: 0, comments: 0 });
      expect(res.items[0].author.username).toBe('admin');
      expect(res.items[0].savedAt).toBe(savedAt);
    });
  });
});
