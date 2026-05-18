import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

/** Parse Set-Cookie array → join thành single Cookie header value. */
export function extractCookies(setCookieHeader: string[] | undefined): string {
  if (!setCookieHeader) return '';
  return setCookieHeader.map((c) => c.split(';')[0]).join('; ');
}

/** Login + return cookie header value. */
export async function loginAs(
  app: INestApplication,
  credentials: { username: string; password: string },
): Promise<string> {
  const res = await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(200);
  return extractCookies(res.headers['set-cookie'] as unknown as string[]);
}
