import { usePostComments } from '@/hooks/queries/use-comments';
import { CommentItem } from './CommentItem';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';

type Props = {
  postId: string;
};

export function CommentList({ postId }: Props) {
  const { data, isLoading, isError } = usePostComments(postId);

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

  return (
    <div className="space-y-2">
      {items.map((c) => (
        <CommentItem key={c.id} comment={c} />
      ))}
    </div>
  );
}
