import { useState, useEffect } from 'react';
import { Avatar } from '@/components/shared/Avatar';
import { formatRelative } from '@/lib/format-date';
import { useToggleCommentLike } from '@/hooks/mutations/use-comment-like';
import type { Comment } from '@/types/api';

type Props = {
  reply: Comment;
};

function displayName(c: Comment): string {
  if (c.author) return `@${c.author.username}`;
  return c.anonymousName ? `Anon · ${c.anonymousName}` : 'Anon';
}

// FR-03.6 — nested reply row under parent comment. Indent 40px, avatar
// 24×24, like với ♡/❤ (NOT reaction picker — replies giữ binary like).
export function ReplyRow({ reply }: Props) {
  const m = useToggleCommentLike();
  const [optimistic, setOptimistic] = useState<{ liked: boolean; count: number } | null>(null);

  useEffect(() => {
    setOptimistic(null);
  }, [reply.liked, reply.likeCount]);

  const liked = optimistic?.liked ?? !!reply.liked;
  const count = optimistic?.count ?? reply.likeCount;

  function handleLike() {
    const next = !liked;
    setOptimistic({ liked: next, count: Math.max(0, count + (next ? 1 : -1)) });
    m.mutate({ commentId: reply.id }, { onError: () => setOptimistic(null) });
  }

  return (
    <article
      data-testid={`reply-${reply.id}`}
      className="ml-10 rounded-md border border-b2 bg-bg/40 p-2.5"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Avatar
          username={reply.author?.username ?? reply.anonymousName ?? 'A'}
          avatarUrl={reply.author?.avatarUrl ?? null}
          size="xs"
        />
        <span className="font-mono text-mono-sm text-blu">{displayName(reply)}</span>
        {reply.replyTo && (
          <span className="font-mono text-mono-sm text-td">
            ↩ <span className="text-cyan">@{reply.replyTo.username}</span>
          </span>
        )}
        <span className="font-mono text-mono-sm text-td">·</span>
        <span className="font-mono text-mono-sm text-tm">{formatRelative(reply.createdAt)}</span>
      </div>
      <div
        className="mb-1.5 whitespace-pre-wrap font-sans text-mono-md leading-[1.55]"
        style={{ color: '#C9D1D9' }}
      >
        {reply.content}
      </div>
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike reply' : 'Like reply'}
          className={`flex items-center gap-1 rounded-sm bg-transparent px-1.5 py-0.5 font-mono text-mono-sm transition-colors hover:bg-elev hover:text-tp ${
            liked ? 'text-mag' : 'text-tm'
          }`}
        >
          <span>{liked ? '❤' : '♡'}</span>
          <span>{count}</span>
        </button>
      </div>
    </article>
  );
}
