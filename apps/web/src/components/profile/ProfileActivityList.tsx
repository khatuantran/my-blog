import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useUserActivity } from '@/hooks/queries/use-activity';
import { formatRelative } from '@/lib/format-date';
import type { ActivityItem, ActivityType } from '@/types/api';

// T-413 — Icon set aligned với Feed page (Feed PostCard React default ♡ / Create Post ✏️ /
// Comment 💬 / PostActionMenu Save 🔖). Was: POST 📝, LIKE 👍.
const ICON_MAP: Record<ActivityType, string> = {
  POST_CREATED: '✏️',
  COMMENT_CREATED: '💬',
  LIKE_CREATED: '♡',
  SAVE_CREATED: '🔖',
};

const VERB_OUTGOING: Record<ActivityType, string> = {
  POST_CREATED: 'created post',
  COMMENT_CREATED: 'commented on',
  LIKE_CREATED: 'liked',
  SAVE_CREATED: 'saved',
};

const VERB_INCOMING: Record<ActivityType, string> = {
  POST_CREATED: 'created post',
  COMMENT_CREATED: 'commented on your post',
  LIKE_CREATED: 'liked your post',
  SAVE_CREATED: 'saved your post',
};

type Props = {
  userId: string;
};

export function ProfileActivityList({ userId }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUserActivity(userId);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="font-mono text-mono-sm text-tm" role="status">
        // loading activity...
      </div>
    );
  }

  if (isError) {
    const status = (error as { status?: number } | null)?.status;
    if (status === 403) {
      return (
        <div className="font-mono text-mono-sm text-tm" role="alert">
          // activity is private
        </div>
      );
    }
    return (
      <div className="font-mono text-mono-sm text-red" role="alert">
        // failed to load activity
      </div>
    );
  }

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) {
    return (
      <div className="font-mono text-mono-sm text-tm">
        // no activity yet · interact with posts to build history
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((it) => (
        <ProfileActivityItem key={it.id} item={it} />
      ))}
      {hasNextPage && (
        <div ref={sentinelRef} className="h-8" aria-hidden>
          {isFetchingNextPage && (
            <span className="font-mono text-mono-sm text-tm">// loading more...</span>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileActivityItem({ item }: { item: ActivityItem }) {
  const icon = ICON_MAP[item.type];
  const verb = item.direction === 'OUTGOING' ? VERB_OUTGOING[item.type] : VERB_INCOMING[item.type];
  const snippet = item.target.snippet ?? '[deleted post]';
  const targetIsLink = item.target.snippet !== null;

  return (
    <div className="flex items-center gap-2.5 border-b border-b1 px-2 py-2 last:border-b-0">
      <span className="text-sm">{icon}</span>
      <span className="flex-1 truncate font-mono text-mono-sm text-tp">
        {item.direction === 'OUTGOING' ? (
          <>
            <span className="text-cyan">You</span> {verb}{' '}
            {targetIsLink ? (
              <Link to={`/post/${item.target.id}`} className="text-tp hover:text-cyan">
                {snippet}
              </Link>
            ) : (
              <span className="text-tm">{snippet}</span>
            )}
          </>
        ) : (
          <>
            <Link
              to={`/profile/${item.actor.username}`}
              className="text-cyan hover:text-cyan-bright"
            >
              {item.actor.username}
            </Link>{' '}
            {verb}
            {' · '}
            {targetIsLink ? (
              <Link to={`/post/${item.target.id}`} className="text-tp hover:text-cyan">
                {snippet}
              </Link>
            ) : (
              <span className="text-tm">{snippet}</span>
            )}
          </>
        )}
      </span>
      <span className="shrink-0 font-mono text-mono-sm text-tm">
        {formatRelative(item.createdAt)}
      </span>
    </div>
  );
}
