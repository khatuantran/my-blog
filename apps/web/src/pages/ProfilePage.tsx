import { Link, useParams, useSearchParams } from 'react-router';
import { ApiError } from '@/services/api/client';
import { useUserByUsername, useUserStats } from '@/hooks/queries/use-profile';
import { useAuth } from '@/hooks/use-auth';
import { usePostsInfinite } from '@/hooks/queries/use-posts';
import { listSavedPosts } from '@/services/api/saved';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { ProfileAvatar } from '@/components/shared/ProfileAvatar';
import { HeatmapGrid } from '@/components/shared/HeatmapGrid';
import { TabButtons } from '@/components/shared/TabButtons';
import { EditProfileDrawer } from '@/components/profile/EditProfileDrawer';
import { ProfileActivityList } from '@/components/profile/ProfileActivityList';
import { PostMiniCard } from '@/components/profile/PostMiniCard';
import { MoodBar } from '@/components/admin/MoodBar';
import { TagPill } from '@/components/shared/TagPill';
import { StatCard } from '@/components/admin/StatCard';
import { MOOD_KEYS } from '@/lib/mood-config';
import type { Post } from '@/types/api';

type Tab = 'posts' | 'saved' | 'activity' | 'about';

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: viewer } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab | null) ?? 'posts';

  const { data: user, isLoading, isError, error } = useUserByUsername(username);
  const isSelf = !!user && viewer?.id === user.id;
  const isAdmin = viewer?.role === 'ADMIN';
  const canViewSaved = isSelf || isAdmin;

  const { data: stats } = useUserStats(user?.id);
  const editing = params.get('edit') === '1';

  function closeEditor() {
    const next = new URLSearchParams(params);
    next.delete('edit');
    setParams(next, { replace: true });
  }

  function openEditor() {
    const next = new URLSearchParams(params);
    next.set('edit', '1');
    setParams(next, { replace: true });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] py-16 text-center font-mono text-tm">
        ⠋ loading profile...
      </div>
    );
  }

  if (isError) {
    const is404 = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-[1100px] py-16 text-center font-mono">
        <div className="mb-3 text-5xl opacity-30">?</div>
        <div className="text-tm">
          {is404 ? `// user @${username} not found` : '// failed to load profile'}
        </div>
        <Link to="/" className="mt-3 inline-block text-mono-sm text-cyan hover:underline">
          ← back to feed
        </Link>
      </div>
    );
  }

  if (!user) return null;

  function changeTab(v: Tab) {
    const next = new URLSearchParams(params);
    if (v === 'posts') next.delete('tab');
    else next.set('tab', v);
    setParams(next, { replace: true });
  }

  const moodEntries = MOOD_KEYS.map((m) => ({
    mood: m,
    count: stats?.moodBreakdown[m] ?? 0,
  }));
  const moodTotal = moodEntries.reduce((acc, e) => acc + e.count, 0);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-6">
      {/* Hero banner */}
      <section
        className="relative mb-5 overflow-hidden rounded-lg border border-b2 p-6"
        style={{ background: 'linear-gradient(180deg, #0F1525, #0A0E1A)' }}
        data-testid="profile-hero"
      >
        {/* Hex deco corner */}
        <div
          aria-hidden
          className="absolute right-4 top-3 select-none text-right font-mono text-[11px] leading-snug text-b2"
        >
          <div>01001101</div>
          <div>uid:{user.id.slice(0, 8)}</div>
          <div>pid:{user.id.slice(-4)}</div>
        </div>

        <div className="flex items-start gap-5">
          <ProfileAvatar username={user.username} avatarUrl={user.avatarUrl} size={88} />

          <div className="min-w-0 flex-1">
            {/* Name row */}
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className="font-brand text-[26px] font-bold text-tp animate-glitch"
                data-testid="profile-username"
              >
                {user.name || user.username}
              </span>
              <span
                className={`inline-flex items-center rounded-sm border font-mono text-mono-sm leading-none ${
                  user.role === 'ADMIN'
                    ? 'border-ora/50 bg-ora/[0.06] text-ora'
                    : user.role === 'BANNED'
                      ? 'border-red/50 bg-red/[0.06] text-red'
                      : 'border-b2 text-tm'
                }`}
                style={{ padding: '1px 6px' }}
              >
                [ {user.role} ]
              </span>
            </div>

            {/* Handle row: ~/user · title · born year (single line per design) */}
            <div className="mb-2 flex flex-wrap items-center gap-x-2 font-mono text-[14px]">
              <span className="text-cyan">~/{user.username}</span>
              {user.title && (
                <>
                  <span className="text-td">·</span>
                  <span className="text-tm">{user.title}</span>
                </>
              )}
              {user.bornYear && (
                <>
                  <span className="text-td">·</span>
                  <span className="text-tm">born {user.bornYear}</span>
                </>
              )}
            </div>

            {user.bio && <div className="mb-2 whitespace-pre-wrap text-sm text-tm">{user.bio}</div>}

            {/* Meta icons row (location · joined · github · website) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-mono-md text-tm">
              {user.location && (
                <span>
                  <span aria-hidden>📍</span> {user.location}
                </span>
              )}
              <span>
                <span aria-hidden>📅</span> joined{' '}
                {new Date(user.createdAt).toISOString().slice(0, 7)}
              </span>
              {user.github && (
                <a
                  href={`https://github.com/${user.github.replace(/^github\.com\//, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-tm no-underline hover:text-cyan"
                >
                  <span aria-hidden># </span>
                  {user.github.replace(/^https?:\/\//, '')}
                </a>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-tm no-underline hover:text-cyan"
                >
                  <span aria-hidden>🌐</span>{' '}
                  {user.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
            </div>
          </div>

          {/* Action buttons (self only) */}
          {isSelf && (
            <div className="flex shrink-0 flex-col gap-2">
              <Link
                to="/admin/create"
                className="rounded-sm border border-cyan/50 bg-cyan/10 px-3 py-1.5 font-mono text-mono-sm text-cyan hover:bg-cyan/20"
                aria-label="New Post"
              >
                ✏️ New Post
              </Link>
              <button
                type="button"
                onClick={openEditor}
                aria-label="Edit Profile"
                className="rounded-sm border border-b2 bg-surf px-3 py-1.5 font-mono text-mono-sm text-tm hover:text-tp"
              >
                ⚙️ Settings
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Layout: main + sidebar */}
      <div className="flex gap-5">
        <main className="min-w-0 flex-1">
          <TabButtons<Tab>
            value={tab}
            tabs={[
              { value: 'posts', label: 'Posts', count: stats?.postsCount },
              { value: 'saved', label: 'Saved', hidden: !canViewSaved },
              { value: 'activity', label: 'Activity', hidden: !canViewSaved },
              { value: 'about', label: 'About' },
            ]}
            onChange={changeTab}
          />

          <div className="mt-4">
            {tab === 'posts' && stats && (
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard
                  label="POSTS"
                  value={formatStat(stats.postsCount)}
                  color="#00FFE5"
                  sparkline={stats.heatmap28d.map((c) => c.count)}
                />
                <StatCard
                  label="LIKES"
                  value={formatStat(stats.likesReceived)}
                  color="#FF6E96"
                  sparkline={stats.heatmap28d.map((c) => c.count)}
                />
                <StatCard
                  label="VIEWS"
                  value={formatStat(stats.viewsTotal)}
                  color="#E0AF68"
                  sparkline={stats.heatmap28d.map((c) => c.count)}
                />
                <StatCard
                  label="STREAK"
                  value={`${stats.streak}d`}
                  color="#BB9AF7"
                  sparkline={stats.heatmap28d.map((c) => c.count)}
                />
              </div>
            )}
            {tab === 'posts' && <PostsTab userId={user.id} />}
            {tab === 'saved' && canViewSaved && <SavedTab />}
            {tab === 'activity' && canViewSaved && (
              <div className="space-y-4">
                {stats && (
                  <div className="rounded-md border border-b2 bg-surf p-4">
                    <div className="mb-2 font-mono text-mono-sm text-tm">// activity.28d</div>
                    <HeatmapGrid cells={stats.heatmap28d} />
                  </div>
                )}
                <div className="rounded-md border border-b2 bg-surf p-4">
                  <ProfileActivityList userId={user.id} />
                </div>
              </div>
            )}
            {tab === 'about' && (
              <div className="space-y-4">
                <Block title="// about.me">
                  <div className="whitespace-pre-wrap text-sm text-tp">
                    {user.bio || '// no bio yet'}
                  </div>
                </Block>
                <Block title="// skills.stack">
                  {(user.skills?.length ?? 0) === 0 ? (
                    <div className="font-mono text-mono-sm text-td">// no skills added</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user.skills!.map((s) => (
                        <span
                          key={s.name}
                          className="rounded-sm border px-2 py-0.5 font-mono text-mono-sm"
                          style={{
                            color: s.color,
                            borderColor: `${s.color}50`,
                            background: `${s.color}10`,
                          }}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </Block>
                {stats && <InfoGrid stats={stats} joinedAt={user.createdAt} />}
              </div>
            )}
          </div>
        </main>

        <aside
          className="hidden w-[280px] shrink-0 space-y-4 lg:block"
          aria-label="Profile sidebar"
        >
          <Block title="// skills.top">
            {(user.skills?.length ?? 0) === 0 ? (
              <div className="font-mono text-mono-sm text-td">// none</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {user.skills!.slice(0, 6).map((s) => (
                  <span
                    key={s.name}
                    className="rounded-sm border px-2 py-0.5 font-mono text-mono-sm"
                    style={{
                      color: s.color,
                      borderColor: `${s.color}50`,
                      background: `${s.color}10`,
                    }}
                  >
                    <span className="opacity-70">›</span> {s.name}
                  </span>
                ))}
              </div>
            )}
          </Block>

          <Block title="// mood.breakdown">
            {moodTotal === 0 ? (
              <div className="font-mono text-mono-sm text-td">// no posts yet</div>
            ) : (
              <div className="space-y-1.5">
                {moodEntries.map((e) => (
                  <MoodBar key={e.mood} mood={e.mood} count={e.count} total={moodTotal} />
                ))}
              </div>
            )}
          </Block>

          <Block
            title={
              stats
                ? `// activity.28d  ${stats.heatmap28d.reduce((a, c) => a + c.count, 0)}`
                : '// activity.28d'
            }
          >
            {stats ? (
              <HeatmapGrid cells={stats.heatmap28d} />
            ) : (
              <div className="font-mono text-mono-sm text-td">⠋</div>
            )}
          </Block>

          <Block title="// tags.used">
            {(stats?.tagsUsed.length ?? 0) === 0 ? (
              <div className="font-mono text-mono-sm text-td">// none</div>
            ) : (
              <ul className="space-y-1.5">
                {stats!.tagsUsed.slice(0, 8).map((t) => (
                  <li key={t.name} className="flex items-center justify-between gap-2">
                    <TagPill name={t.name} color={t.color} />
                    <span className="shrink-0 font-mono text-mono-sm text-td">
                      {t.count} post{t.count === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
        </aside>
      </div>

      {isSelf && <EditProfileDrawer open={editing} user={user} onClose={closeEditor} />}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-b2 bg-surf p-3">
      <div className="mb-2 font-mono text-mono-sm text-tm">{title}</div>
      {children}
    </div>
  );
}

function InfoGrid({
  stats,
  joinedAt,
}: {
  stats: NonNullable<ReturnType<typeof useUserStats>['data']>;
  joinedAt: string;
}) {
  const joined = new Date(joinedAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const topMood = Object.entries(stats.moodBreakdown).sort(([, a], [, b]) => b - a)[0];
  const topTag = stats.tagsUsed[0];

  const rows: [string, string][] = [
    ['joined', joined],
    ['posts', String(stats.postsCount)],
    ['likes received', String(stats.likesReceived)],
    ['comments', String(stats.commentsReceived)],
    ['views', String(stats.viewsTotal)],
    ['streak', `${stats.streak}d`],
    ['top mood', topMood ? topMood[0].toLowerCase() : '—'],
    ['top tag', topTag ? topTag.name : '—'],
  ];

  return (
    <Block title="// info">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-1">
            <dt className="font-mono text-[11px] text-td">{k}:</dt>
            <dd className="font-mono text-[12px] text-ts">{v}</dd>
          </div>
        ))}
      </dl>
    </Block>
  );
}

function PostsTab({ userId }: { userId: string }) {
  const { data, isLoading } = usePostsInfinite({});
  if (isLoading) {
    return <div className="py-8 text-center font-mono text-mono-sm text-tm">⠋ loading...</div>;
  }
  const posts: Post[] =
    data?.pages.flatMap((p) => p.items).filter((p) => p.author.id === userId) ?? [];
  if (posts.length === 0) {
    return <div className="py-12 text-center font-mono text-mono-sm text-tm">// no posts yet</div>;
  }
  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <PostMiniCard key={p.id} post={p} />
      ))}
    </div>
  );
}

function SavedTab() {
  const { data, isLoading } = useQuery({
    queryKey: qk.saved.list({}),
    queryFn: () => listSavedPosts(),
  });
  if (isLoading)
    return <div className="py-8 text-center font-mono text-mono-sm text-tm">⠋ loading...</div>;
  if (!data || data.items.length === 0)
    return (
      <div className="py-12 text-center font-mono text-mono-sm text-tm">// no saved posts</div>
    );
  return (
    <div className="space-y-3">
      {data.items.map((p) => (
        <PostMiniCard key={p.id} post={p} />
      ))}
    </div>
  );
}
