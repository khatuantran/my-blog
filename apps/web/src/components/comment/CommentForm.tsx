import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCreateComment } from '@/hooks/mutations/use-create-comment';

type Props = {
  postId: string;
};

const ANON_NAME_MAX = 30;
const CONTENT_MAX = 1000;

export function CommentForm({ postId }: Props) {
  const { isAuthed, user } = useAuth();
  const [content, setContent] = useState('');
  const [asAnon, setAsAnon] = useState(!isAuthed);
  const [anonName, setAnonName] = useState('');
  const m = useCreateComment();

  const trimmed = content.trim();
  const showAnonInput = asAnon || !isAuthed;
  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= CONTENT_MAX &&
    (!showAnonInput || anonName.trim().length > 0) &&
    !m.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    m.mutate(
      {
        postId,
        dto: {
          content: trimmed,
          ...(showAnonInput ? { anonymousName: anonName.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          setContent('');
          if (!isAuthed) setAnonName('');
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-b2 bg-surf p-4"
      aria-label="Add comment"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="// add a comment..."
        aria-label="Comment text"
        maxLength={CONTENT_MAX}
        rows={3}
        className="w-full resize-y rounded-md border border-b2 bg-bg p-3 font-sans text-[13px] text-tp outline-none placeholder:text-tm focus:border-cyan focus:shadow-glow-cyan-sm"
      />

      <div className="mt-3 flex items-center gap-3">
        <span className="font-mono text-mono-sm text-tm">as:</span>
        {isAuthed && !asAnon ? (
          <span className="font-mono text-mono-sm text-blu">~/{user?.username}</span>
        ) : (
          <input
            type="text"
            value={anonName}
            onChange={(e) => setAnonName(e.target.value)}
            placeholder="Anon#____"
            aria-label="Anonymous name"
            maxLength={ANON_NAME_MAX}
            className="flex-1 max-w-[180px] rounded-sm border border-b2 bg-bg px-2 py-1 font-mono text-mono-sm text-tp outline-none placeholder:text-tm focus:border-cyan"
          />
        )}

        {isAuthed && (
          <button
            type="button"
            onClick={() => setAsAnon((v) => !v)}
            className={`rounded-sm border px-2 py-1 font-mono text-mono-xs transition-colors ${
              asAnon
                ? 'border-cyan/50 bg-cyan/10 text-cyan'
                : 'border-b2 bg-elev text-tm hover:text-tp'
            }`}
            aria-pressed={asAnon}
          >
            [as anon]
          </button>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="ml-auto rounded-sm border border-cyan/50 bg-cyan/10 px-3 py-1 font-mono text-mono-sm text-cyan transition-all hover:bg-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↵ Send
        </button>
      </div>

      {m.isError && (
        <div className="mt-2 font-mono text-mono-xs text-red">
          // failed to post comment — try again
        </div>
      )}
    </form>
  );
}
