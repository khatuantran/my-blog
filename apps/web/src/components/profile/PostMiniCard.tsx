import { Link } from 'react-router';
import { MoodBadge } from '@/components/shared/MoodBadge';
import { useUpsertReaction } from '@/hooks/mutations/use-reaction';
import { formatRelative } from '@/lib/format-date';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
};

const MAX_THUMBS = 3;

export function PostMiniCard({ post }: Props) {
  const reactMut = useUpsertReaction();
  const liked = post.myReaction === 'LIKE';

  function handleLike() {
    reactMut.mutate({
      postId: post.id,
      type: 'LIKE',
      currentType: post.myReaction,
    });
  }

  const visibleThumbs = post.images.slice(0, MAX_THUMBS);
  const extraImages = post.images.length - MAX_THUMBS;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-b2 bg-surf px-4 py-3.5 transition-all hover:border-cyan/30 hover:shadow-[0_0_18px_rgba(0,255,229,0.08)]">
      {/* Top accent line — hover reveal */}
      <span
        aria-hidden="true"
        data-testid="mini-card-accent"
        className="pointer-events-none absolute left-0 right-0 top-0 h-px opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,255,229,0.3), transparent)',
        }}
      />
      {/* Corner id */}
      <span className="absolute right-3 top-2.5 font-mono text-[10px] text-b2 select-none">
        #{post.id.slice(0, 6)}
      </span>

      {/* Header: timestamp + mood */}
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[12px] text-ts">{formatRelative(post.createdAt)}</span>
        <MoodBadge mood={post.mood} />
      </div>

      {/* Content — 3-line clamp */}
      <p className="mb-2 line-clamp-3 font-mono text-sm text-tp leading-relaxed">{post.content}</p>

      {/* Image thumbs */}
      {visibleThumbs.length > 0 && (
        <div className="mb-2 flex gap-1.5">
          {visibleThumbs.map((img, i) => (
            <div
              key={img.id}
              className="relative overflow-hidden rounded-sm border border-b2 bg-b1 shrink-0"
              style={{ width: 40, height: 30 }}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              {i === MAX_THUMBS - 1 && extraImages > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-mono text-[10px] text-tp">
                  +{extraImages}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {post.tags.map((t) => (
            <span
              key={t.id}
              className="font-mono text-[11px]"
              style={{ color: t.color ?? '#00FFE5' }}
            >
              {t.name}
            </span>
          ))}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-3 border-t border-b1 pt-2">
        <button
          type="button"
          aria-label={liked ? 'Unlike post' : 'Like post'}
          aria-pressed={liked}
          onClick={handleLike}
          disabled={reactMut.isPending}
          className="flex items-center gap-1 font-mono text-[12px] text-tm transition-colors hover:text-mag disabled:opacity-50"
          style={liked ? { color: '#FF6E96' } : undefined}
        >
          {liked ? '❤' : '♡'} {post.counts.reactions}
        </button>
        <span className="flex items-center gap-1 font-mono text-[12px] text-tm">
          💬 {post.counts.comments}
        </span>
        <Link
          to={`/post/${post.id}`}
          className="ml-auto font-mono text-[12px] text-cyan hover:underline"
          aria-label={`Read post ${post.id}`}
        >
          read →
        </Link>
      </div>
    </div>
  );
}
