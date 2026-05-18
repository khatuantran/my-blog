import { useState, type KeyboardEvent } from 'react';
import { TagPill } from '@/components/shared/TagPill';
import { normalizeTagName, pickTagColor } from '@/lib/tag-colors';

export type TagDraft = { name: string; color: string };

type Props = {
  value: TagDraft[];
  onChange: (next: TagDraft[]) => void;
  maxCount?: number;
};

const MAX_TAGS = 10;

export function TagInput({ value, onChange, maxCount = MAX_TAGS }: Props) {
  const [input, setInput] = useState('');

  function addTag(raw: string) {
    const name = normalizeTagName(raw);
    if (!name) return;
    if (value.some((t) => t.name === name)) return;
    if (value.length >= maxCount) return;
    const color = pickTagColor(value.length);
    onChange([...value, { name, color }]);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
        setInput('');
      }
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      // Remove last tag
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(name: string) {
    const next = value
      .filter((t) => t.name !== name)
      // Re-assign colors theo index sau khi remove
      .map((t, i) => ({ ...t, color: pickTagColor(i) }));
    onChange(next);
  }

  const full = value.length >= maxCount;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-b2 bg-bg px-2.5 py-2 focus-within:border-cyan focus-within:shadow-glow-cyan-sm">
        {value.map((t) => (
          <span key={t.name} className="inline-flex items-center gap-1">
            <TagPill name={t.name} color={t.color} />
            <button
              type="button"
              onClick={() => removeTag(t.name)}
              aria-label={`Remove tag #${t.name}`}
              className="border-none bg-transparent font-mono text-mono-xs text-tm hover:text-red"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={full ? '// max reached' : '❯ add tag...'}
          aria-label="Tag input"
          disabled={full}
          className="min-w-[120px] flex-1 border-none bg-transparent font-mono text-mono-sm text-tp outline-none placeholder:text-tm disabled:opacity-50"
        />
      </div>
      <div className="mt-1.5 font-mono text-mono-xs text-tm">
        Press Enter, comma or space · {value.length}/{maxCount}
      </div>
    </div>
  );
}
