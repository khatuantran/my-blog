import { useState, useEffect } from 'react';
import { useTogglePostLike } from '@/hooks/mutations/use-like';

type Props = {
  postId: string;
  liked: boolean;
  count: number;
};

// Local optimistic state — toggle ngay khi click, server lo cache invalidation.
// Khi parent prop thay đổi (cache invalidate) → reset local state.
export function LikeButton({ postId, liked, count }: Props) {
  const m = useTogglePostLike();
  const [optimistic, setOptimistic] = useState<{ liked: boolean; count: number } | null>(null);

  // Sync khi parent prop thay đổi
  useEffect(() => {
    setOptimistic(null);
  }, [liked, count]);

  const displayLiked = optimistic?.liked ?? liked;
  const displayCount = optimistic?.count ?? count;

  function handle() {
    const nextLiked = !displayLiked;
    setOptimistic({ liked: nextLiked, count: Math.max(0, displayCount + (nextLiked ? 1 : -1)) });
    m.mutate(
      { postId, currentlyLiked: displayLiked },
      {
        onError: () => setOptimistic(null),
      },
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={displayLiked}
      aria-label={displayLiked ? 'Unlike post' : 'Like post'}
      className={`flex items-center gap-1 rounded-sm border-none bg-transparent px-2.5 py-1 font-mono text-mono cursor-pointer transition-all hover:bg-elev hover:text-tp ${
        displayLiked ? 'text-mag' : 'text-tm'
      }`}
      style={displayLiked ? { textShadow: '0 0 8px #FF6E9660' } : undefined}
    >
      <span className="text-sm">{displayLiked ? '❤' : '♡'}</span>
      <span>{displayCount}</span>
    </button>
  );
}
