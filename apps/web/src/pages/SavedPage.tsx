import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { PostCard } from '@/components/feed/PostCard';
import { PostListSkeleton } from '@/components/feed/PostListSkeleton';
import { listSavedPosts } from '@/services/api/saved';
import { qk } from '@/lib/query-keys';

export default function SavedPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: qk.saved.list({}),
    queryFn: () => listSavedPosts(),
  });

  return (
    <div className="mx-auto max-w-[820px] px-6 py-4">
      <div className="mb-4 font-mono text-mono-xs text-tm">
        // saved.posts{data ? ` · ${data.total} items` : ''}
      </div>

      {isLoading && <PostListSkeleton />}

      {isError && (
        <div className="py-12 text-center font-mono">
          <div className="mb-2 text-tm">// failed to load saved posts</div>
          <div className="text-mono-xs text-td">$ retry: refresh page</div>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="py-16 text-center font-mono">
          <div className="mb-3 text-5xl opacity-30">🔖</div>
          <div className="mb-1.5 text-tm">// no saved posts yet</div>
          <div className="text-mono-xs text-td">
            $ browse{' '}
            <Link to="/" className="text-cyan hover:underline">
              feed
            </Link>{' '}
            &amp;&amp; click 🔖 to save
          </div>
        </div>
      )}

      {data?.items.map((p, i) => (
        <PostCard key={p.id} post={p} delay={i * 60} />
      ))}
    </div>
  );
}
