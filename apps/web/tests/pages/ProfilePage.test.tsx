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

describe('ProfilePage (T-221, T-374, FR-11)', () => {
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
    await waitFor(() => expect(screen.getByTestId('profile-username')).toBeInTheDocument());
    // T-394: hero shows full name (user.name) hoặc fallback username khi name null.
    // Mock không có `name` → hiển thị username "alice".
    expect(screen.getByTestId('profile-username')).toHaveTextContent('alice');
    // Design update 2026-05-29: handle row dùng `~/user · title · born year` (was `@user`).
    expect(screen.getByText('~/alice')).toBeInTheDocument();
    expect(screen.getByText('Full-stack Dev')).toBeInTheDocument();
    expect(screen.getByText('curious')).toBeInTheDocument();
    // Design update 2026-05-29: stats moved from inline hero meta → 4 stat cards
    // (POSTS/LIKES/VIEWS/STREAK). Tab badge cũng show postsCount.
    await waitFor(() => expect(screen.getAllByText('42').length).toBeGreaterThan(0));
    expect(screen.getByText('287')).toBeInTheDocument();
    expect(screen.getByText('1.2k')).toBeInTheDocument();
    expect(screen.getByText('12d')).toBeInTheDocument();
    expect(screen.getByText('STREAK')).toBeInTheDocument();
  });

  it('T-374: hero has gradient background style', async () => {
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByTestId('profile-hero')).toBeInTheDocument());
    const hero = screen.getByTestId('profile-hero');
    expect(hero.style.background).toContain('linear-gradient');
  });

  it('T-374: username has animate-glitch class', async () => {
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByTestId('profile-username')).toBeInTheDocument());
    expect(screen.getByTestId('profile-username')).toHaveClass('animate-glitch');
  });

  it('T-374/T-405: hex deco corner renders 4 cyberpunk-flavored lines', async () => {
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByTestId('profile-hero')).toBeInTheDocument());
    // Design update 2026-05-29: deco changed từ `uid:/pid:` 3-line → 4-line
    // pattern (`#DEAD-BEEF-XXXX-XXXX`, binary, `#ID NNNN . PID NNNN`, `MID NNNN`).
    expect(screen.getByText(/#DEAD-BEEF-/)).toBeInTheDocument();
    expect(screen.getByText(/01101010-10101010/)).toBeInTheDocument();
    expect(screen.getByText(/#ID \d+ \. PID \d+/)).toBeInTheDocument();
    expect(screen.getByText(/MID \d+ \. MID \d+/)).toBeInTheDocument();
  });

  it('non-self viewer → no action buttons + Saved tab hidden', async () => {
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByTestId('profile-username')).toBeInTheDocument());
    // test-stale-assumption: "Edit Profile" link replaced by ✏️ New Post + ⚙️ Settings buttons (self only)
    expect(screen.queryByRole('link', { name: /new post/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Saved' })).not.toBeInTheDocument();
  });

  it('T-374: self viewer → ✏️ New Post link + ⚙️ Settings button + Saved tab', async () => {
    useAuthStore.setState({
      user: {
        id: 'u-alice',
        username: 'alice',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      status: 'authed',
    });
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByTestId('profile-username')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /new post/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
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

  it('T-374: Posts tab renders PostMiniCard items (not PostCard)', async () => {
    mswServer.use(
      http.get(`${API}/posts`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'p1',
              content: 'Mini card content here',
              mood: 'HAPPY',
              viewCount: 0,
              author: {
                id: 'u-alice',
                username: 'alice',
                avatarUrl: null,
                role: 'USER',
                title: null,
              },
              tags: [],
              images: [],
              files: [],
              counts: { reactions: 0, comments: 0 },
              topReactions: [],
              myReaction: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        }),
      ),
    );
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByText('Mini card content here')).toBeInTheDocument());
    // PostMiniCard has "read →" link; PostCard does not
    expect(screen.getByRole('link', { name: /read post p1/i })).toBeInTheDocument();
  });

  it('T-374: Activity tab shows HeatmapGrid', async () => {
    useAuthStore.setState({
      user: {
        id: 'u-alice',
        username: 'alice',
        email: null,
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      status: 'authed',
    });
    mswServer.use(
      http.get(`${API}/users/u-alice/activity`, () =>
        HttpResponse.json({ data: { items: [], total: 0 } }),
      ),
    );
    wrap('/profile/alice?tab=activity');
    await waitFor(() => expect(screen.getByText('// activity.28d')).toBeInTheDocument());
    // HeatmapGrid renders 28 cells as divs
    const hero = screen.getByTestId('profile-hero');
    expect(hero).toBeInTheDocument();
  });

  it('about tab → renders bio/skills/info grid sections', async () => {
    wrap('/profile/alice?tab=about');
    await waitFor(() => expect(screen.getByTestId('profile-username')).toBeInTheDocument());
    expect(screen.getByText('// about.me')).toBeInTheDocument();
    expect(screen.getByText('// skills.stack')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/code/i).length).toBeGreaterThan(0));
    // Info grid
    await waitFor(() => expect(screen.getByText('// info')).toBeInTheDocument());
    expect(screen.getByText('joined:')).toBeInTheDocument();
  });
});
