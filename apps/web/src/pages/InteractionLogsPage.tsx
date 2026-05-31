import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useInteractionLogs } from '@/hooks/queries/use-interaction-logs';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';
import { formatRelative, formatTimestamp } from '@/lib/format-date';
import type { InteractionAction, InteractionActorType, InteractionLog } from '@/types/api';

const PAGE_SIZE = 20;

const ACTION_FILTERS: { label: string; value: '' | InteractionAction }[] = [
  { label: 'All', value: '' },
  { label: 'Comment', value: 'COMMENT' },
  { label: 'Reply', value: 'REPLY' },
  { label: 'Cmt like', value: 'COMMENT_LIKE' },
  { label: 'Reaction', value: 'POST_REACTION' },
];

const ACTOR_FILTERS: { label: string; value: '' | InteractionActorType }[] = [
  { label: 'All', value: '' },
  { label: 'Anonymous', value: 'anon' },
  { label: 'User', value: 'user' },
];

const ACTION_COLOR: Record<InteractionAction, string> = {
  COMMENT: '#00FFE5',
  REPLY: '#7DCFFF',
  COMMENT_LIKE: '#FF6E96',
  POST_REACTION: '#E0AF68',
};

function chipCls(active: boolean): string {
  return `inline-flex h-8 items-center rounded-sm border px-3 font-mono text-mono-sm transition-colors ${
    active ? 'border-cyan/50 bg-cyan/[0.08] text-cyan' : 'border-b2 bg-elev text-ts hover:text-tp'
  }`;
}

function ActionBadge({ action }: { action: InteractionAction }) {
  const color = ACTION_COLOR[action];
  return (
    <span
      className="inline-flex items-center rounded-xs border font-mono text-[10px] leading-none"
      style={{ padding: '2px 6px', color, borderColor: `${color}55`, background: `${color}14` }}
    >
      {action}
    </span>
  );
}

function ActorCell({ log }: { log: InteractionLog }) {
  if (log.actor) {
    return (
      <span className="font-mono text-mono-md">
        <Link to={`/profile/${log.actor.username}`} className="text-blu hover:underline">
          ~/{log.actor.username}
        </Link>
        <span className="ml-1.5 text-ora">[{log.actorRole}]</span>
      </span>
    );
  }
  return (
    <span className="font-mono text-mono-md text-tm">
      anon{log.anonymousId ? ` · ${log.anonymousId}` : ''}
    </span>
  );
}

export default function InteractionLogsPage() {
  const [params, setParams] = useSearchParams();
  const actionParam = (params.get('action') as InteractionAction | null) ?? '';
  const actorParam = (params.get('actorType') as InteractionActorType | null) ?? '';
  const page = Number(params.get('page') ?? '1') || 1;

  const [q, setQ] = useState(params.get('q') ?? '');
  const [debouncedQ, setDebouncedQ] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: cập nhật query + sync `q` vào URL (giữ khi refresh/share — review fix).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q);
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (q) next.set('q', q);
          else next.delete('q');
          if ((prev.get('q') ?? '') !== q) next.delete('page'); // reset page khi đổi search
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, setParams]);

  const { data, isLoading, isError } = useInteractionLogs({
    action: actionParam || undefined,
    actorType: actorParam || undefined,
    q: debouncedQ || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page'); // reset page khi đổi filter
    setParams(next, { replace: true });
  }

  function goPage(p: number) {
    const next = new URLSearchParams(params);
    next.set('page', String(p));
    setParams(next, { replace: true });
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-6">
      {/* SubBar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="font-mono text-mono-lg text-cyan">~/admin/logs</span>
        <span className="font-mono text-mono-sm text-td">
          // interaction trace · non-admin actors
        </span>
        <span className="ml-auto font-mono text-mono-sm text-tm" data-testid="logs-total">
          {total} log{total === 1 ? '' : 's'}
        </span>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-mono-xs uppercase tracking-wide text-td">
            action
          </span>
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              type="button"
              onClick={() => setParam('action', f.value)}
              className={chipCls(actionParam === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-mono-xs uppercase tracking-wide text-td">actor</span>
          {ACTOR_FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              type="button"
              onClick={() => setParam('actorType', f.value)}
              className={chipCls(actorParam === f.value)}
            >
              {f.label}
            </button>
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search ip / fingerprint / anon id..."
            aria-label="Search logs"
            className="ml-auto h-8 w-[280px] max-w-full rounded-sm border border-b2 bg-bg px-3 font-mono text-mono-sm text-tp outline-none placeholder:text-td focus:border-cyan"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-12 font-mono text-mono-sm text-tm">
          <AsciiSpinner /> loading logs...
        </div>
      ) : isError ? (
        <div className="py-12 font-mono text-mono-sm text-red">// failed to load logs</div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-b2 bg-elev py-12 text-center font-mono text-mono text-tm">
          ◎ // no logs matching filters
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-b2" data-testid="logs-table">
          <div className="grid grid-cols-[110px_130px_1fr_1.7fr_0.9fr] gap-3 border-b border-b2 bg-bg px-4 py-2.5 font-mono text-mono-sm font-semibold uppercase tracking-wide text-tm">
            <span>When</span>
            <span>Action</span>
            <span>Actor</span>
            <span>IP · geo / device</span>
            <span>Target</span>
          </div>
          {items.map((log) => {
            const ip = log.ip ? log.ip.replace(/^::ffff:/, '') : '—';
            const geo = [log.geoCountry, log.geoCity].filter(Boolean).join(' · ');
            return (
              <div
                key={log.id}
                data-testid={`log-row-${log.id}`}
                className="grid grid-cols-[110px_130px_1fr_1.7fr_0.9fr] items-center gap-3 border-b border-b1 px-4 py-3.5 font-medium last:border-b-0 hover:bg-elev/50"
              >
                <span
                  className="font-mono text-mono-md text-ts"
                  title={formatTimestamp(log.createdAt)}
                >
                  {formatRelative(log.createdAt)}
                </span>
                <span>
                  <ActionBadge action={log.action} />
                </span>
                <ActorCell log={log} />
                <span className="min-w-0 font-mono text-mono-md text-tp">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold text-tp">{ip}</span>
                    {geo && <span className="text-cyan">🌐 {geo}</span>}
                  </span>
                  <span className="block truncate text-mono-sm font-normal text-tm">
                    {[log.browser, log.os].filter(Boolean).join(' · ') || log.userAgent || '—'}
                    {log.fingerprint ? ` · #${log.fingerprint}` : ''}
                  </span>
                </span>
                <span className="min-w-0 truncate font-mono text-mono-md text-ts">
                  {log.postId ? (
                    <Link to={`/post/${log.postId}`} className="text-cyan hover:underline">
                      {log.targetType.toLowerCase()} → {log.targetId.slice(-6)}
                    </Link>
                  ) : (
                    `${log.targetType.toLowerCase()} → ${log.targetId.slice(-6)}`
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 font-mono text-mono-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => goPage(page - 1)}
            className="rounded-sm border border-b2 px-3 py-1 text-ts disabled:opacity-40 enabled:hover:text-cyan"
          >
            ← prev
          </button>
          <span className="text-tm" data-testid="logs-page-indicator">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => goPage(page + 1)}
            className="rounded-sm border border-b2 px-3 py-1 text-ts disabled:opacity-40 enabled:hover:text-cyan"
          >
            next →
          </button>
        </div>
      )}
    </div>
  );
}
