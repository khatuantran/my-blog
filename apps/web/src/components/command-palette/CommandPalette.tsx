import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { filterCommands, groupCommands, type Command } from './commands';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered: Command[] = useMemo(() => filterCommands(query), [query]);
  const groups = useMemo(() => groupCommands(filtered), [filtered]);

  // Reset state mỗi lần open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      // Focus input next tick để portal mount xong
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open]);

  // Clamp selected index khi filtered list thay đổi
  useEffect(() => {
    if (selected >= filtered.length) setSelected(Math.max(0, filtered.length - 1));
  }, [filtered.length, selected]);

  // Keyboard nav (Esc / arrows / enter)
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
        return;
      }
      if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault();
        const cmd = filtered[selected];
        onClose();
        navigate(cmd.to);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selected, onClose, navigate]);

  if (!open) return null;

  // Build flat list index map (group renders nested but selection is flat across)
  let runningIdx = -1;

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-start justify-center pt-[100px] animate-fade-up"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[560px] max-w-[90vw] bg-elev rounded-[10px] overflow-hidden"
        style={{
          border: '1px solid rgba(0,255,229,.35)',
          boxShadow: '0 0 40px rgba(0,255,229,.15),0 24px 64px rgba(0,0,0,.6)',
        }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-b2">
          <span className="font-mono text-mono-lg text-cyan shrink-0">~$</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="type a command or search..."
            aria-label="Command query"
            className="flex-1 bg-transparent border-none outline-none font-mono text-mono-lg text-tp placeholder:text-tm"
          />
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-mono-sm text-tm bg-over border border-b2 rounded-[3px] px-[7px] py-[2px] cursor-pointer hover:text-tp"
          >
            Esc
          </button>
        </div>

        <div className="max-h-[340px] overflow-y-auto">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <div className="font-mono text-mono-sm text-tm px-4 pt-2.5 pb-1 tracking-[0.05em]">
                // {group}
              </div>
              {items.map((cmd) => {
                runningIdx += 1;
                const isSel = runningIdx === selected;
                const idx = runningIdx;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setSelected(idx)}
                    onClick={() => {
                      onClose();
                      navigate(cmd.to);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 cursor-pointer transition-colors text-left ${
                      isSel ? 'bg-cyan/[0.08]' : 'hover:bg-cyan/[0.08]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-[5px] bg-over flex items-center justify-center text-[13px] shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-tp">{cmd.label}</div>
                      {cmd.desc && <div className="font-mono text-mono-sm text-tm">{cmd.desc}</div>}
                    </div>
                    {cmd.keys && (
                      <div className="flex gap-1">
                        {cmd.keys.map((k, i) => (
                          <span
                            key={i}
                            className="font-mono text-mono-sm text-ts bg-over border border-b2 rounded-[3px] px-1.5 py-[1px]"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center font-mono text-mono text-tm">
              // no results for &quot;{query}&quot;
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-b1 flex gap-4 font-mono text-mono-sm text-tm">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
          <span className="ml-auto">// command.palette v1</span>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
