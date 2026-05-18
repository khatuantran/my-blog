import { useState, useEffect } from 'react';
import { Avatar } from '@/components/shared/Avatar';
import { formatRelative } from '@/lib/format-date';
import { useToggleCommentLike } from '@/hooks/mutations/use-comment-like';
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

  useEffect(() => {
    setOptimistic(null);
  }, [comment.liked, comment.likeCount]);

  const liked = optimistic?.liked ?? !!comment.liked;
  const count = optimistic?.count ?? comment.likeCount;

  function handleLike() {
    const next = !liked;
    setOptimistic({ liked: next, count: Math.max(0, count + (next ? 1 : -1)) });
    m.mutate(
      { commentId: comment.id },
      {
        onError: () => setOptimistic(null),
      },
    );
  }

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
        className="mb-2 whitespace-pre-wrap text-[13px] leading-[1.6]"
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
          disabled
          aria-label="Reply (defer)"
          className="flex items-center gap-1 rounded-sm bg-transparent px-2 py-0.5 font-mono text-mono-sm text-td opacity-60"
        >
          <span>↩</span>
          <span>Reply</span>
        </button>
      </div>
    </article>
  );
}
