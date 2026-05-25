import { useAdminComments } from '@/hooks/queries/use-admin-stats';
import { useDeleteComment, useUpdateCommentStatus } from '@/hooks/mutations/use-moderate-comment';
import { formatRelative } from '@/lib/format-date';

export function ModerationQueue() {
  const { data, isLoading, isError } = useAdminComments('PENDING');
  const approveMut = useUpdateCommentStatus();
  const deleteMut = useDeleteComment();

  if (isLoading) {
    return (
      <div className="rounded-md border border-b2 bg-surf p-4 font-mono text-mono-sm text-tm">
        ⠋ loading queue...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-red/40 bg-red/[0.05] p-4 font-mono text-mono-sm text-red">
        // failed to load moderation queue
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-b2 bg-surf p-4 font-mono text-mono-sm text-tm">
        // queue empty · no pending comments
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="moderation-queue">
      <div className="font-mono text-mono-sm text-yel">● {data?.total ?? items.length} pending</div>
      {items.map((c) => (
        <div
          key={c.id}
          data-testid={`mod-item-${c.id}`}
          className="flex items-start justify-between gap-3 rounded-md border border-b2 bg-surf p-3"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 font-mono text-mono-sm text-tm">
              <span className="text-yel">[pending]</span>
              <span>{c.author?.username ?? c.anonymousName ?? 'Anon'}</span>
              <span className="text-td">· {formatRelative(c.createdAt)}</span>
            </div>
            <div className="mb-1 break-words text-sm text-tp">{c.content}</div>
            <div className="truncate font-mono text-mono-sm text-td">
              ↳ on post #{c.post.id.slice(-6)} · "{c.post.content}"
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => approveMut.mutate({ id: c.id, status: 'APPROVED' })}
              disabled={approveMut.isPending}
              aria-label={`Approve comment ${c.id}`}
              className="rounded-sm border border-grn/40 bg-grn/10 px-2 py-1 font-mono text-mono-sm text-grn transition-colors hover:bg-grn/20 disabled:opacity-50"
            >
              ✓ Approve
            </button>
            <button
              type="button"
              onClick={() => deleteMut.mutate({ id: c.id })}
              disabled={deleteMut.isPending}
              aria-label={`Delete comment ${c.id}`}
              className="rounded-sm border border-red/40 bg-red/10 px-2 py-1 font-mono text-mono-sm text-red transition-colors hover:bg-red/20 disabled:opacity-50"
            >
              ✕ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
