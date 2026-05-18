// E2E-08 — Admin delete comment (via DELETE /comments/:id)
import { test, expect, request as pwRequest } from '@playwright/test';
import { resetDb, E2E_USERS } from './_helpers/seed';

const API = process.env.E2E_API_URL ?? 'http://localhost:3001';

test.describe('E2E-08 Admin moderate (delete comment)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('admin xoá comment → biến mất khỏi post detail', async ({ page }) => {
    const ctx = await pwRequest.newContext();
    await ctx.post(`${API}/auth/login`, { data: E2E_USERS.admin });
    const postRes = await ctx.post(`${API}/posts`, {
      data: { content: 'host post', mood: 'CALM' },
    });
    const post = await postRes.json();
    const commentRes = await ctx.post(`${API}/posts/${post.id}/comments`, {
      data: { content: 'spam comment', anonymousName: 'Anon' },
    });
    const comment = await commentRes.json();

    const del = await ctx.delete(`${API}/comments/${comment.id}`);
    expect(del.ok()).toBeTruthy();
    await ctx.dispose();

    await page.goto(`/post/${post.id}`);
    await expect(page.getByText('spam comment')).toHaveCount(0);
  });
});
