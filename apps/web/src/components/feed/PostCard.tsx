import { useState } from 'react';
import { PostHeader } from '@/components/post/PostHeader';
import { PostContent } from '@/components/post/PostContent';
import { ImageGrid } from '@/components/post/ImageGrid';
import { FileAttachments } from '@/components/post/FileAttachments';
import { TagPill } from '@/components/shared/TagPill';
import { ReactionButton } from './ReactionButton';
import { CommentsModal } from './CommentsModal';
import { PostActionMenu } from './PostActionMenu';
import { ImageLightbox } from './ImageLightbox';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
  delay?: number;
};

// Full PostCard match design-file/MyBlog Feed.html:186-269.
// Container hover: cyan border + glow + top gradient line.
export function PostCard({ post, delay = 0 }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <article
      className="post-card-hover group relative mb-3 overflow-hidden rounded-lg border border-b2 bg-surf p-4 transition-all duration-200 animate-fade-up-md hover:border-cyan/45 hover:shadow-[0_0_24px_rgba(0,255,229,0.1),0_4px_24px_rgba(0,0,0,0.3)]"
      style={{ animationDelay: `${delay}ms` }}
      data-testid={`post-card-${post.id}`}
    >
      {/* Top gradient line on hover */}
      <span
        aria-hidden="true"
        className="absolute left-0 right-0 top-0 h-px opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(0,255,229,.35),transparent)' }}
      />

      {/* Corner deco */}
      <span className="absolute right-3.5 top-2.5 font-mono text-mono-xs text-b2">
        #{post.id.slice(-6)}
      </span>

      <PostHeader post={post} />

      <PostContent content={post.content} variant="card" />

      <ImageGrid images={post.images} onImageClick={(idx) => setLightboxIdx(idx)} />
      <FileAttachments files={post.files} />

      {post.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <TagPill key={t.id} name={t.name} color={t.color} />
          ))}
        </div>
      )}

      {/* Divider */}
      <div
        className="mb-2.5 overflow-hidden whitespace-nowrap font-mono text-[10px] text-b1"
        style={{ letterSpacing: '2px' }}
        aria-hidden="true"
      >
        ────────────────────────────────────────
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <ReactionButton
          postId={post.id}
          myReaction={post.myReaction}
          topReactions={post.topReactions}
          count={post.counts.reactions}
        />
        <button
          type="button"
          onClick={() => setShowComments(true)}
          className="flex items-center gap-1 rounded-sm border-none bg-transparent px-2.5 py-1 font-mono text-mono text-tm cursor-pointer transition-colors hover:bg-elev hover:text-tp"
          aria-label={`View ${post.counts.comments} comments`}
          data-testid={`post-comments-btn-${post.id}`}
        >
          <span className="text-sm">💬</span>
          <span>{post.counts.comments}</span>
        </button>
        <button
          type="button"
          aria-label="Share post (placeholder)"
          className="flex items-center gap-1 rounded-sm border-none bg-transparent px-2.5 py-1 font-mono text-mono text-tm cursor-pointer transition-colors hover:bg-elev hover:text-tp"
        >
          <span>↗</span>
          <span>Share</span>
        </button>
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setShowActionMenu((v) => !v)}
            aria-label="More actions"
            aria-expanded={showActionMenu}
            data-testid={`post-action-trigger-${post.id}`}
            className="rounded-sm border-none bg-transparent px-2.5 py-1 font-mono text-mono text-tm cursor-pointer hover:bg-elev hover:text-tp"
          >
            ⋯
          </button>
          {showActionMenu && (
            <PostActionMenu post={post} onClose={() => setShowActionMenu(false)} />
          )}
        </div>
      </div>

      {showComments && (
        <CommentsModal
          postId={post.id}
          postExcerpt={post.content.slice(0, 80)}
          onClose={() => setShowComments(false)}
        />
      )}

      {lightboxIdx !== null && (
        <ImageLightbox
          images={post.images}
          startIdx={lightboxIdx}
          postPath={`~/post/${post.id.slice(-6)}`}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </article>
  );
}
