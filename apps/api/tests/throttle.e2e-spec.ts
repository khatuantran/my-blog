import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from 'nestjs-prisma';
import { createTestApp } from './_helpers/test-app';
import { resetDb } from './_helpers/db-reset';

describe('Throttle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let originalThrottleEnv: string | undefined;

  beforeAll(async () => {
    // Opt-in throttle bằng cách xoá flag — app boot sẽ thấy skipIf=false
    originalThrottleEnv = process.env.THROTTLE_DISABLED;
    delete process.env.THROTTLE_DISABLED;
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
    // Restore env cho test sau (chạy --runInBand, share process)
    if (originalThrottleEnv !== undefined) {
      process.env.THROTTLE_DISABLED = originalThrottleEnv;
    }
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  it('POST /auth/register: request thứ 11 trả 429 RATE_LIMITED', async () => {
    // @Throttle({ default: { limit: 10, ttl: 60_000 } }) trên register
    // 10 request đầu trả 201 hoặc validation error (4xx) — KHÔNG quan trọng status,
    // miễn KHÔNG là 429. Request 11 mới là 429.
    let throttledAt = -1;
    for (let i = 0; i < 12; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: `burst${i}`, password: 'password123' });
      if (res.status === 429) {
        throttledAt = i;
        expect(res.body.error.code).toBe('RATE_LIMITED');
        break;
      }
    }
    expect(throttledAt).toBeGreaterThanOrEqual(10);
    expect(throttledAt).toBeLessThanOrEqual(11);
  });

  it('GET /posts: KHÔNG bị throttle 10/min (global 100/min cho phép)', async () => {
    // 20 GET liên tiếp → không có 429 (global limit 100, chưa hit)
    for (let i = 0; i < 20; i++) {
      const res = await request(app.getHttpServer()).get('/posts');
      expect(res.status).toBe(200);
    }
  });
});
