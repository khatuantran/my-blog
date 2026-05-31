import { useState } from 'react';
import { usePostComments } from '@/hooks/queries/use-comments';
import { CommentItem } from './CommentItem';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';

type Props = {
  postId: string;
  /** Chỉ hiện N comment đầu + nút show more / collapse. 0 = hiện hết (default). */
  collapseAfter?: number;
};

export function CommentList({ postId, collapseAfter = 0 }: Props) {
  const { data, isLoading, isError } = usePostComments(postId);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 font-mono text-mono text-tm">
        <AsciiSpinner /> loading comments...
      </div>
    );
  }

  if (isError) {
    return <div className="font-mono text-mono-sm text-red">// failed to load comments</div>;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-b2 bg-surf p-4 font-mono text-mono text-tm">
        // no comments yet — be the first ❯
      </div>
    );
  }

  // FR-03.7: BE trả mới→cũ (createdAt desc) — render trực tiếp. Post Detail collapse N đầu.
  const ordered = items;
  const collapsible = collapseAfter > 0 && ordered.length > collapseAfter;
  const displayed = collapsible && !expanded ? ordered.slice(0, collapseAfter) : ordered;
  const hiddenCount = ordered.length - collapseAfter;

  return (
    <div className="space-y-2">
      {displayed.map((c) => (
        <CommentItem key={c.id} comment={c} />
      ))}
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          data-testid="comments-toggle"
          className="font-mono text-mono-sm text-cyan hover:underline"
        >
          {expanded
            ? '▴ collapse comments'
            : `▾ show ${hiddenCount} more ${hiddenCount === 1 ? 'comment' : 'comments'}`}
        </button>
      )}
    </div>
  );
}
