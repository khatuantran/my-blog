import { Link, useParams } from 'react-router';
import { usePost } from '@/hooks/queries/use-posts';
import { useTrackView } from '@/hooks/use-track-view';
import { PostHeader } from '@/components/post/PostHeader';
import { PostContent } from '@/components/post/PostContent';
import { FileAttachments } from '@/components/post/FileAttachments';
import { MetaPanel } from '@/components/post/MetaPanel';
import { ImageCarousel } from '@/components/post/ImageCarousel';
import { TagPill } from '@/components/shared/TagPill';
import { LikeButton } from '@/components/feed/LikeButton';
import { SaveButton } from '@/components/feed/SaveButton';
import { CommentForm } from '@/components/comment/CommentForm';
import { CommentList } from '@/components/comment/CommentList';
import { ApiError } from '@/services/api/client';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, error } = usePost(id);
  useTrackView(post?.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-12 text-center font-mono text-mono text-tm">
        // loading post...
      </div>
    );
  }

  if (error || !post) {
    const is404 = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-16 text-center font-mono">
        <div className="mb-2 text-5xl opacity-30">◐</div>
        <div className="mb-3 text-tm">{is404 ? '// post not found' : '// failed to load post'}</div>
        <Link to="/" className="font-mono text-mono text-cyan hover:underline">
          ← back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 font-mono text-mono-sm">
        <Link to="/" className="text-tm hover:text-cyan">
          ← feed
        </Link>
        <span className="text-td">/</span>
        <span className="text-cyan">~/post/{post.id.slice(-6)}</span>
      </div>

      <div className="flex gap-6">
        {/* Main column */}
        <article className="min-w-0 flex-1">
          <PostHeader post={post} avatarSize="lg" />
          <PostContent content={post.content} variant="detail" />
          <ImageCarousel images={post.images} />
          <FileAttachments files={post.files} />

          {post.tags.length > 0 && (
            <div className="my-4 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <TagPill key={t.id} name={t.name} color={t.color} />
              ))}
            </div>
          )}

          {/* Divider */}
          <div
            className="my-4 overflow-hidden whitespace-nowrap font-mono text-[10px] text-b1"
            style={{ letterSpacing: '2px' }}
            aria-hidden="true"
          >
            ──────────────────────────────────────────
          </div>

          {/* Actions */}
          <div className="mb-6 flex items-center gap-1">
            <LikeButton postId={post.id} liked={!!post.liked} count={post.counts.likes} />
            <button
              type="button"
              className="flex items-center gap-1 rounded-sm bg-transparent px-2.5 py-1 font-mono text-mono text-tm hover:bg-elev hover:text-tp"
              aria-label="Jump to comments"
            >
              <span className="text-sm">💬</span>
              <span>{post.counts.comments}</span>
            </button>
            <SaveButton postId={post.id} saved={!!post.saved} />
            <button
              type="button"
              aria-label="Share post (placeholder)"
              className="flex items-center gap-1 rounded-sm bg-transparent px-2.5 py-1 font-mono text-mono text-tm hover:bg-elev hover:text-tp"
            >
              <span>↗</span>
              <span>Share</span>
            </button>
            <span className="ml-auto font-mono text-mono-sm text-tm">
              👁 {post.viewCount} views
            </span>
          </div>

          <section aria-label="Comments" className="mt-6 space-y-4">
            <div className="font-mono text-mono-lg text-cyan">
              ❯ // comments [{post.counts.comments}]
            </div>
            <CommentForm postId={post.id} />
            <CommentList postId={post.id} />
          </section>
        </article>

        <MetaPanel post={post} />
      </div>
    </div>
  );
}
