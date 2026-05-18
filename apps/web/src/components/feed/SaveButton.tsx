import { useState, useEffect } from 'react';
import { useTogglePostSave } from '@/hooks/mutations/use-save';

type Props = {
  postId: string;
  saved: boolean;
};

export function SaveButton({ postId, saved }: Props) {
  const m = useTogglePostSave();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  useEffect(() => {
    setOptimistic(null);
  }, [saved]);

  const display = optimistic ?? saved;

  function handle() {
    setOptimistic(!display);
    m.mutate(
      { postId, currentlySaved: display },
      {
        onError: () => setOptimistic(null),
      },
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={display}
      aria-label={display ? 'Unsave post' : 'Save post'}
      className={`flex items-center gap-1 rounded-sm border-none bg-transparent px-2.5 py-1 font-mono text-mono cursor-pointer transition-all hover:bg-elev hover:text-tp ${
        display ? 'text-yel' : 'text-tm'
      }`}
    >
      <span className="text-sm">{display ? '🔖' : '🏷'}</span>
    </button>
  );
}
