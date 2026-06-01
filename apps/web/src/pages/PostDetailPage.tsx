import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { usePost } from '@/hooks/queries/use-posts';
import { useTrackView } from '@/hooks/use-track-view';
import { PostHeader } from '@/components/post/PostHeader';
import { PostContent } from '@/components/post/PostContent';
import { FileAttachments } from '@/components/post/FileAttachments';
import { MetaPanel } from '@/components/post/MetaPanel';
import { ImageGrid } from '@/components/post/ImageGrid';
import { ImageLightbox } from '@/components/feed/ImageLightbox';
import { TagPill } from '@/components/shared/TagPill';
import { SharePopover } from '@/components/shared/SharePopover';
import { ReactionButton } from '@/components/feed/ReactionButton';
import { CommentForm } from '@/components/comment/CommentForm';
import { CommentList } from '@/components/comment/CommentList';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';
import { ApiError } from '@/services/api/client';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, error } = usePost(id);
  useTrackView(post?.id);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[820px] px-8 py-12 text-center font-mono text-mono text-tm">
        <AsciiSpinner /> loading post...
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
    <div className="flex">
      {/* Main — flex-1 nhưng content cap 820 centered (design L353: maxWidth 820 + margin auto) */}
      <article className="mx-auto min-w-0 max-w-[820px] flex-1 px-8 py-5">
        {/* Breadcrumb (design L356): ← feed CYAN · / · ~/post/id muted */}
        <div className="mb-5 flex items-center gap-2 font-mono text-mono-md text-tm">
          <Link to="/" className="text-cyan no-underline hover:underline">
            ← feed
          </Link>
          <span className="text-td">/</span>
          <span>~/post/{post.id.slice(-6)}</span>
        </div>

        {/* Post card — bordered wrap (user feedback: detail thiếu border) */}
        <div className="rounded-lg border border-b2 bg-surf p-5">
          <PostHeader post={post} avatarSize="lg" />
          <PostContent content={post.content} variant="detail" />
          {/* T-450: ImageGrid collage + click mở lightbox. variant detail = ảnh to (T-451). */}
          <ImageGrid
            images={post.images}
            variant="detail"
            onImageClick={(idx) => setLightboxIdx(idx)}
          />
          <FileAttachments files={post.files} />

          {post.tags.length > 0 && (
            <div className="my-4 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <TagPill key={t.id} name={t.name} color={t.color} />
              ))}
            </div>
          )}

          {/* Actions — top-divider row trong card (design L397 borderTop) */}
          <div className="mt-2 flex items-center gap-1 border-t border-b1 pt-3">
            <ReactionButton
              postId={post.id}
              myReaction={post.myReaction}
              topReactions={post.topReactions}
              count={post.counts.reactions}
            />
            <button
              type="button"
              onClick={() =>
                document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="flex items-center gap-1 rounded-sm bg-transparent px-2.5 py-1 font-mono text-mono text-tm hover:bg-elev hover:text-tp"
              aria-label="Jump to comments"
            >
              <span className="text-sm">💬</span>
              <span>{post.counts.comments}</span>
            </button>
            <SharePopover
              post={post}
              triggerClassName="flex items-center gap-1 rounded-sm bg-transparent px-2.5 py-1 font-mono text-mono text-tm hover:bg-elev hover:text-tp"
            />
            <span className="ml-auto font-mono text-mono-sm text-tm">
              👁 {post.viewCount} views
            </span>
          </div>
        </div>
        {/* /Post card */}

        {/* Comments header (design L419): ❯ cyan + // comments white + [N] muted */}
        <section id="comments" aria-label="Comments" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 font-mono text-mono-lg">
            <span className="text-cyan">❯</span>
            <span className="text-tp">// comments</span>
            <span className="text-td">[{post.counts.comments}]</span>
          </div>
          {/* FR-03.7: comment mới→cũ (BE desc) + collapse 5 đầu; form add comment ở CUỐI section. */}
          <CommentList postId={post.id} collapseAfter={5} />
          <CommentForm postId={post.id} />
        </section>
      </article>

      <MetaPanel post={post} />

      {lightboxIdx !== null && post.images.length > 0 && (
        <ImageLightbox
          images={post.images}
          startIdx={lightboxIdx}
          postPath={`~/post/${post.id.slice(-6)}`}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}
