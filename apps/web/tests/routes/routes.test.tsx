import { describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { routes } from '@/routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <Suspense fallback={<div>loading…</div>}>
      <RouterProvider router={router} />
    </Suspense>,
  );
}

describe('App router', () => {
  it('renders HomePage at /', async () => {
    renderAt('/');
    expect(await screen.findByText(/feed coming soon/i)).toBeInTheDocument();
  });

  it('renders PostDetailPage at /post/:id với id từ URL', async () => {
    renderAt('/post/abc123');
    expect(await screen.findByText(/post.detail \[abc123\] coming soon/i)).toBeInTheDocument();
  });

  it('renders AdminPage at /admin (admin role allowed)', async () => {
    renderAt('/admin');
    expect(await screen.findByText(/admin.dashboard coming soon/i)).toBeInTheDocument();
  });

  it('renders CreatePostPage at /admin/create (admin role allowed)', async () => {
    renderAt('/admin/create');
    expect(await screen.findByText(/create.post coming soon/i)).toBeInTheDocument();
  });

  it('renders LoginPage at /auth/login với AuthLayout (no shell)', async () => {
    renderAt('/auth/login');
    expect(await screen.findByText(/auth.login coming soon/i)).toBeInTheDocument();
    // AuthLayout không có TopBar/StatusBar slots
    expect(document.querySelector('[data-slot="topbar"]')).toBeNull();
    expect(document.querySelector('[data-slot="statusbar"]')).toBeNull();
  });

  it('renders NotFoundPage cho unknown route', async () => {
    renderAt('/this-does-not-exist');
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('AppLayout shell có TopBar + StatusBar placeholder slots', async () => {
    renderAt('/');
    await screen.findByText(/feed coming soon/i);
    expect(document.querySelector('[data-slot="topbar"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="statusbar"]')).not.toBeNull();
  });
});
