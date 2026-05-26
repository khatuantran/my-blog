import { Link } from 'react-router';
import { StatCard } from '@/components/admin/StatCard';
import { MoodBar } from '@/components/admin/MoodBar';
import { ActivityLogItem } from '@/components/admin/ActivityLogItem';
import { UsersTable } from '@/components/admin/UsersTable';
import { ModerationQueue } from '@/components/admin/ModerationQueue';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';
import { useAdminStats, useAdminMoods, useAdminComments } from '@/hooks/queries/use-admin-stats';
import { ACTIVITY_LOG_MOCK } from '@/mocks/activity-log';
import { MOOD_KEYS } from '@/lib/mood-config';

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const STAT_COLORS = {
  posts: '#00FFE5',
  reactions: '#FF6E96',
  comments: '#BB9AF7',
  views: '#9ECE6A',
} as const;

export default function AdminPage() {
  const statsQ = useAdminStats();
  const moodsQ = useAdminMoods();
  const commentsQ = useAdminComments('PENDING');
  const stats = statsQ.data;
  const moodItems = moodsQ.data?.items ?? [];
  const moodTotal = moodItems.reduce((s, m) => s + m.count, 0);
  const moodMap = new Map(moodItems.map((m) => [m.mood, m.count]));
  const pendingCount = commentsQ.data?.total ?? 0;

  return (
    <>
      {/* SubBar — fixed below TopBar (52px), z-subbar = 90 */}
      <div
        data-testid="admin-subbar"
        className="fixed left-0 right-0 top-[52px] z-subbar flex h-10 items-center gap-4 border-b border-b1 bg-surf px-5 font-mono text-mono-sm"
      >
        <span className="text-tm">~/admin/dashboard</span>
        <span className="text-td">──</span>
        <span className="flex items-center gap-1.5 text-grn">
          <span className="animate-live-dot inline-block h-[7px] w-[7px] rounded-full bg-grn" />
          live mode
        </span>
        <span className="text-td">last update: just now</span>
        <div className="ml-auto flex gap-2">
          <Link
            to="/admin/create"
            data-testid="subbar-new-post"
            className="rounded-[5px] border border-cyan/35 bg-cyan/[0.08] px-3 py-1 font-mono text-mono-sm text-cyan hover:bg-cyan/[0.14]"
          >
            ✏️ New Post
          </Link>
          <Link
            to="/tags"
            data-testid="subbar-tags"
            className="rounded-[5px] border border-yel/35 bg-yel/[0.08] px-3 py-1 font-mono text-mono-sm text-yel hover:bg-yel/[0.14]"
          >
            🏷 Tags
          </Link>
        </div>
      </div>

      {/* Content — extra pt-10 for fixed SubBar (40px) on top of AppLayout's pt-[52px] */}
      <div className="mx-auto max-w-[1400px] px-6 pb-4 pt-10">
        {/* Stats row */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statsQ.isLoading ? (
            <div className="col-span-full flex items-center gap-2 font-mono text-mono text-tm">
              <AsciiSpinner /> loading stats...
            </div>
          ) : stats ? (
            <>
              <StatCard
                label="POSTS"
                value={stats.posts.total}
                delta={stats.posts.deltaToday}
                color={STAT_COLORS.posts}
                sparkline={stats.posts.sparkline}
              />
              <StatCard
                label="REACTIONS"
                value={stats.reactions.total}
                delta={stats.reactions.deltaToday}
                color={STAT_COLORS.reactions}
                sparkline={stats.reactions.sparkline}
              />
              <StatCard
                label="COMMENTS"
                value={stats.comments.total}
                delta={stats.comments.deltaToday}
                color={STAT_COLORS.comments}
                sparkline={stats.comments.sparkline}
              />
              <StatCard
                label="VIEWS"
                value={formatViews(stats.views.total)}
                delta={stats.views.deltaToday}
                color={STAT_COLORS.views}
                sparkline={stats.views.sparkline}
              />
            </>
          ) : (
            <div className="col-span-full font-mono text-mono-sm text-red">
              // failed to load stats
            </div>
          )}
        </div>

        {/* 2-col: mood.distribution + activity.log */}
        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-b2 bg-surf p-4">
            <div className="sb-lbl">
              // mood.distribution <span className="ml-1 text-td">{moodTotal} posts</span>
            </div>
            {moodsQ.isLoading ? (
              <div className="flex items-center gap-2 font-mono text-mono text-tm">
                <AsciiSpinner /> loading...
              </div>
            ) : (
              <div>
                {MOOD_KEYS.map((m) => (
                  <MoodBar key={m} mood={m} count={moodMap.get(m) ?? 0} total={moodTotal} />
                ))}
              </div>
            )}
          </section>

          <section
            className="max-h-80 overflow-y-auto rounded-lg border border-b2 bg-surf p-4"
            data-testid="activity-log-card"
          >
            <div className="sb-lbl">// activity.log</div>
            {ACTIVITY_LOG_MOCK.map((a) => (
              <ActivityLogItem
                key={a.id}
                icon={a.icon}
                message={a.message}
                color={a.color}
                time={a.time}
              />
            ))}
          </section>
        </div>

        {/* Users table — card wrapper */}
        <section className="mb-4 overflow-hidden rounded-lg border border-b2 bg-surf">
          <div className="border-b border-b1 px-4 py-3.5">
            <div className="sb-lbl" style={{ marginBottom: 0 }}>
              // users.table
            </div>
          </div>
          <UsersTable />
        </section>

        {/* Comments moderation — card with pending badge in header */}
        <section
          className="overflow-hidden rounded-lg border border-b2 bg-surf"
          data-testid="comments-moderation-section"
        >
          <div className="flex items-center gap-2.5 border-b border-b1 px-4 py-3.5">
            <div className="sb-lbl flex-1" style={{ marginBottom: 0 }}>
              // comments.moderation
            </div>
            {pendingCount > 0 && (
              <span
                data-testid="pending-badge"
                className="rounded-[3px] border border-yel/30 bg-yel/10 px-1.5 py-0.5 font-mono text-mono-sm text-yel"
              >
                {pendingCount} pending
              </span>
            )}
          </div>
          <div className="p-4">
            <ModerationQueue />
          </div>
        </section>
      </div>
    </>
  );
}
