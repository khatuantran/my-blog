import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '@/pages/ProfilePage';
import { mswServer } from '../_helpers/msw-server';
import { useAuthStore } from '@/stores/auth-store';
import { MOOD_KEYS } from '@/lib/mood-config';

const API = 'http://localhost:3001';

function wrap(path: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function profileUserResponse() {
  return {
    id: 'u-alice',
    username: 'alice',
    email: null,
    role: 'USER' as const,
    avatarUrl: null,
    title: 'Full-stack Dev',
    bio: 'curious',
    skills: [{ name: 'TypeScript', color: '#7DCFFF' }],
    createdAt: '2026-05-01T00:00:00.000Z',
  };
}

function statsResponse() {
  return {
    postsCount: 42,
    likesReceived: 287,
    commentsReceived: 64,
    viewsTotal: 1240,
    streak: 12,
    heatmap28d: Array.from({ length: 28 }, (_, i) => ({
      date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      count: i % 3,
    })),
    moodBreakdown: Object.fromEntries(MOOD_KEYS.map((m) => [m, 0])) as Record<
      (typeof MOOD_KEYS)[number],
      number
    >,
    tagsUsed: [{ name: 'code', color: '#00FFE5', count: 5 }],
  };
}

describe('ProfilePage (T-221, FR-11)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u-viewer',
        username: 'viewer',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      status: 'authed',
    });
    mswServer.use(
      http.get(`${API}/users/by-username/alice`, () => HttpResponse.json(profileUserResponse())),
      http.get(`${API}/users/u-alice/stats`, () => HttpResponse.json(statsResponse())),
      http.get(`${API}/posts`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, limit: 10 }),
      ),
    );
  });

  it('renders hero — username + title + bio + stats', async () => {
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByText('~/alice')).toBeInTheDocument());
    expect(screen.getByText('Full-stack Dev')).toBeInTheDocument();
    expect(screen.getByText('curious')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.getByText('287')).toBeInTheDocument();
    expect(screen.getByText('1.2k')).toBeInTheDocument();
    expect(screen.getByText(/day streak/i)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('non-self viewer → no "Edit Profile" button + Saved tab hidden', async () => {
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByText('~/alice')).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /edit profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Saved' })).not.toBeInTheDocument();
  });

  it('self viewer → "Edit Profile" link + Saved tab visible', async () => {
    useAuthStore.setState({
      user: {
        id: 'u-alice', // matches profile user id
        username: 'alice',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      status: 'authed',
    });
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByText('~/alice')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /edit profile/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Saved' })).toBeInTheDocument();
  });

  it('404 user not found → renders fallback hint', async () => {
    mswServer.use(
      http.get(`${API}/users/by-username/nope`, () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    );
    wrap('/profile/nope');
    await waitFor(() => expect(screen.getByText(/user @nope not found/i)).toBeInTheDocument());
  });

  it('about tab → renders bio/skills/tags.used sections', async () => {
    wrap('/profile/alice?tab=about');
    await waitFor(() => expect(screen.getByText('~/alice')).toBeInTheDocument());
    expect(screen.getByText('// about.me')).toBeInTheDocument();
    expect(screen.getByText('// skills.stack')).toBeInTheDocument();
    // TagPill cho 'code'
    await waitFor(() => expect(screen.getAllByText(/code/i).length).toBeGreaterThan(0));
  });
});
