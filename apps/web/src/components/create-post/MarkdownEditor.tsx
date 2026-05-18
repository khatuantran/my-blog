import { useRef } from 'react';
import { wrapSelection } from '@/lib/insert-at-cursor';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

type ToolbarBtn = {
  label: string;
  ariaLabel: string;
  before: string;
  after: string;
};

const TOOLBAR: ToolbarBtn[] = [
  { label: 'B', ariaLabel: 'Bold', before: '**', after: '**' },
  { label: 'I', ariaLabel: 'Italic', before: '_', after: '_' },
  { label: '`code`', ariaLabel: 'Inline code', before: '`', after: '`' },
  { label: '# h', ariaLabel: 'Heading', before: '# ', after: '' },
  { label: '[ ](url)', ariaLabel: 'Link', before: '[', after: '](url)' },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '~$ start writing...',
  minHeight = 280,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function applyWrap(before: string, after: string) {
    const ta = ref.current;
    if (!ta) return;
    const {
      value: next,
      selectionStart,
      selectionEnd,
    } = wrapSelection(value, ta.selectionStart, ta.selectionEnd, before, after);
    onChange(next);
    // Restore selection sau React update
    queueMicrotask(() => {
      ta.focus();
      ta.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {TOOLBAR.map((btn) => (
          <button
            key={btn.label}
            type="button"
            aria-label={btn.ariaLabel}
            onClick={() => applyWrap(btn.before, btn.after)}
            className="rounded-sm border border-b2 bg-elev px-2 py-1 font-mono text-mono-sm text-tm transition-colors hover:border-b3 hover:text-tp"
          >
            {btn.label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Post content"
        style={{ minHeight }}
        className="w-full resize-y rounded-md border border-b2 bg-bg p-3 font-sans text-[14px] leading-[1.65] text-tp outline-none placeholder:text-tm focus:border-cyan focus:shadow-glow-cyan-sm"
      />
      <div className="mt-1.5 font-mono text-mono-xs text-tm">
        // markdown supported · {value.length} chars
      </div>
    </div>
  );
}
