import { Link } from 'react-router';
import { StatCard } from '@/components/admin/StatCard';
import { MoodBar } from '@/components/admin/MoodBar';
import { ActivityLogItem } from '@/components/admin/ActivityLogItem';
import { UsersTable } from '@/components/admin/UsersTable';
import { ModerationQueue } from '@/components/admin/ModerationQueue';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';
import { useAdminStats, useAdminMoods } from '@/hooks/queries/use-admin-stats';
import { ACTIVITY_LOG_MOCK } from '@/mocks/activity-log';
import { MOOD_KEYS } from '@/lib/mood-config';

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const STAT_COLORS = {
  posts: '#00FFE5',
  likes: '#FF6E96',
  comments: '#BB9AF7',
  views: '#9ECE6A',
} as const;

export default function AdminPage() {
  const statsQ = useAdminStats();
  const moodsQ = useAdminMoods();
  const stats = statsQ.data;
  const moodItems = moodsQ.data?.items ?? [];
  const moodTotal = moodItems.reduce((s, m) => s + m.count, 0);
  // Order moods theo MOOD_KEYS để hiển thị nhất quán; map count từ API.
  const moodMap = new Map(moodItems.map((m) => [m.mood, m.count]));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-4">
      {/* Sub-bar */}
      <div className="mb-4 flex items-center gap-3 rounded-md border border-b1 bg-surf px-4 py-2 font-mono text-mono-sm">
        <span className="text-tm">~/admin/dashboard</span>
        <span className="text-td">──</span>
        <span className="flex items-center gap-1.5 text-grn">
          <span className="animate-pulse-status text-[8px]">●</span> live mode
        </span>
        <span className="text-td">·</span>
        <span className="text-tm">last update: just now</span>
        <Link
          to="/admin/create"
          className="ml-auto rounded-sm border border-cyan/50 bg-cyan/10 px-3 py-1 font-mono text-mono-sm text-cyan hover:bg-cyan/20"
        >
          ✏️ New Post
        </Link>
      </div>

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
              label="LIKES"
              value={stats.likes.total}
              delta={stats.likes.deltaToday}
              color={STAT_COLORS.likes}
              sparkline={stats.likes.sparkline}
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
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section>
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

        <section>
          <div className="sb-lbl">
            // activity.log <span className="ml-1 text-td">// mock · M11</span>
          </div>
          <div className="rounded-md border border-b2 bg-surf p-1">
            {ACTIVITY_LOG_MOCK.map((a) => (
              <ActivityLogItem
                key={a.id}
                icon={a.icon}
                message={a.message}
                color={a.color}
                time={a.time}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Users table */}
      <section className="mb-6">
        <div className="sb-lbl">// users.table</div>
        <UsersTable />
      </section>

      {/* Comments moderation */}
      <section>
        <div className="sb-lbl">// comments.moderation</div>
        <ModerationQueue />
      </section>
    </div>
  );
}
