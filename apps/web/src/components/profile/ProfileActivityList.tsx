import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useUserActivity } from '@/hooks/queries/use-activity';
import { formatRelative } from '@/lib/format-date';
import type { ActivityItem, ActivityType } from '@/types/api';

// T-416 — Refactored 1:1 design-file Profile.html L600-614:
// `❯ cyan` prefix (NOT icon) + 2-line layout (user_blu + verb + target_muted / time below).
// Icon-based version (T-413) was rejected per user feedback "đúng như design".

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
  const verb = item.direction === 'OUTGOING' ? VERB_OUTGOING[item.type] : VERB_INCOMING[item.type];
  const snippet = item.target.snippet ?? '[deleted post]';
  const targetIsLink = item.target.snippet !== null;
  const actorLabel = item.direction === 'OUTGOING' ? 'You' : item.actor.username;

  return (
    <div className="flex items-start gap-2.5 border-b border-b1 py-2.5 last:border-b-0">
      <span
        aria-hidden
        className="mt-[2px] shrink-0 font-mono text-[11px] text-cyan"
        data-testid="activity-caret"
      >
        ❯
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] leading-tight text-tp">
          {item.direction === 'OUTGOING' ? (
            <span className="font-mono text-blu">{actorLabel}</span>
          ) : (
            <Link
              to={`/profile/${item.actor.username}`}
              className="font-mono text-blu hover:text-cyan"
            >
              {actorLabel}
            </Link>
          )}{' '}
          {verb}{' '}
          {targetIsLink ? (
            <Link to={`/post/${item.target.id}`} className="text-tm hover:text-cyan">
              {snippet}
            </Link>
          ) : (
            <span className="text-tm">{snippet}</span>
          )}
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-td">{formatRelative(item.createdAt)}</div>
      </div>
    </div>
  );
}
