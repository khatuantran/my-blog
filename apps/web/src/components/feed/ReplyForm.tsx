import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCreateComment } from '@/hooks/mutations/use-create-comment';

type Props = {
  postId: string;
  parentId: string;
  parentUsername: string;
  onClose: () => void;
};

const CONTENT_MAX = 1000;
const ANON_NAME_MAX = 30;

export function ReplyForm({ postId, parentId, parentUsername, onClose }: Props) {
  const { isAuthed, user } = useAuth();
  const [content, setContent] = useState('');
  const [asAnon, setAsAnon] = useState(!isAuthed);
  const [anonName, setAnonName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const m = useCreateComment();

  // Auto-focus textarea on open
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Esc → cancel
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = content.trim();
  const showAnonInput = asAnon || !isAuthed;
  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= CONTENT_MAX &&
    (!showAnonInput || anonName.trim().length > 0) &&
    !m.isPending;

  function submit() {
    if (!canSubmit) return;
    m.mutate(
      {
        postId,
        dto: {
          content: trimmed,
          parentId,
          ...(showAnonInput ? { anonymousName: anonName.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          setContent('');
          if (!isAuthed) setAnonName('');
          onClose();
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // ⌘↵ / Ctrl+↵ → submit
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      data-testid={`reply-form-${parentId}`}
      className="rounded-md border border-cyan/30 bg-bg/40 p-3"
      aria-label={`Reply to ${parentUsername}`}
    >
      <div className="mb-2 flex items-center gap-1.5 font-mono text-mono-sm text-blu">
        <span>↩</span>
        <span>
          replying to <span className="text-cyan">@{parentUsername}</span>
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`// reply to @${parentUsername}...`}
        aria-label="Reply text"
        maxLength={CONTENT_MAX}
        rows={2}
        data-testid={`reply-textarea-${parentId}`}
        className="w-full resize-y rounded-md border border-b2 bg-bg p-2.5 font-sans text-mono-md text-tp outline-none placeholder:text-tm focus:border-cyan focus:shadow-glow-cyan-sm"
      />

      <div className="mt-2 flex items-center gap-2">
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
            className="max-w-[140px] flex-1 rounded-sm border border-b2 bg-bg px-2 py-0.5 font-mono text-mono-sm text-tp outline-none placeholder:text-tm focus:border-cyan"
          />
        )}

        {isAuthed && (
          <button
            type="button"
            onClick={() => setAsAnon((v) => !v)}
            aria-pressed={asAnon}
            className={`rounded-sm border px-1.5 py-0.5 font-mono text-mono-sm transition-colors ${
              asAnon
                ? 'border-cyan/50 bg-cyan/10 text-cyan'
                : 'border-b2 bg-elev text-tm hover:text-tp'
            }`}
          >
            [as anon]
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          data-testid={`reply-cancel-${parentId}`}
          className="ml-auto rounded-sm border border-b2 bg-transparent px-2 py-0.5 font-mono text-mono-sm text-tm hover:text-tp"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          data-testid={`reply-submit-${parentId}`}
          className="rounded-sm border border-cyan/50 bg-cyan/10 px-2.5 py-0.5 font-mono text-mono-sm text-cyan transition-all hover:bg-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ⌘↵ Reply
        </button>
      </div>

      {m.isError && (
        <div className="mt-1.5 font-mono text-mono-sm text-red">// failed — try again</div>
      )}
    </form>
  );
}
