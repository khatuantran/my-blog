import { useEffect, useRef } from 'react';
import { usePostsInfinite } from '@/hooks/queries/use-posts';
import type { Mood } from '@/lib/mood-config';
import type { Post } from '@/types/api';
import { AsciiSpinner } from './AsciiSpinner';
import { PostListSkeleton } from './PostListSkeleton';
import { PostCard } from './PostCard';

type Props = {
  mood: Mood | null;
  onTotal?: (total: number) => void;
};

export function PostList({ mood, onTotal }: Props) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePostsInfinite({ mood: mood ?? undefined });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Report total back to parent (FilterBar header).
  useEffect(() => {
    if (data && onTotal) onTotal(data.pages[0]?.total ?? 0);
  }, [data, onTotal]);

  // IntersectionObserver: load next khi sentinel visible.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '120px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <PostListSkeleton />;
  if (isError) {
    return (
      <div className="py-12 text-center font-mono">
        <div className="mb-2 text-tm">// connection lost</div>
        <div className="text-mono-xs text-td">$ retry: refresh page</div>
      </div>
    );
  }

  const posts: Post[] = data?.pages.flatMap((p) => p.items) ?? [];

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center font-mono">
        <div className="mb-3 text-5xl opacity-30">◐</div>
        <div className="mb-1.5 text-tm">// no posts matching filter</div>
        <div className="text-mono-xs text-td">$ cd ../feed &amp;&amp; ls -la --all-moods</div>
      </div>
    );
  }

  return (
    <>
      {posts.map((p, i) => (
        <PostCard key={p.id} post={p} delay={i * 60} />
      ))}
      <div
        ref={sentinelRef}
        className="flex min-h-10 items-center justify-center py-5 font-mono text-mono text-tm"
      >
        {isFetchingNextPage && (
          <span className="flex items-center gap-2">
            <AsciiSpinner /> loading posts...
          </span>
        )}
        {!hasNextPage && posts.length > 0 && (
          <span className="text-mono-xs text-td">// end of feed · {posts.length} posts loaded</span>
        )}
      </div>
    </>
  );
}
