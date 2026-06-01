import { useEffect, useState } from 'react';
import { ApiError } from '@/services/api/client';
import { MOOD_CFG, MOOD_KEYS } from '@/lib/mood-config';
import { useUpdateAdminPost } from '@/hooks/queries/use-admin-posts';
import type { AdminPost, Mood, PostStatus } from '@/types/api';

type Props = {
  post: AdminPost | null;
  onClose: () => void;
  onSaved?: () => void;
};

const STATUS_OPTIONS: PostStatus[] = ['PUBLISHED', 'DRAFT', 'ARCHIVED'];

export function QuickEditModal({ post, onClose, onSaved }: Props) {
  const [status, setStatus] = useState<PostStatus>('PUBLISHED');
  const [mood, setMood] = useState<Mood>('HAPPY');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const updateMut = useUpdateAdminPost();

  useEffect(() => {
    if (!post) return;
    setStatus(post.status);
    setMood(post.mood);
    setContent(post.content);
    setTags(post.tags.map((t) => t.name));
    setError(null);
    setTagInput('');
  }, [post]);

  useEffect(() => {
    if (!post) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [post, onClose]);

  if (!post) return null;

  function addTag(raw: string) {
    const name = raw.trim().toLowerCase().replace(/^#/, '');
    if (!name || tags.includes(name)) return;
    setTags((t) => [...t, name]);
    setTagInput('');
  }

  function removeTag(name: string) {
    setTags((t) => t.filter((x) => x !== name));
  }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((t) => t.slice(0, -1));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!post) return;
    setError(null);
    updateMut.mutate(
      { id: post.id, body: { status, mood, content, tags } },
      {
        onSuccess: () => {
          onSaved?.();
          onClose();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 400) {
            setError('Invalid input — check content or tags.');
          } else {
            setError(err.message);
          }
        },
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit post ${post.id}`}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[560px] max-w-full overflow-hidden rounded-md border border-cyan/25 bg-elev shadow-glow-cyan-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-b2 px-4 py-3">
          <div className="font-mono text-mono-sm text-tm">
            // edit.post <span className="text-cyan">#{post.id.slice(-8)}</span>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="rounded-sm border border-b2 bg-surf px-2 py-0.5 font-mono text-mono-sm text-tm hover:text-tp"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Status */}
          <div>
            <label className="mb-1 block font-mono text-mono-sm text-tm">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PostStatus)}
              aria-label="Post status"
              className="w-full rounded-sm border border-b2 bg-bg px-3 py-1.5 font-mono text-mono-sm text-tp outline-none focus:border-cyan"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Mood */}
          <div>
            <div className="mb-1 font-mono text-mono-sm text-tm">Mood</div>
            <div className="flex gap-1.5" role="group" aria-label="Select mood">
              {MOOD_KEYS.map((m) => {
                const cfg = MOOD_CFG[m];
                return (
                  <button
                    key={m}
                    type="button"
                    aria-label={cfg.label}
                    aria-pressed={mood === m}
                    onClick={() => setMood(m)}
                    className={`rounded-sm border px-2 py-1 text-base transition-colors ${
                      mood === m
                        ? 'border-cyan/50 bg-cyan/10 text-tp'
                        : 'border-b2 text-tm hover:border-b3'
                    }`}
                  >
                    {cfg.emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="mb-1 block font-mono text-mono-sm text-tm">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full resize-y rounded-sm border border-b2 bg-bg px-3 py-2 font-mono text-mono-sm text-tp outline-none focus:border-cyan"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="mb-1 font-mono text-mono-sm text-tm">Tags</div>
            <div
              className="rounded-sm border border-b2 bg-bg px-2 py-1.5"
              data-testid="tag-chip-input"
            >
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-sm border border-cyan/30 bg-cyan/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-cyan"
                  >
                    #{t}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      onClick={() => removeTag(t)}
                      className="opacity-60 hover:opacity-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  aria-label="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  placeholder="❯ add tag..."
                  className="min-w-[100px] flex-1 bg-transparent font-mono text-mono-sm text-tp outline-none placeholder:text-td"
                />
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-sm border border-red/40 bg-red/[0.08] px-3 py-2 font-mono text-mono-sm text-red"
            >
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-b2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-b2 px-4 py-1.5 font-mono text-mono-sm text-tm hover:text-tp"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="rounded-sm border border-cyan/50 bg-cyan/10 px-4 py-1.5 font-mono text-mono-sm text-cyan hover:bg-cyan/20 disabled:opacity-50"
            >
              {updateMut.isPending ? '⠋ saving...' : '✓ Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
