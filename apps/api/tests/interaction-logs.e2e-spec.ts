import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { InteractionAction, InteractionTargetType, Role } from '@prisma/client';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';
import { loginAs } from './_helpers/auth';
import { makeUser } from './_helpers/factory';

// FR-18.4 — admin list trace log. Admin-only + paginated + filter.
describe('GET /admin/interaction-logs (e2e) — FR-18', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookies: string;
  let userCookies: string;
  let userId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
    const alice = await makeUser(prisma, { username: 'alice', role: Role.USER });
    userId = alice.id;
    userCookies = await loginAs(app, { username: alice.username, password: alice.rawPassword });
    adminCookies = await loginAs(app, { username: 'test-admin', password: 'test-admin-password' });

    // Seed 3 logs: 2 anon COMMENT, 1 USER POST_REACTION
    await prisma.interactionLog.createMany({
      data: [
        {
          action: InteractionAction.COMMENT,
          targetType: InteractionTargetType.POST,
          targetId: 'p1',
          postId: 'p1',
          anonymousId: '0xAAA111',
          ip: '203.0.113.10',
          fingerprint: 'fp_anon_one_aa',
        },
        {
          action: InteractionAction.COMMENT,
          targetType: InteractionTargetType.POST,
          targetId: 'p2',
          postId: 'p2',
          anonymousId: '0xBBB222',
          ip: '198.51.100.5',
          fingerprint: 'fp_anon_two_bb',
        },
        {
          action: InteractionAction.POST_REACTION,
          targetType: InteractionTargetType.POST,
          targetId: 'p1',
          postId: 'p1',
          actorUserId: userId,
          actorRole: Role.USER,
          ip: '203.0.113.99',
          fingerprint: 'fp_user_cc',
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 anonymous (no JWT)', async () => {
    await request(app.getHttpServer()).get('/admin/interaction-logs').expect(401);
  });

  it('403 USER (non-admin)', async () => {
    await request(app.getHttpServer())
      .get('/admin/interaction-logs')
      .set('Cookie', userCookies)
      .expect(403);
  });

  it('200 admin → paginated desc + actor hydrate', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/interaction-logs')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.items).toHaveLength(3);
    // USER log có actor object; anon log actor null
    const userLog = res.body.data.items.find(
      (i: { action: string }) => i.action === 'POST_REACTION',
    );
    expect(userLog.actor.username).toBe('alice');
    expect(userLog.actorRole).toBe('USER');
    const anonLog = res.body.data.items.find(
      (i: { anonymousId?: string }) => i.anonymousId === '0xAAA111',
    );
    expect(anonLog.actor).toBeNull();
  });

  it('filter action=COMMENT → 2; actorType=user → 1; actorType=anon → 2', async () => {
    const byAction = await request(app.getHttpServer())
      .get('/admin/interaction-logs?action=COMMENT')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(byAction.body.data.total).toBe(2);

    const byUser = await request(app.getHttpServer())
      .get('/admin/interaction-logs?actorType=user')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(byUser.body.data.total).toBe(1);
    expect(byUser.body.data.items[0].actorRole).toBe('USER');

    const byAnon = await request(app.getHttpServer())
      .get('/admin/interaction-logs?actorType=anon')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(byAnon.body.data.total).toBe(2);
  });

  it('filter q (ip/fingerprint) + pagination', async () => {
    const byIp = await request(app.getHttpServer())
      .get('/admin/interaction-logs?q=203.0.113.10')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(byIp.body.data.total).toBe(1);
    expect(byIp.body.data.items[0].anonymousId).toBe('0xAAA111');

    const byFp = await request(app.getHttpServer())
      .get('/admin/interaction-logs?q=fp_user')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(byFp.body.data.total).toBe(1);

    const page1 = await request(app.getHttpServer())
      .get('/admin/interaction-logs?limit=2&page=1')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(page1.body.data.items).toHaveLength(2);
    expect(page1.body.data.total).toBe(3);
  });
});
