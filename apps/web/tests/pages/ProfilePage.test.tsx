import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '@/pages/ProfilePage';
import { ToastProvider } from '@/components/shared/Toast';
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
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/profile/:username" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
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

  it('non-self viewer → no action buttons (Saved tab vẫn visible per design)', async () => {
    wrap('/profile/alice');
    await waitFor(() => expect(screen.getByTestId('profile-username')).toBeInTheDocument());
    // test-stale-assumption: "Edit Profile" link replaced by ✏️ New Post + ⚙️ Settings buttons (self only)
    expect(screen.queryByRole('link', { name: /new post/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    // Design update 2026-05-29: tất cả 4 tab luôn visible (Posts/Saved/Activity/About).
    // Content `canViewSaved` vẫn gate render data — non-self viewer chuyển sang Saved
    // sẽ thấy empty state, không phải tab bị ẩn.
    expect(screen.getByRole('tab', { name: 'Saved' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
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

  it('about tab → renders bio/skills/profile-info grid sections (T-413 BUG-010)', async () => {
    wrap('/profile/alice?tab=about');
    await waitFor(() => expect(screen.getByTestId('profile-username')).toBeInTheDocument());
    expect(screen.getByText('// about.me')).toBeInTheDocument();
    // bio card inner sub-label (was missing pre-T-413)
    expect(screen.getByText('// bio')).toBeInTheDocument();
    expect(screen.getByText('// skills.stack')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/code/i).length).toBeGreaterThan(0));
    // T-413 BUG-010: was `// info` (stats grid) → now `// profile.info` (profile metadata 8 cells)
    await waitFor(() => expect(screen.getByText('// profile.info')).toBeInTheDocument());
    expect(screen.getByTestId('profile-info-full-name')).toBeInTheDocument();
    expect(screen.getByTestId('profile-info-handle')).toBeInTheDocument();
    expect(screen.getByTestId('profile-info-role')).toBeInTheDocument();
    expect(screen.getByTestId('profile-info-joined')).toBeInTheDocument();
    expect(screen.getByTestId('profile-info-github')).toBeInTheDocument();
    expect(screen.getByTestId('profile-info-website')).toBeInTheDocument();
  });

  it('regression BUG-010: Saved tab shows // saved.posts <N items> header', async () => {
    // Self viewer (isSelf=true → canViewSaved=true)
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
      http.get(`${API}/me/saved`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, limit: 20 }),
      ),
    );
    wrap('/profile/alice?tab=saved');
    await waitFor(() => expect(screen.getByTestId('profile-username')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('// saved.posts')).toBeInTheDocument());
    expect(screen.getByText('0 items')).toBeInTheDocument();
  });

  it('regression BUG-010: Activity tab shows // contribution.activity + // recent.actions sub-headers', async () => {
    // Self viewer (isSelf=true → canViewSaved=true)
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
      http.get(`${API}/users/u-alice/activity`, () => HttpResponse.json({ items: [], total: 0 })),
    );
    wrap('/profile/alice?tab=activity');
    await waitFor(() => expect(screen.getByTestId('profile-username')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/contribution\.activity/)).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByText(/recent\.actions/)).toBeInTheDocument();
    // Heatmap large variant
    expect(screen.getByTestId('heatmap-large')).toBeInTheDocument();
  });
});
