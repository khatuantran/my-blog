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
import { PostCard } from '@/components/feed/PostCard';
import { MoodBar } from '@/components/admin/MoodBar';
import { TagPill } from '@/components/shared/TagPill';
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
      {/* Hero */}
      <section className="mb-5 flex items-start gap-5 rounded-md border border-b2 bg-surf p-5">
        <ProfileAvatar username={user.username} avatarUrl={user.avatarUrl} size={88} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-mono-lg text-blu">~/{user.username}</span>
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
          {user.title && <div className="mt-1 text-sm text-ts">{user.title}</div>}
          {user.bio && <div className="mt-2 line-clamp-3 text-sm text-tm">{user.bio}</div>}
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-mono-sm text-tm">
            <span>
              <span className="text-cyan">{formatStat(stats?.postsCount ?? 0)}</span> posts
            </span>
            <span>
              <span className="text-mag">{formatStat(stats?.likesReceived ?? 0)}</span> likes
            </span>
            <span>
              <span className="text-grn">{formatStat(stats?.viewsTotal ?? 0)}</span> views
            </span>
            {(stats?.streak ?? 0) > 0 && (
              <span>
                🔥 <span className="text-ora">{stats?.streak}</span>-day streak
              </span>
            )}
          </div>
        </div>
        {isSelf && (
          <Link
            to="?edit=1"
            className="rounded-sm border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-mono-sm text-cyan hover:bg-cyan/20"
          >
            ✎ Edit Profile
          </Link>
        )}
      </section>

      {/* Layout: main + sidebar */}
      <div className="flex gap-5">
        <main className="min-w-0 flex-1">
          <TabButtons<Tab>
            value={tab}
            tabs={[
              { value: 'posts', label: 'Posts' },
              { value: 'saved', label: 'Saved', hidden: !canViewSaved },
              { value: 'activity', label: 'Activity', hidden: !canViewSaved },
              { value: 'about', label: 'About' },
            ]}
            onChange={changeTab}
          />

          <div className="mt-4">
            {tab === 'posts' && <PostsTab userId={user.id} />}
            {tab === 'saved' && canViewSaved && <SavedTab />}
            {tab === 'activity' && canViewSaved && (
              <div className="rounded-md border border-b2 bg-surf p-4">
                <ProfileActivityList userId={user.id} />
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
                <Block title="// tags.used">
                  {(stats?.tagsUsed.length ?? 0) === 0 ? (
                    <div className="font-mono text-mono-sm text-td">// no tags yet</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {stats!.tagsUsed.map((t) => (
                        <TagPill key={t.name} name={t.name} color={t.color} />
                      ))}
                    </div>
                  )}
                </Block>
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
                    {s.name}
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

          <Block title="// activity.28d">
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
              <div className="flex flex-wrap gap-1.5">
                {stats!.tagsUsed.slice(0, 8).map((t) => (
                  <TagPill key={t.name} name={t.name} color={t.color} />
                ))}
              </div>
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
    <>
      {posts.map((p, i) => (
        <PostCard key={p.id} post={p} delay={i * 40} />
      ))}
    </>
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
    <>
      {data.items.map((p, i) => (
        <PostCard key={p.id} post={p} delay={i * 40} />
      ))}
    </>
  );
}
