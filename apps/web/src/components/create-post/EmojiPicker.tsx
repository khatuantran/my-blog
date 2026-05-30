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
      className="-mt-1.5 mb-1.5 rounded-b-md border border-t-0 bg-elev px-3 py-2.5"
      style={{ borderColor: 'rgba(0,255,229,0.25)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-mono-tiny uppercase tracking-wide-3 text-td">
          // emoji.picker · click to insert
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close emoji picker"
          data-testid="emoji-picker-close"
          className="font-mono text-[15px] leading-none text-tm hover:text-tp"
        >
          ×
        </button>
      </div>

      {/* Groups xếp ngang (design L632): flex gap-4, mỗi group flex 1 1 200px */}
      <div className="flex flex-wrap gap-4">
        {GROUPS.map((group) => (
          <section
            key={group.label}
            data-testid={`emoji-picker-group-${group.label}`}
            className="min-w-[180px] grow basis-[200px]"
          >
            <div className="mb-1 font-mono text-[10px] text-td">{group.label}</div>
            <div
              role="grid"
              aria-label={`${group.label} emojis`}
              className="flex flex-wrap gap-0.5"
            >
              {group.emojis.map((em) => (
                <button
                  key={em}
                  type="button"
                  role="gridcell"
                  aria-label={`Insert ${em}`}
                  onClick={() => onSelect(em)}
                  className="flex h-7 w-7 items-center justify-center rounded-[5px] text-[17px] hover:bg-over"
                >
                  {em}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
