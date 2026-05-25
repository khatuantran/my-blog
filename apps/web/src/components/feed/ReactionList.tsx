import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReactionList } from '@/hooks/queries/use-reaction-list';
import { REACTION_CONFIG, REACTION_LIST } from '@/lib/reaction-config';
import type { ReactionType } from '@/types/api';

type Props = {
  postId: string;
  onClose: () => void;
};

type Tab = 'ALL' | ReactionType;

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ReactionList({ postId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('ALL');
  const params = tab === 'ALL' ? { page: 1, limit: 20 } : { type: tab, page: 1, limit: 20 };
  const { data, isLoading } = useReactionList(postId, params);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const total = data?.byType
    ? REACTION_LIST.reduce((sum, r) => sum + (data.byType[r.type] ?? 0), 0)
    : 0;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reactions list"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="reaction-list-modal"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[480px] max-w-[92vw] rounded-lg border border-b2 bg-surf shadow-glow-cyan-lg"
      >
        <header className="flex items-center justify-between border-b border-b2 px-4 py-3 font-mono text-mono-sm text-tp">
          <span>// reactions · {total}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reactions"
            className="rounded-sm border-none bg-transparent px-2 py-0.5 text-tm cursor-pointer hover:bg-elev hover:text-tp"
          >
            ✕
          </button>
        </header>

        <div
          role="tablist"
          aria-label="Reaction type"
          className="flex gap-1 overflow-x-auto border-b border-b2 px-3 py-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'ALL'}
            onClick={() => setTab('ALL')}
            data-testid="reaction-tab-ALL"
            className={`rounded-sm border border-b2 bg-elev px-2.5 py-1 font-mono text-mono-sm cursor-pointer ${
              tab === 'ALL' ? 'border-cyan/50 text-cyan' : 'text-tm hover:text-tp'
            }`}
          >
            All ({total})
          </button>
          {REACTION_LIST.map((r) => {
            const n = data?.byType[r.type] ?? 0;
            return (
              <button
                key={r.type}
                type="button"
                role="tab"
                aria-selected={tab === r.type}
                onClick={() => setTab(r.type)}
                data-testid={`reaction-tab-${r.type}`}
                className={`rounded-sm border border-b2 bg-elev px-2.5 py-1 font-mono text-mono-sm cursor-pointer ${
                  tab === r.type ? 'border-cyan/50 text-cyan' : 'text-tm hover:text-tp'
                }`}
              >
                <span aria-hidden="true">{r.emoji}</span> {r.label} ({n})
              </button>
            );
          })}
        </div>

        <ul className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {isLoading && (
            <li className="py-6 text-center font-mono text-mono-sm text-tm">⠋ loading...</li>
          )}
          {!isLoading && data && data.items.length === 0 && (
            <li className="py-6 text-center font-mono text-mono-sm text-td">
              // no reactions of this type yet
            </li>
          )}
          {!isLoading &&
            data?.items.map((item, idx) => {
              const cfg = REACTION_CONFIG[item.type];
              return (
                <li
                  key={`${item.actor?.id ?? 'anon'}-${idx}`}
                  className="flex items-center gap-3 py-2"
                >
                  <span aria-hidden="true" className="text-base">
                    {cfg.emoji}
                  </span>
                  <span className="flex-1 font-mono text-mono-sm text-tp">
                    {item.actor?.username ?? '(anonymous)'}
                  </span>
                  <span className="font-mono text-mono-sm text-td">
                    {formatRelative(item.createdAt)}
                  </span>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(modal, document.body);
}
