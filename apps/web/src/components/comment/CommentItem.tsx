import { useState, useEffect } from 'react';
import { Avatar } from '@/components/shared/Avatar';
import { formatRelative } from '@/lib/format-date';
import { useToggleCommentLike } from '@/hooks/mutations/use-comment-like';
import { useReplies } from '@/hooks/queries/use-replies';
import { ReplyForm } from '@/components/feed/ReplyForm';
import { ReplyRow } from '@/components/feed/ReplyRow';
import type { Comment } from '@/types/api';

type Props = {
  comment: Comment;
};

function displayName(c: Comment): string {
  if (c.author) return `@${c.author.username}`;
  return c.anonymousName ? `Anon · ${c.anonymousName}` : 'Anon';
}

export function CommentItem({ comment }: Props) {
  const m = useToggleCommentLike();
  const [optimistic, setOptimistic] = useState<{ liked: boolean; count: number } | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loadMore, setLoadMore] = useState(false);

  useEffect(() => {
    setOptimistic(null);
  }, [comment.liked, comment.likeCount]);

  const liked = optimistic?.liked ?? !!comment.liked;
  const count = optimistic?.count ?? comment.likeCount;

  function handleLike() {
    const next = !liked;
    setOptimistic({ liked: next, count: Math.max(0, count + (next ? 1 : -1)) });
    m.mutate({ commentId: comment.id }, { onError: () => setOptimistic(null) });
  }

  // FR-03.6: replies preview (max 3 from BE) + load more via useReplies
  const previewReplies = comment.replies ?? [];
  const replyCount = comment.replyCount ?? 0;
  const hasMoreReplies = replyCount > previewReplies.length;
  const repliesQuery = useReplies(comment.id, { page: 1, limit: 50 }, loadMore);
  const displayedReplies = loadMore ? (repliesQuery.data?.items ?? previewReplies) : previewReplies;

  const parentUsername = comment.author?.username ?? comment.anonymousName ?? 'anon';

  return (
    <article
      className="rounded-md border border-b2 bg-surf p-3"
      data-testid={`comment-${comment.id}`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <Avatar
          username={comment.author?.username ?? comment.anonymousName ?? 'A'}
          avatarUrl={comment.author?.avatarUrl ?? null}
          size="sm"
        />
        <span className="font-mono text-mono-sm text-blu">{displayName(comment)}</span>
        <span className="font-mono text-mono-sm text-td">·</span>
        <span className="font-mono text-mono-sm text-tm">{formatRelative(comment.createdAt)}</span>
      </div>
      <div
        className="mb-2 whitespace-pre-wrap text-mono-md leading-[1.6]"
        style={{ color: '#C9D1D9' }}
      >
        {comment.content}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike comment' : 'Like comment'}
          className={`flex items-center gap-1 rounded-sm bg-transparent px-2 py-0.5 font-mono text-mono-sm transition-colors hover:bg-elev hover:text-tp ${
            liked ? 'text-mag' : 'text-tm'
          }`}
        >
          <span>{liked ? '❤' : '♡'}</span>
          <span>{count}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowReplyForm((v) => !v)}
          aria-pressed={showReplyForm}
          aria-label={showReplyForm ? 'Cancel reply' : 'Reply to comment'}
          data-testid={`reply-toggle-${comment.id}`}
          className={`flex items-center gap-1 rounded-sm bg-transparent px-2 py-0.5 font-mono text-mono-sm transition-colors hover:bg-elev hover:text-tp ${
            showReplyForm ? 'text-cyan' : 'text-tm'
          }`}
        >
          <span>↩</span>
          <span>{showReplyForm ? 'Cancel' : 'Reply'}</span>
        </button>
      </div>

      {/* Inline reply form */}
      {showReplyForm && (
        <div className="mt-2.5">
          <ReplyForm
            postId={comment.postId}
            parentId={comment.id}
            parentUsername={parentUsername}
            onClose={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Replies preview / full list */}
      {displayedReplies.length > 0 && (
        <div className="mt-2.5 space-y-2" data-testid={`replies-${comment.id}`}>
          {displayedReplies.map((r) => (
            <ReplyRow key={r.id} reply={r} />
          ))}
        </div>
      )}

      {/* Load more button — only when more replies than preview */}
      {hasMoreReplies && !loadMore && (
        <button
          type="button"
          onClick={() => setLoadMore(true)}
          data-testid={`replies-load-more-${comment.id}`}
          className="ml-10 mt-2 font-mono text-mono-sm text-cyan hover:underline"
        >
          ↳ {replyCount} replies (load more)
        </button>
      )}
    </article>
  );
}
