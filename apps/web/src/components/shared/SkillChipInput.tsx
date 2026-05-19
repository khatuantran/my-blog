import { useState } from 'react';
import { TAG_COLORS } from '@/lib/tag-colors';
import type { Skill } from '@/types/api';

type Props = {
  value: Skill[];
  onChange: (next: Skill[]) => void;
  max?: number;
};

export function SkillChipInput({ value, onChange, max = 20 }: Props) {
  const [input, setInput] = useState('');

  function add(raw: string) {
    const name = raw.trim().slice(0, 32);
    if (!name) return;
    if (value.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    if (value.length >= max) return;
    const color = TAG_COLORS[value.length % TAG_COLORS.length];
    onChange([...value, { name, color }]);
    setInput('');
  }

  function remove(name: string) {
    onChange(value.filter((s) => s.name !== name));
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="rounded-sm border border-b2 bg-bg p-2" data-testid="skill-chip-input">
      <div className="flex flex-wrap gap-1.5">
        {value.map((s) => (
          <span
            key={s.name}
            className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-mono-xs"
            style={{
              color: s.color,
              borderColor: `${s.color}50`,
              background: `${s.color}10`,
            }}
          >
            {s.name}
            <button
              type="button"
              aria-label={`Remove ${s.name}`}
              onClick={() => remove(s.name)}
              className="opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          aria-label="Add skill"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="❯ add skill..."
          maxLength={32}
          className="min-w-[120px] flex-1 bg-transparent font-mono text-mono-xs text-tp outline-none placeholder:text-td"
          disabled={value.length >= max}
        />
      </div>
      <div className="mt-1 text-right font-mono text-mono-xs text-td">
        // max {max} · {value.length} used
      </div>
    </div>
  );
}
