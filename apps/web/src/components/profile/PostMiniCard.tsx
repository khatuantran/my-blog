import { Link } from 'react-router';
import { MoodBadge } from '@/components/shared/MoodBadge';
import { useUpsertReaction } from '@/hooks/mutations/use-reaction';
import { formatRelative } from '@/lib/format-date';
import { stripHtml } from '@/lib/strip-html';
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
    <div className="group relative overflow-hidden rounded-lg border border-b2 bg-surf px-4 py-3.5 transition-all hover:border-cyan/40 hover:shadow-[0_0_18px_rgba(0,255,229,0.08)]">
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
      <span className="absolute right-3 top-2.5 select-none font-mono text-[10px] text-b2">
        #{post.id.slice(0, 6)}
      </span>

      {/* Header: timestamp + mood (mood right-aligned per design L303) */}
      <div className="mb-2.5 flex items-center gap-2">
        <span className="font-mono text-[12px] text-ts">{formatRelative(post.createdAt)}</span>
        <span className="ml-auto">
          <MoodBadge mood={post.mood} />
        </span>
      </div>

      {/* Content — 15px per design L310, 3-line clamp. Strip HTML (BUG-033: post mới
          là rich-text HTML; card render dạng text nên hiện raw `<p>...`). */}
      <p className="mb-2.5 line-clamp-3 font-mono text-[15px] leading-relaxed text-tp">
        {stripHtml(post.content)}
      </p>

      {/* Image thumbs — 40×30 rounded 4px per design L320 */}
      {visibleThumbs.length > 0 && (
        <div className="mb-2.5 flex gap-1">
          {visibleThumbs.map((img, i) => (
            <div
              key={img.id}
              className="relative shrink-0 overflow-hidden rounded border border-b2 bg-b1"
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

      {/* Tags — pill chip with bg + border per design L327 */}
      {post.tags.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {post.tags.map((t) => {
            const color = t.color ?? '#00FFE5';
            return (
              <span
                key={t.id}
                data-testid={`mini-tag-${t.name}`}
                className="rounded-[3px] border px-1.5 py-px font-mono text-[11px]"
                style={{
                  color,
                  backgroundColor: `${color}15`,
                  borderColor: `${color}40`,
                }}
              >
                {t.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Action row — gap 2px + padded buttons per design L330-340 */}
      <div className="flex items-center gap-0.5 border-t border-b1 pt-2">
        <button
          type="button"
          aria-label={liked ? 'Unlike post' : 'Like post'}
          aria-pressed={liked}
          onClick={handleLike}
          disabled={reactMut.isPending}
          className="flex items-center gap-1 rounded px-2 py-1 font-mono text-[12px] text-tm transition-colors hover:text-mag disabled:opacity-50"
          style={liked ? { color: '#FF6E96' } : undefined}
        >
          <span>{liked ? '❤' : '♡'}</span>
          <span>{post.counts.reactions}</span>
        </button>
        <span className="flex items-center gap-1 rounded px-2 py-1 font-mono text-[12px] text-tm">
          <span>💬</span>
          <span>{post.counts.comments}</span>
        </span>
        <Link
          to={`/post/${post.id}`}
          data-testid="mini-read-link"
          className="ml-auto rounded border border-cyan/25 px-2 py-1 font-mono text-[11px] text-cyan transition-colors hover:border-cyan/50 hover:bg-cyan/10"
          aria-label={`Read post ${post.id}`}
        >
          read →
        </Link>
      </div>
    </div>
  );
}
