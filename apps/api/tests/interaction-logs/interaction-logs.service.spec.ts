import { Test } from '@nestjs/testing';
import { InteractionAction, InteractionTargetType, Role } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { InteractionLogService } from '@/interaction-logs/interaction-logs.service';

type MockPrisma = { interactionLog: { create: jest.Mock } };

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

describe('InteractionLogService (FR-18)', () => {
  let service: InteractionLogService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = { interactionLog: { create: jest.fn().mockResolvedValue({ id: 'log1' }) } };
    const moduleRef = await Test.createTestingModule({
      providers: [InteractionLogService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(InteractionLogService);
  });

  it('skip log khi actor là ADMIN (FR-18.1)', async () => {
    await service.log({
      action: InteractionAction.POST_REACTION,
      targetType: InteractionTargetType.POST,
      targetId: 'p1',
      actorUserId: 'admin1',
      actorRole: Role.ADMIN,
    });
    expect(prisma.interactionLog.create).not.toHaveBeenCalled();
  });

  it('log anonymous interaction + parse UA → browser/os/device + fingerprint', async () => {
    await service.log({
      action: InteractionAction.COMMENT,
      targetType: InteractionTargetType.POST,
      targetId: 'p1',
      postId: 'p1',
      anonymousId: '0xABC123',
      client: { ip: '203.0.113.7', userAgent: CHROME_UA, acceptLanguage: 'vi-VN' },
      metadata: { snippet: 'hello' },
    });
    expect(prisma.interactionLog.create).toHaveBeenCalledTimes(1);
    const data = prisma.interactionLog.create.mock.calls[0][0].data;
    expect(data.action).toBe(InteractionAction.COMMENT);
    expect(data.actorUserId).toBeNull();
    expect(data.actorRole).toBeNull();
    expect(data.anonymousId).toBe('0xABC123');
    expect(data.ip).toBe('203.0.113.7');
    expect(data.browser).toContain('Chrome');
    expect(data.os).toContain('macOS');
    expect(data.device).toBe('desktop');
    expect(data.fingerprint).toMatch(/^[a-f0-9]{16}$/);
  });

  it('log USER interaction giữ actorUserId + actorRole=USER', async () => {
    await service.log({
      action: InteractionAction.COMMENT_LIKE,
      targetType: InteractionTargetType.COMMENT,
      targetId: 'c1',
      postId: 'p1',
      actorUserId: 'u1',
      actorRole: Role.USER,
      client: { ip: '198.51.100.2', userAgent: CHROME_UA },
    });
    const data = prisma.interactionLog.create.mock.calls[0][0].data;
    expect(data.actorUserId).toBe('u1');
    expect(data.actorRole).toBe(Role.USER);
    expect(data.targetType).toBe(InteractionTargetType.COMMENT);
  });

  it('fingerprint ổn định theo (ip+ua+lang), null khi không có client data', async () => {
    const c = { ip: '1.2.3.4', userAgent: CHROME_UA, acceptLanguage: 'en' };
    await service.log({
      action: InteractionAction.POST_REACTION,
      targetType: InteractionTargetType.POST,
      targetId: 'p1',
      client: c,
    });
    await service.log({
      action: InteractionAction.POST_REACTION,
      targetType: InteractionTargetType.POST,
      targetId: 'p2',
      client: c,
    });
    const fp1 = prisma.interactionLog.create.mock.calls[0][0].data.fingerprint;
    const fp2 = prisma.interactionLog.create.mock.calls[1][0].data.fingerprint;
    expect(fp1).toBe(fp2); // cùng thiết bị → cùng fingerprint

    await service.log({
      action: InteractionAction.POST_REACTION,
      targetType: InteractionTargetType.POST,
      targetId: 'p3',
    }); // no client
    expect(prisma.interactionLog.create.mock.calls[2][0].data.fingerprint).toBeNull();
  });

  it('best-effort: prisma lỗi KHÔNG throw (không block hành động gốc)', async () => {
    prisma.interactionLog.create.mockRejectedValueOnce(new Error('db down'));
    await expect(
      service.log({
        action: InteractionAction.REPLY,
        targetType: InteractionTargetType.POST,
        targetId: 'p1',
        client: { ip: '1.1.1.1' },
      }),
    ).resolves.toBeUndefined();
  });
});
