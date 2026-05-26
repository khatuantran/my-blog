import { useEffect, useRef } from 'react';

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

// EmojiPicker (T-366) — inline 4-group stack per DESIGN_SYSTEM L510 + design-file v2.
// Replaces the previous tabbed popup. Renders below editor toolbar pushing content down
// (NOT absolute positioned) so layout flows naturally without overlap concerns.
export function EmojiPicker({ open, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Emoji picker"
      data-testid="emoji-picker"
      className="mt-2 rounded-lg border border-b2 bg-surf p-3"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-mono-tiny uppercase tracking-wide-3 text-td">
          // pick an emoji
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close emoji picker"
          data-testid="emoji-picker-close"
          className="rounded-sm border border-b2 bg-elev px-2 py-0.5 font-mono text-mono-sm text-tm hover:text-tp"
        >
          ×
        </button>
      </div>

      {GROUPS.map((group) => (
        <section
          key={group.label}
          data-testid={`emoji-picker-group-${group.label}`}
          className="mb-3 last:mb-0"
        >
          <div className="mb-1 font-mono text-mono-tiny uppercase tracking-wide-2 text-tm">
            // {group.label}
          </div>
          <div role="grid" aria-label={`${group.label} emojis`} className="grid grid-cols-8 gap-1">
            {group.emojis.map((em) => (
              <button
                key={em}
                type="button"
                role="gridcell"
                aria-label={`Insert ${em}`}
                onClick={() => onSelect(em)}
                className="flex h-7 w-7 items-center justify-center rounded-sm text-base hover:bg-over"
              >
                {em}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
