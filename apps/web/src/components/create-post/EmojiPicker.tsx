import { useEffect, useRef, useState } from 'react';

type Group = { label: string; emojis: string[] };

// Exact emoji set per design-file/MyBlog Create Post.html L186-189.
const GROUPS: Group[] = [
  {
    label: 'faces',
    emojis: [
      '😊',
      '😂',
      '🤔',
      '😅',
      '😭',
      '🥹',
      '😍',
      '🤩',
      '😎',
      '😏',
      '🫡',
      '🥲',
      '😤',
      '😠',
      '🙄',
      '🤯',
    ],
  },
  {
    label: 'hands',
    emojis: [
      '👋',
      '✌️',
      '🤙',
      '👍',
      '👎',
      '🙏',
      '💪',
      '🤝',
      '✨',
      '❤️',
      '🔥',
      '💯',
      '⚡',
      '🎉',
      '🚀',
      '💡',
    ],
  },
  {
    label: 'dev',
    emojis: [
      '💻',
      '⌨️',
      '🖥️',
      '🖱️',
      '📱',
      '🔧',
      '⚙️',
      '🐛',
      '🧪',
      '📦',
      '🔑',
      '🛡️',
      '⚠️',
      '✅',
      '❌',
      '🔄',
    ],
  },
  {
    label: 'nature',
    emojis: [
      '☕',
      '🍵',
      '🌙',
      '☀️',
      '🌧️',
      '🌈',
      '🌊',
      '🔮',
      '💎',
      '🎯',
      '🎨',
      '📸',
      '🎵',
      '📚',
      '🗒️',
      '📌',
    ],
  },
];

type Props = {
  open: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export function EmojiPicker({ open, onSelect, onClose }: Props) {
  const [activeGroup, setActiveGroup] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Emoji picker"
      className="absolute z-30 mt-1 w-[320px] rounded-lg border border-b2 bg-surf p-2 shadow-xl"
    >
      <div role="tablist" className="mb-2 flex gap-1 border-b border-b2">
        {GROUPS.map((g, i) => (
          <button
            key={g.label}
            role="tab"
            type="button"
            aria-selected={activeGroup === i}
            onClick={() => setActiveGroup(i)}
            className={`-mb-px border-b-2 px-3 py-1 font-mono text-mono-sm transition-colors ${
              activeGroup === i
                ? 'border-cyan text-cyan'
                : 'border-transparent text-tm hover:text-ts'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div
        role="grid"
        aria-label={`${GROUPS[activeGroup].label} emojis`}
        className="grid grid-cols-8 gap-1"
      >
        {GROUPS[activeGroup].emojis.map((em) => (
          <button
            key={em}
            type="button"
            role="gridcell"
            aria-label={`Insert ${em}`}
            onClick={() => onSelect(em)}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-base hover:bg-cyan/10"
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  );
}
