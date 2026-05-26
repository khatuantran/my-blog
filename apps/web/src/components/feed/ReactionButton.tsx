import { useState, useEffect } from 'react';
import { useUpsertReaction, useRemoveReaction } from '@/hooks/mutations/use-reaction';
import { ApiError } from '@/services/api/client';
import { REACTION_CONFIG } from '@/lib/reaction-config';
import { ReactionPicker } from './ReactionPicker';
import { ReactionList } from './ReactionList';
import { ReactionIcon } from './ReactionIcon';
import type { ReactionType } from '@/types/api';

type Props = {
  postId: string;
  myReaction: ReactionType | null;
  topReactions: ReactionType[];
  count: number;
};

type Optimistic = {
  myReaction: ReactionType | null;
  topReactions: ReactionType[];
  count: number;
};

// Local optimistic mirror of props — like LikeButton pattern. Server settles via
// query invalidation; when parent re-passes props, reset optimistic.
export function ReactionButton({ postId, myReaction, topReactions, count }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [gone, setGone] = useState(false);
  const [opt, setOpt] = useState<Optimistic | null>(null);
  const upsert = useUpsertReaction();
  const remove = useRemoveReaction();

  useEffect(() => {
    setOpt(null);
  }, [myReaction, topReactions, count]);

  const active = opt ? opt.myReaction : myReaction;
  const displayTop = opt ? opt.topReactions : topReactions;
  const displayCount = opt ? opt.count : count;
  const activeCfg = active ? REACTION_CONFIG[active] : null;

  function computeOptimistic(next: ReactionType | null): Optimistic {
    const wasActive = !!active;
    const willBeActive = !!next;
    const delta = (willBeActive ? 1 : 0) - (wasActive ? 1 : 0);
    let top = displayTop;
    if (next && !displayTop.includes(next)) top = [next, ...displayTop].slice(0, 3);
    if (!next && active) top = displayTop.filter((t) => t !== active);
    return { myReaction: next, topReactions: top, count: Math.max(0, displayCount + delta) };
  }

  function handleClick() {
    if (gone) return;
    if (active) {
      const snapshot = opt;
      setOpt(computeOptimistic(null));
      remove.mutate({ postId, currentType: active }, { onError: () => setOpt(snapshot) });
    } else {
      pickReaction('LIKE');
    }
  }

  function pickReaction(type: ReactionType) {
    setPickerOpen(false);
    if (active === type) {
      const snapshot = opt;
      setOpt(computeOptimistic(null));
      remove.mutate({ postId, currentType: active }, { onError: () => setOpt(snapshot) });
      return;
    }
    const snapshot = opt;
    setOpt(computeOptimistic(type));
    upsert.mutate(
      { postId, type, currentType: active },
      {
        onError: (err) => {
          setOpt(snapshot);
          if (err instanceof ApiError && err.status === 410) setGone(true);
        },
      },
    );
  }

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => !gone && setPickerOpen(true)}
      onMouseLeave={() => setPickerOpen(false)}
    >
      <ReactionPicker open={pickerOpen} selected={active} onPick={pickReaction} />
      {pickerOpen && <div aria-hidden="true" className="absolute bottom-full left-0 right-0 h-3" />}
      {/* Merged React button + inline count per design-file Feed.html L893-901.
          Whole button toggles reaction. The `· {count}` portion is a nested span
          with stopPropagation that opens ReactionList modal — keeps detail view
          accessible without a separate count badge button. */}
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={!!active}
        aria-label={
          active
            ? `Remove ${REACTION_CONFIG[active].label} reaction`
            : 'React to post — default Like'
        }
        disabled={gone}
        data-testid={`reaction-button-${postId}`}
        className={`flex items-center gap-1 rounded-sm border-none bg-transparent px-2.5 py-1 font-mono text-mono cursor-pointer transition-colors hover:bg-elev ${
          active ? 'text-tp' : 'text-tm hover:text-tp'
        } ${gone ? 'cursor-not-allowed opacity-50' : ''}`}
        style={
          activeCfg
            ? { color: activeCfg.color, textShadow: `0 0 8px ${activeCfg.color}60` }
            : undefined
        }
      >
        <span aria-hidden="true" className="inline-flex">
          <ReactionIcon r={activeCfg ?? REACTION_CONFIG.LIKE} size={16} glow={!!activeCfg} />
        </span>
        <span>{activeCfg ? activeCfg.label : 'React'}</span>
        {displayCount > 0 && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`View ${displayCount} reactions`}
            data-testid={`reaction-count-${postId}`}
            onClick={(e) => {
              e.stopPropagation();
              setListOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setListOpen(true);
              }
            }}
            className="ml-1 text-td hover:text-tp hover:underline cursor-pointer"
          >
            · {displayCount}
          </span>
        )}
      </button>{' '}
      {gone && (
        <span className="ml-2 font-mono text-mono-sm text-red" role="alert">
          // reactions endpoint unavailable
        </span>
      )}
      {listOpen && <ReactionList postId={postId} onClose={() => setListOpen(false)} />}
    </div>
  );
}
